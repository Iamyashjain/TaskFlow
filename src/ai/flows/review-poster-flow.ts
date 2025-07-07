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
  positivePoints: z
    .string()
    .describe(
      'A concise, bulleted list of exactly 3 positive points about the poster.'
    ),
  negativePoints: z
    .string()
    .describe(
      "A concise, bulleted list of suggested corrections or areas for improvement. If none, state 'No issues found.'."
    ),
  decision: z
    .enum(['complete', 'pending'])
    .describe(
      "The final decision. Set to 'complete' if the poster is excellent and needs no critical changes. Set to 'pending' if there are significant issues to address."
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
  prompt: `You are a Senior Creative Director, an AI assistant specializing in reviewing marketing materials for design, clarity, and effectiveness. The user has uploaded a poster for a task.

**Task Details:**
- **Title:** "{{taskTitle}}"
- **Description:** "{{taskDescription}}"

**Your Instructions:**
1.  **Holistic Analysis:** Analyze the poster image in the context of the provided task title and description. Evaluate its design (layout, color, typography), content (clarity, grammar, spelling), and overall alignment with the task's goal.
2.  **Rate the Poster:** On a scale of 1-10, where 1 is very poor and 10 is outstanding, mentally rate the poster. You will use this rating to make your final decision.
3.  **Provide Structured Feedback:**
    - **Positive Points:** Write a bulleted list of exactly three specific things that are well-done in the poster.
    - **Negative Points:** Write a bulleted list of actionable suggestions for improvement. Focus on critical issues like spelling errors, misleading information, or poor design choices. If the poster is perfect, state "No issues found.".
4.  **Make a Decision:**
    - If the poster's rating is 8 or higher and it has no critical errors (like spelling mistakes or incorrect information), set the \`decision\` field to **'complete'**.
    - Otherwise, set the \`decision\` field to **'pending'**.
5.  **Revise Description:** If necessary, provide a revised task description that incorporates the feedback. If no changes are needed, return the original description.

Your entire output MUST be in the format of the requested JSON schema.

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
