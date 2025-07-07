export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'overdue' | 'review';
  dueDate: string;
  assignee?: string;
  posterUrl?: string;
  reviewFeedback?: {
    positive: string;
    negative: string;
    rating?: number;
  };
}
