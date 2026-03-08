import express from "express";
import cors from "cors";
import morgan from "morgan";
import { PORT } from "./config.js";
import newsRoutes from "./routes/index.routes.js";
import { startNewsScheduler } from "./scheduler.js";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan("dev"));
app.use(express.json());

app.use(newsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Iniciar el scheduler para envío automático de noticias
  startNewsScheduler();
});
