import nodemailer from "nodemailer";
import { config } from "../config/index.js";
import type { NotificationService, NotificationPayload } from "./types.js";

export class EmailNotificationService implements NotificationService {
  private readonly transporter = nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpPort === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  async send(payload: NotificationPayload): Promise<void> {
    await this.transporter.sendMail({
      from: config.email.from,
      to: payload.recipient,
      subject: payload.subject,
      html: payload.htmlBody,
    });
    console.log(`✅ Email enviado a ${payload.recipient}`);
  }
}