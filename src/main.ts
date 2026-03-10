import "dotenv/config";

import { fetchNewsSummary } from "./news/geminiService.js";
import { EmailNotificationService } from "./notification/emailService.js";
import { ConfigSubscriberRepository } from "./subscribers/configAdapter.js";
import { renderEmail } from "./notification/emailTemplate.js";

async function main(): Promise<void> {
    console.log("🚀 Iniciando news digest...");

    const subscribers = new ConfigSubscriberRepository();
    
    const notifier = new EmailNotificationService();

    const [summary, recipientList] = await Promise.all([
        fetchNewsSummary(),
        subscribers.getAll(),
    ]);

    console.log(`📰 Resumen generado. Enviando a ${recipientList.length} suscriptores...`);

    const { html, attachments } = renderEmail(summary);

    await Promise.all(
        recipientList.map((sub) =>
            notifier.send({
                subject: `Briefy News — ${summary.date}`,
                htmlBody: html,
                attachments,
                recipient: sub.email,
            })
        )
    );

    console.log("✅ Digest enviado correctamente.");
}

main().catch((err: unknown) => {
    console.error("❌ Error:", err);
    process.exit(1);
});