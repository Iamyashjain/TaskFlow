export type TaskType = "Content" | "Design" | "Administration" | "Media";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'overdue' | 'review';
  dueDate: string;
  type: TaskType;
  assignee?: string;
  posterUrl?: string;
  reviewFeedback?: {
    positive: string;
    negative: string;
    rating?: number;
  };
}
