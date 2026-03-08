import { GoogleGenAI } from "@google/genai";
import { sendNewsEmail } from "../email.js";

const ai = new GoogleGenAI({});

// Función interna que obtiene las noticias y envía el email
const fetchAndSendNews = async () => {
  const prompt = `
    Eres un asistente experto en noticias. 
    Busca y resume en español 10 noticias de las ultimas 24 horas, 5 de argentina y 5 internacionales, 
    en ambos casos las más relevantes dentro del ámbito economico, social, politico y general.
    Es importante verificar que relmente las noticias son de menos de 24 horas de antiguedad,
    si ves que alguna no cumple esto o no es muy relevvante no dudes en descartarla y buscar otra,
    decides tu con cual quedarte, no me preguntes.
    Los resumenes deben ser tecnicamente adecuados, no mas de 1 parrafo, y deben estar pensados para enterar 
    al lector sobre lo que sucedió, y que este pueda definir si quiere leer la noticia completa porque es de
    su interés o no.
    Devuélvelas en formato JSON con este esquema: 
    { "fecha": "YYYY-MM-DD", "fuente": "Gemini", "noticias": [ { "titulo": string, "categoria": string, "resumen": string, "pais": string, "link": string } ] }.
    No incluyas ningún texto fuera del JSON.
  `;

  const groundingTool = {
    googleSearch: {},
  };

  const config = {
    tools: [groundingTool],
  };

  const models = ["gemini-3-flash-preview", "gemini-2.5-flash"];
  let lastError = null;
  let usedModel = null;

  // Intentar primero con gemini-3-flash-preview, si falla usar gemini-2.5-flash
  for (const model of models) {
    try {
      console.log(`Intentando obtener noticias con modelo: ${model}`);
      usedModel = model;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      // Si Gemini devuelve texto plano JSON, lo intentamos parsear.
      const text = response.text ?? "";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();

      try {
        const json = JSON.parse(cleaned);
        // Agregar el modelo usado al JSON
        json.modelo_usado = model;
        // Enviar email con el objeto JSON (se generará HTML profesional)
        await sendNewsEmail(
          `📰 Noticias Diarias - ${json.fecha || new Date().toISOString().split("T")[0]}`,
          json
        );
        console.log(`✅ Noticias obtenidas exitosamente con modelo: ${model}`);
        return json;
      } catch (parseError) {
        // Si por algún motivo no es JSON válido, enviamos el texto tal cual
        await sendNewsEmail(
          `Noticias diarias generadas por Gemini (texto sin JSON válido) - Modelo: ${model}`,
          text,
          model
        );
        return { raw: text, modelo_usado: model };
      }
    } catch (error) {
      console.error(`❌ Error con modelo ${model}:`, error.message);
      lastError = error;
      // Si no es el último modelo, continuar con el siguiente
      if (model !== models[models.length - 1]) {
        console.log(`Reintentando con modelo alternativo: ${models[models.indexOf(model) + 1]}`);
        continue;
      }
    }
  }

  // Si ambos modelos fallaron, lanzar el último error
  console.error("Error al obtener noticias desde Gemini con ambos modelos:", lastError);
  throw lastError;
};

// Endpoint HTTP
export const getDailyNews = async (req, res) => {
  try {
    const result = await fetchAndSendNews();
    return res.json(result);
  } catch (error) {
    console.error("Error en endpoint getDailyNews:", error);
    return res
      .status(500)
      .json({ error: "Error al obtener noticias diarias desde Gemini" });
  }
};

// Exportar la función para el scheduler
export { fetchAndSendNews };
