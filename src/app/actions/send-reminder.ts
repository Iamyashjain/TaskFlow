'use server';

import { sendReminder as rawSendReminder } from '@/ai/flows/send-reminder-flow';
import type { SendReminderInput, SendReminderOutput } from '@/ai/flows/send-reminder-flow';

export async function sendReminder(input: SendReminderInput): Promise<SendReminderOutput> {
  return rawSendReminder(input);
}