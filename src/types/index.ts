export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'overdue' | 'review' | 'aiApproved'; // <-- Added here
  dueDate: string;
  assignee?: string;

  // New: Task type (used to determine input format)
  type: 'content' | 'design' | 'media' | 'administration';

  // File or form submission
  submissionUrl?: string;     // Used for PDF/image/video uploads or Google Form link
  submissionFileType?: 'pdf' | 'image' | 'video' | 'form'; // Optional but recommended

  // Poster is still kept (useful for design tasks especially)
  posterUrl?: string;

  // AI feedback if reviewed
  reviewFeedback?: {
    positive: string;
    negative: string;
    rating?: number;
  };
}
