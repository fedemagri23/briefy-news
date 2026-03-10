export interface NotificationPayload {
  subject: string;
  htmlBody: string;
  recipient: string;
  attachments?: {
    filename: string;
    content: Buffer;
    cid: string;
  }[];
}

export interface NotificationService {
  send(payload: NotificationPayload): Promise<void>;
}