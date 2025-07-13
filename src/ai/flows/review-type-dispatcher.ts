// @/ai/flows/review-type-dispatcher.ts

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

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
  decision: z.enum(['complete', 'pending', 'aiApproved']),
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
- Decision: 'aiApproved' if rating >= 8 and no critical issues
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
- Decision: 'aiApproved' if rating >= 8 and no critical issues
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
- Decision: 'aiApproved' if rating >= 8 and no critical issues
  `,
});

export async function reviewFormLink(input: ReviewInput): Promise<ReviewOutput> {
  const { output } = await reviewFormPrompt(input);
  return output!;
}

// Poster Prompt (New)
const reviewPosterPromptNew = ai.definePrompt({
  name: 'reviewPosterPromptNew',
  input: { schema: ReviewInputSchema },
  output: { schema: ReviewOutputSchema },
  prompt: `
You are a Senior Creative Director, an AI assistant specializing in reviewing marketing materials for design, clarity, and effectiveness. The user has uploaded a poster for a task.

**Task Details:**
- **Title:** "{{taskTitle}}"
- **Description:** "{{taskDescription}}"

**Your Instructions:**
1.  **Holistic Analysis:** Analyze the poster image in the context of the provided task title and description. Evaluate its design (layout, color, typography), content (clarity, grammar, spelling), and overall alignment with the task's goal.
2.  **Rate the Poster:** Based on your analysis, provide a numerical **rating** for the poster on a scale of 1-10, where 1 is very poor and 10 is outstanding. This rating is a mandatory part of your output.
3.  **Provide Structured Feedback:**
    - **Positive Points:** Write a bulleted list of exactly three specific things that are well-done in the poster.
    - **Negative Points:** Write a bulleted list of actionable suggestions for improvement. Focus on critical issues like spelling errors, misleading information, or poor design choices. If the poster is perfect, state "No issues found.".
4.  **Make a Decision:** Use your rating to make a final decision.
    - If the poster's rating is 8 or higher and it has no critical errors (like spelling mistakes or incorrect information), set the \`decision\` field to **'aiApproved'**.
    - Otherwise, set the \`decision\` field to **'pending'**.
5.  **Revise Description:** If necessary, provide a revised task description that incorporates the feedback. If no changes are needed, return the original description.

Your entire output MUST be in the format of the requested JSON schema.

Poster Image: {{media url=fileDataUri}}`,
});

export async function reviewPosterNew(input: ReviewInput): Promise<ReviewOutput> {
  const { output } = await reviewPosterPromptNew(input);
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
    return await reviewPosterNew(input);
  case 'content':
    return await reviewPdf(input);
  case 'media':
    return await reviewVideo(input);
  case 'administration':
    return await reviewFormLink(input);
  default:
   
}
}