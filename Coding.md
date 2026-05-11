# Brand-Flow AI 前端代码风格指南

本指南旨在规范 Brand-Flow AI 项目组的前端代码风格，保证代码的可读性、可维护性和团队协作效率。项目基于 **React + TypeScript + Vite + Zustand + Ant Design** 技术栈。

## 1. 命名规范

### 1.1 变量与函数（camelCase）

```typescript
const [activeNodeId, setActiveNodeId] = useState<string>('');
const isCanvasLoading = false;

// 事件处理函数使用 handle 前缀
const handleNodeDragStart = (event: React.MouseEvent) => {};
// API 调用函数使用动词前缀 (get/post/query/update)
const fetchWorkflowData = async () => {};
```

### 1.2 组件命名（PascalCase）

```typescript
const CanvasWorkspace = () => {};
const NodeConfigPanel = () => {};
```

### 1.3 常量命名（UPPER_SNAKE_CASE）

```typescript
export const DEFAULT_CANVAS_ZOOM = 1.5;
export const MAX_HISTORY_STEPS = 20;
```

## 2. TypeScript 使用规范

### 2.1 组件与类型定义

统一使用 `React.FC<Props>` 定义函数组件，强制提取 `interface` 或 `type`。

```typescript
import type { FC, ReactNode } from 'react';
import type { Node, Edge } from 'reactflow';

interface WorkspaceProps {
  taskId: string;
  children?: ReactNode;
}

const Workspace: FC<WorkspaceProps> = ({ taskId, children }) => {
  // ...
};
export default Workspace;
```

### 2.2 枚举定义

使用 `enum` 定义状态与固定常量组，便于统一维护。

```typescript
export enum NodeStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}
```

## 3. 导入顺序规范

保持统一的导入顺序，模块间空一行，提升代码整洁度。

```typescript
// 1. React 及核心库
import React, { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';

// 2. 第三方依赖包
import { Button, message, Modal } from 'antd';
import { useReactFlow } from 'reactflow';

// 3. 全局状态与接口
import { useFlowStore } from '@/store/useFlowStore';
import * as api from '@/api/workflow';

// 4. 自定义组件、工具函数及样式
import CustomNode from './components/CustomNode';
import { formatTime } from '@/utils/time';
import styles from './style.module.css'; // 或 .less
```

## 4. 状态管理规范（Zustand）

严禁使用传统的 Redux/Dva 模式。全局状态统一在 `src/store` 目录下使用 Zustand 构建。

### 4.1 Store 定义模式

```typescript
import { create } from 'zustand';
import type { UserInfo } from '@/types/user';

interface UserState {
  userInfo: UserInfo | null;
  token: string | null;
  // Actions
  setUserInfo: (info: UserInfo) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  userInfo: null,
  token: localStorage.getItem('token') || null,

  setUserInfo: (info) => set({ userInfo: info }),

  logout: () => {
    localStorage.removeItem('token');
    set({ userInfo: null, token: null });
  },

  // 异步 Action 直接在 Zustand 内处理，不需 Generator (yield)
  fetchProfile: async () => {
    try {
      const res = await api.getUserProfile();
      if (res.data) set({ userInfo: res.data });
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  },
}));
```

## 5. API 与异步数据流

### 5.1 异步请求模式

使用 `async/await` 替代 Promise 链式调用，必须处理 Loading 状态和异常。

```typescript
const executeWorkflow = async () => {
  setIsLoading(true);
  try {
    const res = await api.runTask({ taskId: '123' });
    if (res?.success && res.data) {
      message.success('工作流已启动');
      updateCanvasNodes(res.data);
    }
  } catch (error: any) {
    message.error(error?.message || '请求失败，请重试');
  } finally {
    setIsLoading(false); // 确保解除 loading
  }
};
```

### 5.2 Axios 拦截器与环境配置

由于使用 Vite，环境变量需使用 `import.meta.env` 获取。

```typescript
// utils/request.ts
const BASE_URL = import.meta.env.VITE_BASE_URL as string;
const instance = axios.create({ baseURL: BASE_URL });

instance.interceptors.response.use(
  (response) => {
    const { data } = response;
    // 业务逻辑错误拦截
    if (!data.success) {
      if (data.code === 401) {
        useUserStore.getState().logout(); // 外部调用 Zustand
        window.location.href = '/login';
      } else {
        message.error(data.message);
      }
      return Promise.reject(new Error(data.message));
    }
    return data.data; // 直接返回核心数据
  },
  (error) => {
    message.error('网络请求异常');
    return Promise.reject(error);
  }
);
```

## 6. 特殊技术栈规范（React Flow & Fabric.js）

### 6.1 画布状态解耦

React Flow 和 Fabric.js 的画布状态（如鼠标移动、频繁拖拽）不要直接存入 React `useState` 或 Zustand 中，避免引发全量渲染。

**正确做法：** 使用 `useRef` 存储 Fabric.js 实例；React Flow 的节点数据存入 Zustand，但位置更新通过回调防抖（Debounce）同步。

### 6.2 动态表单配置

右侧属性面板采用 Ant Design `Form`，数据驱动渲染。

```typescript
const [form] = Form.useForm();

// 初始化或节点切换时重置表单
useEffect(() => {
  form.setFieldsValue(activeNode?.data?.config || {});
}, [activeNode, form]);

// 规范校验提示
<Form.Item
  name="prompt"
  label="绘图提示词"
  rules={[{ required: true, message: '提示词不可为空' }]}
>
  <Input.TextArea placeholder="请输入画面描述..." />
</Form.Item>
```

## 7. 权限控制组件

保留实习规范中的优秀设计，采用声明式鉴权组件。

```typescript
import { useUserStore } from '@/store/useUserStore';
import type { FC, ReactNode } from 'react';

interface AccessProps {
  requiredRole: 'ADMIN' | 'MEMBER';
  children: ReactNode;
}

export const Access: FC<AccessProps> = ({ requiredRole, children }) => {
  const userInfo = useUserStore((state) => state.userInfo);
  const hasAccess = userInfo?.role === requiredRole || userInfo?.role === 'ADMIN';

  return hasAccess ? <>{children}</> : null;
};

// 使用
<Access requiredRole="ADMIN">
  <Button type="primary">修改团队规范</Button>
</Access>
```

## 8. 样式规范

采用 **CSS Modules**（`.module.css` 或 `.module.less`）防止样式污染。

类名推荐使用中划线或下划线连接，禁止直接给基础 HTML 标签（如 `div`、`span`）写全局样式。

```css
/* workspace.module.css */
.workspace-container {
  display: flex;
  height: 100vh;
}
.sidebar_panel {
  width: 280px;
  background: var(--bg-panel);
}
```

```typescript
import styles from './workspace.module.css';

<div className={styles['workspace-container']}>...</div>
```
