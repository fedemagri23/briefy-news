export interface NotificationPayload {
  subject: string;
  htmlBody: string;
  recipient: string;
}

export interface NotificationService {
  send(payload: NotificationPayload): Promise<void>;
}