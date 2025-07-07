'use server';
/**
 * @fileOverview A flow for reviewing a task poster.
 *
 * - reviewPoster - A function that handles the poster review process.
 * - ReviewPosterInput - The input type for the reviewPoster function.
 * - ReviewPosterOutput - The return type for the reviewPoster function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReviewPosterInputSchema = z.object({
  posterDataUri: z
    .string()
    .describe(
      "A poster image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  taskTitle: z.string().describe('The title of the task the poster is for.'),
  taskDescription: z.string().describe('The current description of the task.'),
});
export type ReviewPosterInput = z.infer<typeof ReviewPosterInputSchema>;

const ReviewPosterOutputSchema = z.object({
  corrections: z
    .string()
    .describe(
      "A concise, bulleted list of suggested corrections for the poster. If the poster looks good, this should be 'No corrections needed.'."
    ),
  revisedDescription: z
    .string()
    .describe(
      'A revised, improved task description based on the poster analysis. If no changes are needed, this should be the original task description.'
    ),
});
export type ReviewPosterOutput = z.infer<typeof ReviewPosterOutputSchema>;

export async function reviewPoster(
  input: ReviewPosterInput
): Promise<ReviewPosterOutput> {
  return reviewPosterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviewPosterPrompt',
  input: {schema: ReviewPosterInputSchema},
  output: {schema: ReviewPosterOutputSchema},
  prompt: `You are a helpful AI assistant specializing in reviewing marketing materials for accuracy and quality. The user has uploaded a poster for a task.

**Task Details:**
- **Title:** "{{taskTitle}}"
- **Description:** "{{taskDescription}}"

**Your Instructions:**
1.  **Analyze the poster image against the task details.** Check if the poster's content (text, imagery, theme) aligns with the provided title and description.
2.  **Identify issues.** Look for spelling mistakes, grammatical errors, incorrect information, placeholder text, or any visual elements (like layout or image choice) that are inconsistent with the task's goal.
3.  **Provide corrections.** Create a concise, bulleted list of suggested corrections. If the poster is perfect, respond with "No corrections needed.".
4.  **Revise the description.** Based on your analysis, provide a revised and improved task description. If no changes are needed, return the original task description.

Poster Image: {{media url=posterDataUri}}`,
});

const reviewPosterFlow = ai.defineFlow(
  {
    name: 'reviewPosterFlow',
    inputSchema: ReviewPosterInputSchema,
    outputSchema: ReviewPosterOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
