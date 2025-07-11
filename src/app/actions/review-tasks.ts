'use server';

import { reviewByType } from '@/ai/flows/review-type-dispatcher';

export async function reviewTaskByType(input: {
  type: 'design' | 'content' | 'media' | 'administration';
  fileDataUri: string;
  taskTitle: string;
  taskDescription: string;
}) {
  return await reviewByType(input);
}
