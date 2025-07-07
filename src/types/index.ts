export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  dueDate: string;
  assignee?: string;
}
