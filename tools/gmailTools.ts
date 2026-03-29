import { z } from 'zod';
import { getEmails, getEmailById, createDraft } from '@/lib/gmail';
import { tool } from 'ai';

export const getGmailTools = (accessToken: string): any => {
  return {
    listEmails: tool({
      description: 'List recent emails from the inbox.',
      parameters: z.object({
        maxResults: z.number().optional().default(10),
      }),
      execute: async (params: any) => {
        const maxResults = params?.maxResults ?? 10;
        try {
          return await getEmails(accessToken, maxResults);
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Failed' };
        }
      }
    } as any),
    getEmailById: tool({
      description: 'Fetch full content of a specific email by ID.',
      parameters: z.object({
        id: z.string().describe('The Gmail message ID'),
      }),
      execute: async (params: any) => {
        const id = params?.id;
        if (!id) return { error: 'No email ID provided' };
        try {
          const email = await getEmailById(accessToken, id);
          return email || { error: 'Email not found' };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Failed' };
        }
      }
    } as any),
    createDraft: tool({
      description: 'Create a new email draft. Always confirm details with user first.',
      parameters: z.object({
        to: z.string().describe('recipient email address'),
        subject: z.string().describe('email subject'),
        body: z.string().describe('email body text'),
      }),
      execute: async (params: any) => {
        try {
          const response = await createDraft(accessToken, params?.to, params?.subject, params?.body);
          return { success: true, draftId: response.id };
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Failed' };
        }
      }
    } as any)
  };
};