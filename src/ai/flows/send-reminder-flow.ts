'use server';

/**
 * Sends a task reminder email for GDG IET DAVV.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import nodemailer from 'nodemailer';
 // Ensure .env.local is loaded in dev mode

// 🟩 Input Schema
const SendReminderInputSchema = z.object({
  title: z.string().describe('Task title'),
  description: z.string().optional().describe('Task details'),
  dueDate: z.string().describe('Due date (ISO format)'),
  assignee: z.string().describe('Assignee email'),
  reminderType: z.enum(['assignment', 'pending']).describe('Reminder type'),
});

export type SendReminderInput = z.infer<typeof SendReminderInputSchema>;

// 🟥 Output Schema
const SendReminderOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type SendReminderOutput = z.infer<typeof SendReminderOutputSchema>;

// 🔁 Exported server function (used in TaskCard)
export async function sendReminder(input: SendReminderInput): Promise<SendReminderOutput> {
  return sendReminderFlow(input);
}

// 🔧 The AI Flow logic
const sendReminderFlow = ai.defineFlow(
  {
    name: 'sendReminderFlow',
    inputSchema: SendReminderInputSchema,
    outputSchema: SendReminderOutputSchema,
  },
  async (input) => {
    const { title, description, dueDate, assignee, reminderType } = input;

    const subject =
      reminderType === 'assignment'
        ? `📌 GDG IET DAVV - New Task Assigned: ${title}`
        : `⏰ GDG IET DAVV - Task Due Soon: ${title}`;

    const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const message = `
Hi ${assignee.split('@')[0]},

You're receiving this from *GDG IET DAVV* regarding the task:

📝 **Task:** ${title}
📅 **Due:** ${formattedDate}
📖 **Details:** ${description || 'No description provided'}

${
  reminderType === 'assignment'
    ? `You've been assigned a new responsibility. We’re excited to see what you’ll create!`
    : `This is a friendly reminder to complete your task on time. Let's keep the momentum going!`
}

Best regards,  
🌟 Team GDG IET DAVV  
Connect · Learn · Grow
    `.trim();

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"GDG IET DAVV" <${process.env.EMAIL_USER}>`,
        to: assignee,
        subject,
        text: message,
      });

      return {
        success: true,
        message: `Reminder sent to ${assignee} from GDG IET DAVV.`,
      };
    } catch (error: any) {
      console.error('[Reminder Flow Error]', error);
      return {
        success: false,
        message: 'Email sending failed. Check credentials or internet.',
      };
    }
  }
);
