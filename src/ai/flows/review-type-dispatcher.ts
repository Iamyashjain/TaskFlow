// @/ai/flows/review-type-dispatcher.ts

import { z } from 'genkit';
import { ai } from '@/ai/genkit';
import { reviewPoster } from './review-poster-flow';

// Shared Schema
const ReviewInputSchema = z.object({
  fileDataUri: z.string(),
  taskTitle: z.string(),
  taskDescription: z.string(),
});

const ReviewOutputSchema = z.object({
  rating: z.number().min(1).max(10),
  positivePoints: z.string(),
  negativePoints: z.string(),
  decision: z.enum(['complete', 'pending']),
  revisedDescription: z.string(),
});

type ReviewInput = z.infer<typeof ReviewInputSchema>;
type ReviewOutput = z.infer<typeof ReviewOutputSchema>;

// PDF Prompt
const reviewPdfPrompt = ai.definePrompt({
  name: 'reviewPdfPrompt',
  input: { schema: ReviewInputSchema },
  output: { schema: ReviewOutputSchema },
  prompt: `
You are a content evaluation expert reviewing a PDF.

Task Title: "{{taskTitle}}"
Task Description: "{{taskDescription}}"

Uploaded PDF:
{{media url=fileDataUri}}

Return:
- 3 positive points
- 3 suggestions for improvement
- Rating (1-10)
- Revised task description if needed
- Decision: 'complete' if rating >= 8 and no critical issues
  `,
});

export async function reviewPdf(input: ReviewInput): Promise<ReviewOutput> {
  const { output } = await reviewPdfPrompt(input);
  return output!;
}

// Video Prompt
const reviewVideoPrompt = ai.definePrompt({
  name: 'reviewVideoPrompt',
  input: { schema: ReviewInputSchema },
  output: { schema: ReviewOutputSchema },
  prompt: `
You are a senior video reviewer.

Task Title: "{{taskTitle}}"
Task Description: "{{taskDescription}}"

Uploaded Video:
{{media url=fileDataUri}}

Return:
- 3 positive points
- 3 suggestions for improvement
- Rating (1-10)
- Revised task description if needed
- Decision: 'complete' if rating >= 8 and no critical issues
  `,
});

export async function reviewVideo(input: ReviewInput): Promise<ReviewOutput> {
  const { output } = await reviewVideoPrompt(input);
  return output!;
}

// Google Form Prompt
const reviewFormPrompt = ai.definePrompt({
  name: 'reviewFormPrompt',
  input: {
    schema: ReviewInputSchema.extend({
      fileDataUri: z.string().url(),
    }),
  },
  output: { schema: ReviewOutputSchema },
  prompt: `
You are an expert UX reviewer evaluating a Google Form.

Task Title: "{{taskTitle}}"
Task Description: "{{taskDescription}}"

Form URL:
{{fileDataUri}}

Return:
- 3 positive points
- 3 suggestions for improvement
- Rating (1-10)
- Revised task description if needed
- Decision: 'complete' if rating >= 8 and no critical issues
  `,
});

export async function reviewFormLink(input: ReviewInput): Promise<ReviewOutput> {
  const { output } = await reviewFormPrompt(input);
  return output!;
}

// Dispatcher
export async function reviewByType({
  type,
  fileDataUri,
  taskTitle,
  taskDescription,
}: {
  type: 'design' | 'content' | 'media' | 'administration';
  fileDataUri: string;
  taskTitle: string;
  taskDescription: string;
}): Promise<ReviewOutput> {
  const input = { fileDataUri, taskTitle, taskDescription };

  switch (type.toLowerCase()) {
  case 'design':
    return await reviewPoster(input);
  case 'content':
    return await reviewPdf(input);
  case 'media':
    return await reviewVideo(input);
  case 'administration':
    return await reviewFormLink(input);
  default:
   
}
}