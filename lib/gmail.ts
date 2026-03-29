import { google, gmail_v1 } from 'googleapis';

function getAuthClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

export interface EmailHeader {
  name: string;
  value: string;
}

export interface Email {
  id: string;
  threadId: string;
  labels: string[];
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  bodyText?: string;
}

export interface GetEmailsResponse {
  emails: Email[];
  nextPageToken?: string;
}

export interface CreateDraftResponse {
  id: string;
  messageId: string;
  threadId?: string;
}

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  if (!headers) return '';
  const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value || '';
}

const findPlainTextPart = (parts: gmail_v1.Schema$MessagePart[]): gmail_v1.Schema$MessagePart | undefined => {
  for (const part of parts) {
    if (part.mimeType === 'text/plain') {
      return part;
    }
    if (part.parts) {
      const nestedPart = findPlainTextPart(part.parts);
      if (nestedPart) return nestedPart;
    }
  }
  return undefined;
};

function getBodyData(message: gmail_v1.Schema$Message): string {
  let bodyData = '';
  const parts = message.payload?.parts;

  if (parts && parts.length > 0) {
    const plainTextPart = findPlainTextPart(parts);
    if (plainTextPart && plainTextPart.body?.data) {
      bodyData = plainTextPart.body.data;
    } else if (parts[0].body?.data) {
      bodyData = parts[0].body.data;
    }
  } else if (message.payload?.body?.data) {
    bodyData = message.payload.body.data;
  }

  if (bodyData) {
    // Gmail API requires decoding base64url strings
    return Buffer.from(bodyData, 'base64').toString('utf-8');
  }

  return '';
}

export async function getEmailById(accessToken: string, id: string): Promise<Email | null> {
  const auth = getAuthClient(accessToken);
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const res = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full',
    });

    const message = res.data;
    const headers = message.payload?.headers || [];

    const subject = getHeader(headers, 'Subject');
    const from = getHeader(headers, 'From');
    const to = getHeader(headers, 'To');
    const date = getHeader(headers, 'Date');

    const bodyText = getBodyData(message);

    return {
      id: message.id || id,
      threadId: message.threadId || '',
      labels: message.labelIds || [],
      snippet: message.snippet || '',
      subject,
      from,
      to,
      date,
      bodyText,
    };
  } catch (error) {
    console.error(`Error fetching email ${id}:`, error);
    return null;
  }
}

export async function getEmails(
  accessToken: string,
  maxResults: number = 10,
  pageToken?: string
): Promise<GetEmailsResponse> {
  const auth = getAuthClient(accessToken);
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken,
      q: 'in:inbox', // Optional constraint to filter specifically for inbox
    });

    const messages = res.data.messages || [];
    const nextPageToken = res.data.nextPageToken || undefined;

    const emails: Email[] = [];

    // Fetch details for each individual message to extract headers/body sequentially
    for (const msg of messages) {
      if (msg.id) {
        const fullEmail = await getEmailById(accessToken, msg.id);
        if (fullEmail) {
          emails.push(fullEmail);
        }
      }
    }

    return { emails, nextPageToken };
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw new Error('Failed to fetch emails from Gmail API.');
  }
}

export async function createDraft(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<CreateDraftResponse> {
  const auth = getAuthClient(accessToken);
  const gmail = google.gmail({ version: 'v1', auth });

  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    bodyText,
  ];

  const message = messageParts.join('\n');

  // The Gmail API requires a base64url encoded string
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const res = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage,
        },
      },
    });

    return {
      id: res.data.id || '',
      messageId: res.data.message?.id || '',
      threadId: res.data.message?.threadId || undefined,
    };
  } catch (error) {
    console.error('Error creating draft:', error);
    throw new Error('Failed to create Gmail draft.');
  }
}
