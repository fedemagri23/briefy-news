import { fetchNewsSummary } from "./news/geminiService.js";
import { EmailNotificationService } from "./notification/emailService.js";
import { ConfigSubscriberRepository } from "./subscribers/configAdapter.js";

async function main(): Promise<void> {
  console.log("🚀 Iniciando news digest...");

  const subscribers = new ConfigSubscriberRepository();
  const notifier = new EmailNotificationService();

  const [summary, recipientList] = await Promise.all([
    fetchNewsSummary(),
    subscribers.getAll(),
  ]);

  console.log(`📰 Resumen generado. Enviando a ${recipientList.length} suscriptores...`);

  await Promise.all(
    recipientList.map((sub) =>
      notifier.send({
        subject: summary.title,
        htmlBody: summary.body,
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