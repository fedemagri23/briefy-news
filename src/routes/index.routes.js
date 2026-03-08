import { Router } from "express";
import { getDailyNews } from "../controllers/index.controllers.js";

const router = Router();

// Endpoint único para obtener noticias diarias generadas por Gemini
router.get("/daily-news", getDailyNews);

export default router;
