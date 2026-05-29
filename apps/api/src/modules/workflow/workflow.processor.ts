import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { createAgentGraph, AgentStateType } from '@brand-flow/agent';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { RUN_WORKFLOW_JOB, WORKFLOW_QUEUE } from './workflow.constants';
import { Workflow, WorkflowDocument } from './schemas/workflow.schema';

interface RunWorkflowJobData {
  workflowId: string;
}

@Processor(WORKFLOW_QUEUE)
export class WorkflowProcessor extends WorkerHost {
  constructor(
    @InjectModel(Workflow.name)
    private readonly workflowModel: Model<WorkflowDocument>,
  ) {
    super();
  }

  async process(job: Job<RunWorkflowJobData>): Promise<AgentStateType | void> {
    if (job.name !== RUN_WORKFLOW_JOB) return;

    const workflow = await this.workflowModel.findById(job.data.workflowId);
    if (!workflow) return;

    await this.workflowModel.findByIdAndUpdate(workflow._id, {
      status: 'running',
      $unset: { errorMessage: 1 },
    });

    try {
      const graph = createAgentGraph();
      const initialState: Partial<AgentStateType> = {
        userQuery: workflow.prompt,
        context: {
          spaceId: workflow.spaceId,
        },
        retryCount: 0,
        status: "running",
      };

      let finalState: AgentStateType | undefined;

      // Stream each step and emit progress
      const stream = await graph.stream(initialState);
      for await (const chunk of stream) {
        await job.updateProgress(chunk);
        finalState = Object.values(chunk)[0] as AgentStateType; 
        // Note: graph.stream yields `{ nodeName: stateUpdate }`
      }

      const isSuccess = finalState?.status === 'success' || (finalState?.evaluationResult?.overallScore && finalState.evaluationResult.overallScore >= 4);

      await this.workflowModel.findByIdAndUpdate(workflow._id, {
        status: isSuccess ? 'completed' : 'failed',
        result: finalState,
        $unset: { errorMessage: 1 },
      });

      return finalState;
    } catch (error) {
      await this.workflowModel.findByIdAndUpdate(workflow._id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '工作流执行失败',
      });
      throw error;
    }
  }
}
