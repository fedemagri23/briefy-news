import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

export interface NewsSummary {
    title: string;
    body: string;
    date: string;
}

export async function fetchNewsSummary(): Promise<NewsSummary> {
    const today = new Date().toLocaleDateString("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const topics = config.newsTopics.join(", ");

    const prompt = `
    Hoy es ${today}.
    Actuá como un periodista. Buscá y resumí las noticias más importantes del día
    sobre estos temas: ${topics}.

    Formato de respuesta:
    - Un título general para el digest
    - Entre 5 y 8 noticias, cada una con: título, 2-3 oraciones de resumen, fuente si la conocés
    - Tono: informativo, neutral, en español

    Respondé en HTML simple (solo <h2>, <h3>, <p>, <ul>, <li>, sin estilos inline).
    `;

    const groundingTool = {
        googleSearch: {},
    };

    const geminiConfig = {
        tools: [groundingTool],
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: geminiConfig,
    });

    const body = response.text ?? "";

    return {
        title: `Digest de noticias — ${today}`,
        body,
        date: today,
    };


}