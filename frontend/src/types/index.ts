export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  api_key: string;
  monthly_api_limit: number;
  current_month_usage: number;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  task_executed_at?: string;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: number;
  name: string;
  content: string;
  category?: string;
  user_id: number;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Record {
  id: number;
  title: string;
  content: string;
  file_path?: string;
  file_type?: string;
  group_id: number;
  user_id: number;
  parent_type?: string;
  parent_id?: number;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Knowledge {
  id: number;
  question: string;
  answer: string;
  record_id: number;
  prompt_id: number;
  user_id: number;
  parent_type?: string;
  parent_id?: number;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  record_id: number;
  prompt_id: number;
  user_id: number;
  ai_provider?: string;
  ai_model?: string;
  result_knowledge_id?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskStatus {
  total_tasks: number;
  pending_tasks: number;
  processing_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
}

export interface KnowledgeMatrixItem {
  group_name: string;
  record_title: string;
  prompt_name: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface KnowledgeMatrix {
  items: KnowledgeMatrixItem[];
  total_count: number;
}

export interface APIResponse {
  success: boolean;
  message: string;
  data?: any;
}
