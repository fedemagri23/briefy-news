import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";
import type { NewsDigest } from "./types.js";

const ai = new GoogleGenAI({
  apiKey: process.env["GEMINI_API_KEY"] ?? "",
});

function parseDigest(raw: string): NewsDigest {
  const clean = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed: unknown = JSON.parse(clean);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("sections" in parsed)
  ) {
    throw new Error("La respuesta de Gemini no tiene la estructura esperada");
  }

  return parsed as NewsDigest;
}

export async function fetchNewsSummary(): Promise<NewsDigest> {
  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const topics = config.newsTopics.join(", ");

  const prompt = `
    Hoy es ${today}.
    Actuás como un periodista. Buscá y resumí las noticias más importantes del día sobre estos temas: ${topics}.

    Devolvé ÚNICAMENTE un JSON válido con esta estructura exacta, sin explicaciones ni markdown:

    {
      "date": "${today}",
      "sections": [
        {
          "type": "argentina" | "international",
          "news": [
            {
              "title": "Título de la noticia",
              "summary": "2 a 6 oraciones de resumen en español.",
              "source": {
                "name": "Nombre del medio",
                "url": "https://link-a-la-noticia.com"
              }
            }
          ]
        }
      ]
    }

    Incluí exactamente ${config.newsCountArgentina} noticias de Argentina y ${config.newsCountInternational} internacionales.
    Tono: informativo, neutral, en español.
    La búsqueda de noticias debe ser profunda, descarta aquellas noticias que no creas lo suficientemente relevantes y selecciona aquellas que si.
    Es importante asegurarse que la noticia sea sobre el dia de la fecha.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const raw = response.text ?? "";
  return parseDigest(raw);
}
