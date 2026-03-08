import cron from "node-cron";
import { fetchAndSendNews } from "./controllers/index.controllers.js";
import { SCHEDULER_CRON, SCHEDULER_TIMEZONE, SCHEDULER_ENABLED } from "./config.js";

export const startNewsScheduler = () => {
  if (!SCHEDULER_ENABLED) {
    console.log("⚠️  Scheduler deshabilitado (SCHEDULER_ENABLED=false)");
    return;
  }

  cron.schedule(
    SCHEDULER_CRON,
    async () => {
      console.log(
        `[${new Date().toLocaleString("es-AR", {
          timeZone: SCHEDULER_TIMEZONE,
        })}] Iniciando envío automático de noticias diarias...`
      );
      try {
        await fetchAndSendNews();
        console.log(
          `[${new Date().toLocaleString("es-AR", {
            timeZone: SCHEDULER_TIMEZONE,
          })}] Noticias diarias enviadas exitosamente por email.`
        );
      } catch (error) {
        console.error(
          `[${new Date().toLocaleString("es-AR", {
            timeZone: SCHEDULER_TIMEZONE,
          })}] Error al enviar noticias automáticamente:`,
          error
        );
      }
    },
    {
      scheduled: true,
      timezone: SCHEDULER_TIMEZONE,
    }
  );

  console.log(
    `✅ Scheduler configurado: Noticias diarias se enviarán automáticamente según cron "${SCHEDULER_CRON}" (zona horaria: ${SCHEDULER_TIMEZONE})`
  );
};
