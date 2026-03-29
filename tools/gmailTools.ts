import { tool } from 'ai';
import { z } from 'zod';
import { getEmails, getEmailById, createDraft } from '@/lib/gmail';

const listEmailsSchema = z.object({
  maxResults: z.number().optional().default(10).describe('The maximum number of emails to retrieve.'),
});

const getEmailByIdSchema = z.object({
  id: z.string().describe('The unique ID of the Gmail message to retrieve.'),
});

const createDraftSchema = z.object({
  to: z.string().describe('The recipient email address.'),
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body text of the email.'),
});

export const getGmailTools = (accessToken: string) => ({
  // @ts-ignore - ai@6 tool() overload incompatibility
  listEmails: tool({
    description: 'List recent emails from the inbox. Use this to see what is new or get an overview of recent conversations.',
    parameters: listEmailsSchema as any,
    execute: async ({ maxResults }: any) => {
      try {
        const response = await getEmails(accessToken, maxResults);
        return response as unknown as Record<string, unknown>;
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Failed to list emails' };
      }
    }
  } as any),

  getEmailById: tool({
    description: 'Fetch the full content of a specific email by its ID. Use this when the user asks to read, summarize, or reply to a specific message found in the inbox list.',
    parameters: getEmailByIdSchema as any,
    execute: async ({ id }: any) => {
      try {
        const email = await getEmailById(accessToken, id);
        if (!email) {
          return { error: `Email with ID ${id} not found.` };
        }
        return email as unknown as Record<string, unknown>;
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Failed to retrieve email details' };
      }
    }
  } as any),

  createDraft: tool({
    description: 'Create a new email draft. IMPORTANT: Always confirm the recipient, subject, and message body with the user before calling this tool.',
    parameters: createDraftSchema as any,
    execute: async ({ to, subject, body }: any) => {
      try {
        const response = await createDraft(accessToken, to, subject, body);
        return {
          success: true,
          message: 'Draft created successfully.',
          draftId: response.id,
        };
      } catch (error) {
        return { error: error instanceof Error ? error.message : 'Failed to create draft' };
      }
    }
  } as any),
});