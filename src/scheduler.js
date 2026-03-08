import cron from "node-cron";
import { fetchAndSendNews } from "./controllers/index.controllers.js";

// Configurar el scheduler para ejecutarse todos los días a las 20:30 hora de Argentina
// Zona horaria: America/Argentina/Buenos_Aires
// Formato cron: minuto hora * * * (todos los días)
// 20:30 en Argentina = 20:30 en hora local del servidor
// Si el servidor está en otra zona horaria, ajustar según corresponda

export const startNewsScheduler = () => {
  // Ejecutar todos los días a las 20:30 (formato: minuto hora)
  // Usamos timezone de Argentina
  cron.schedule(
    "08 23 * * *",
    async () => {
      console.log(
        `[${new Date().toLocaleString("es-AR", {
          timeZone: "America/Argentina/Buenos_Aires",
        })}] Iniciando envío automático de noticias diarias...`
      );
      try {
        await fetchAndSendNews();
        console.log(
          `[${new Date().toLocaleString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
          })}] Noticias diarias enviadas exitosamente por email.`
        );
      } catch (error) {
        console.error(
          `[${new Date().toLocaleString("es-AR", {
            timeZone: "America/Argentina/Buenos_Aires",
          })}] Error al enviar noticias automáticamente:`,
          error
        );
      }
    },
    {
      scheduled: true,
      timezone: "America/Argentina/Buenos_Aires",
    }
  );

  console.log(
    "✅ Scheduler configurado: Noticias diarias se enviarán automáticamente todos los días a las 20:30 (hora Argentina)"
  );
};
