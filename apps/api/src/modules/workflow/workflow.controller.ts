import { Body, Controller, Get, Param, Post, UseGuards, Sse, MessageEvent } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WorkflowResponse, WorkflowService } from './workflow.service';
import { Observable } from 'rxjs';

@Controller('workflow')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('create')
  create(@Body() dto: CreateWorkflowDto): Promise<WorkflowResponse> {
    return this.workflowService.create(dto);
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string): Promise<WorkflowResponse> {
    return this.workflowService.getStatus(id);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    return this.workflowService.streamWorkflow(id);
  }
}
