'use server';
/**
 * @fileOverview A flow for reviewing a task submission.
 *
 * - reviewSubmission - A function that handles the submission review process.
 * - ReviewSubmissionInput - The input type for the reviewSubmission function.
 * - ReviewSubmissionOutput - The return type for the reviewSubmission function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { TaskType } from '@/types';

const ReviewSubmissionInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A file for review, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This is only provided for Design tasks."
    )
    .optional(),
  taskTitle: z.string().describe('The title of the task the poster is for.'),
  taskDescription: z.string().describe('The current description of the task.'),
  taskType: z.enum(["Content", "Design", "Administration", "Media"]),
});
export type ReviewSubmissionInput = z.infer<typeof ReviewSubmissionInputSchema>;

const ReviewSubmissionOutputSchema = z.object({
  rating: z
    .number()
    .min(1)
    .max(10)
    .describe(
      'A numerical rating of the submission from 1 to 10, where 1 is poor and 10 is outstanding.'
    ),
  positivePoints: z
    .string()
    .describe(
      'A concise, bulleted list of exactly 3 positive points about the submission.'
    ),
  negativePoints: z
    .string()
    .describe(
      "A concise, bulleted list of suggested corrections or areas for improvement. If none, state 'No issues found.'."
    ),
  decision: z
    .enum(['complete', 'pending'])
    .describe(
      "The final decision. Set to 'complete' if the submission is excellent (rating >= 8) and needs no critical changes. Set to 'pending' if there are significant issues to address (rating < 8)."
    ),
  revisedDescription: z
    .string()
    .describe(
      'A revised, improved task description based on the review. If no changes are needed, this should be the original task description.'
    ),
});
export type ReviewSubmissionOutput = z.infer<typeof ReviewSubmissionOutputSchema>;

export async function reviewSubmission(
  input: ReviewSubmissionInput
): Promise<ReviewSubmissionOutput> {
  return reviewSubmissionFlow(input);
}

const PromptInputSchema = ReviewSubmissionInputSchema.extend({
    isDesign: z.boolean(),
    isContent: z.boolean(),
    isAdministration: z.boolean(),
    isMedia: z.boolean(),
});

const prompt = ai.definePrompt({
  name: 'reviewSubmissionPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: ReviewSubmissionOutputSchema},
  prompt: `You are a Senior Creative Director, an AI assistant specializing in reviewing various types of professional submissions. The user has submitted work for a task.

**Task Details:**
- **Title:** "{{taskTitle}}"
- **Description:** "{{taskDescription}}"
- **Type:** "{{taskType}}"

**Your Instructions:**
1.  **Holistic Analysis:** Analyze the submission in the context of the provided task details.
2.  **Rate the Submission:** Based on your analysis, provide a numerical **rating** for the submission on a scale of 1-10.
3.  **Provide Structured Feedback:**
    - **Positive Points:** Write a bulleted list of exactly three specific things that are well-done.
    - **Negative Points:** Write a bulleted list of actionable suggestions for improvement. If perfect, state "No issues found.".
4.  **Make a Decision:**
    - If rating is 8 or higher, set \`decision\` to **'complete'**.
    - Otherwise, set \`decision\` to **'pending'**.
5.  **Revise Description:** If necessary, provide a revised task description.

{{#if isDesign}}
**Review Focus: Design**
You are reviewing a poster image. Evaluate its design (layout, color, typography), content (clarity, grammar), and overall effectiveness.
Poster Image: {{media url=fileDataUri}}
{{/if}}

{{#if isContent}}
**Review Focus: Content**
You are reviewing a content piece based on its title and description. Review for grammar, tone, clarity, and relevance for public or social media presentation. The file itself is not available for analysis.
{{/if}}

{{#if isAdministration}}
**Review Focus: Administration**
You are reviewing an administrative task description. Evaluate it for completeness, formal tone, and suitability for official documentation.
{{/if}}

{{#if isMedia}}
**Review Focus: Media**
You are reviewing a media task description. Does it clearly mention the subject, duration, or target audience?
{{/if}}

Your entire output MUST be in the format of the requested JSON schema.`,
});

const reviewSubmissionFlow = ai.defineFlow(
  {
    name: 'reviewSubmissionFlow',
    inputSchema: ReviewSubmissionInputSchema,
    outputSchema: ReviewSubmissionOutputSchema,
  },
  async (input) => {
    const promptInput = {
        ...input,
        isDesign: input.taskType === 'Design',
        isContent: input.taskType === 'Content',
        isAdministration: input.taskType === 'Administration',
        isMedia: input.taskType === 'Media',
    };
    const { output } = await prompt(promptInput);
    return output!;
  }
);
