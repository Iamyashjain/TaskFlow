'use server';
/**
 * @fileOverview A flow for sending task reminders.
 *
 * - sendReminder - A function that simulates sending a task reminder.
 * - SendReminderInput - The input type for the sendReminder function.
 * - SendReminderOutput - The return type for the sendReminder function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendReminderInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
  description: z.string().optional().describe('The description of the task.'),
  dueDate: z.string().describe('The due date of the task.'),
  assignee: z.string().describe('The email or name of the person the task is assigned to.'),
  reminderType: z.enum(['assignment', 'pending']).describe('The type of reminder to send.'),
});
export type SendReminderInput = z.infer<typeof SendReminderInputSchema>;

const SendReminderOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendReminderOutput = z.infer<typeof SendReminderOutputSchema>;

export async function sendReminder(input: SendReminderInput): Promise<SendReminderOutput> {
  return sendReminderFlow(input);
}

const sendReminderFlow = ai.defineFlow(
  {
    name: 'sendReminderFlow',
    inputSchema: SendReminderInputSchema,
    outputSchema: SendReminderOutputSchema,
  },
  async (input) => {
    // In a real application, this is where you would integrate with an email service.
    // For this prototype, we'll just simulate the action and log to the console.
    const subject = input.reminderType === 'assignment'
        ? `New Task Assigned: ${input.title}`
        : `Reminder: Task Due Soon - ${input.title}`;
    
    console.log('--- SIMULATING EMAIL ---');
    console.log(`To: ${input.assignee}`);
    console.log(`Subject: ${subject}`);
    console.log(`Hi ${input.assignee},`);
    console.log(`This is a reminder about the task: "${input.title}".`);
    console.log(`Description: ${input.description || 'No description provided.'}`);
    console.log(`It is due on: ${new Date(input.dueDate).toLocaleDateString()}.`);
    console.log('Thank you,');
    console.log('TaskFlow');
    console.log('--- END SIMULATION ---');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      message: `Reminder for task "${input.title}" sent to ${input.assignee}.`,
    };
  }
);
