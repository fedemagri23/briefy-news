import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const generateNewsHTML = (newsData, modelUsed = null) => {
  if (!newsData || !newsData.noticias || !Array.isArray(newsData.noticias)) {
    return `<p>Error: Formato de noticias inválido</p>`;
  }

  const fecha = newsData.fecha || new Date().toISOString().split("T")[0];
  const modelo = modelUsed || newsData.modelo_usado || "Desconocido";
  const noticiasArgentina = newsData.noticias.filter((n) =>
    n.pais?.toLowerCase().includes("argentina")
  );
  const noticiasInternacionales = newsData.noticias.filter(
    (n) => !n.pais?.toLowerCase().includes("argentina")
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("es-AR", options);
  };

  const renderNewsItem = (noticia, index) => {
    const categoriaColors = {
      económico: "#1e88e5",
      economico: "#1e88e5",
      social: "#43a047",
      político: "#e53935",
      politico: "#e53935",
      general: "#6c757d",
    };
    const categoriaColor =
      categoriaColors[
        noticia.categoria?.toLowerCase().replace("ó", "o") || "general"
      ] || "#6c757d";

    return `
      <div style="margin-bottom: 30px; padding-bottom: 25px; border-bottom: 1px solid #e0e0e0;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="background-color: ${categoriaColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
            ${noticia.categoria || "General"}
          </span>
          <span style="color: #757575; font-size: 12px; margin-left: 12px;">
            ${noticia.pais || "N/A"}
          </span>
        </div>
        <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #212121; line-height: 1.4;">
          ${noticia.titulo || "Sin título"}
        </h3>
        <div style="color: #424242; font-size: 15px; line-height: 1.7; margin-bottom: 12px;">
          ${(noticia.resumen || "")
            .split("\n")
            .map((p) => `<p style="margin: 0 0 12px 0;">${p}</p>`)
            .join("")}
        </div>
        ${
          noticia.link
            ? `<a href="${noticia.link}" style="color: #1976d2; text-decoration: none; font-size: 14px; font-weight: 500;">Leer más →</a>`
            : ""
        }
      </div>
    `;
  };

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Noticias Diarias</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                    📰 Noticias Diarias
                  </h1>
                  <p style="margin: 12px 0 0 0; color: #e0e7ff; font-size: 16px; font-weight: 400;">
                    ${formatDate(fecha)}
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  ${
                    noticiasArgentina.length > 0
                      ? `
                    <div style="margin-bottom: 40px;">
                      <h2 style="margin: 0 0 25px 0; font-size: 24px; font-weight: 700; color: #1e3a8a; padding-bottom: 12px; border-bottom: 3px solid #3b82f6;">
                        🇦🇷 Argentina
                      </h2>
                      ${noticiasArgentina.map(renderNewsItem).join("")}
                    </div>
                  `
                      : ""
                  }
                  
                  ${
                    noticiasInternacionales.length > 0
                      ? `
                    <div>
                      <h2 style="margin: 0 0 25px 0; font-size: 24px; font-weight: 700; color: #1e3a8a; padding-bottom: 12px; border-bottom: 3px solid #3b82f6;">
                        🌍 Internacional
                      </h2>
                      ${noticiasInternacionales.map(renderNewsItem).join("")}
                    </div>
                  `
                      : ""
                  }
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <p style="margin: 0; color: #757575; font-size: 13px; line-height: 1.6;">
                    Generado automáticamente por <strong>Gemini AI</strong><br>
                    <span style="color: #9e9e9e; font-size: 12px;">
                      ${newsData.fuente || "Gemini"} • Modelo: <strong>${modelo}</strong> • ${fecha}
                    </span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export const sendNewsEmail = async (subject, body, modelUsed = null) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn(
      "EMAIL_USER o EMAIL_PASSWORD no están configurados; se omite el envío de correo."
    );
    return;
  }

  let htmlContent;
  let textContent;
  let modelo = modelUsed;

  if (typeof body === "object" && body.noticias) {
    // Es un objeto JSON con noticias estructuradas
    // Obtener el modelo del objeto si no se pasó como parámetro
    modelo = modelo || body.modelo_usado || "Desconocido";
    htmlContent = generateNewsHTML(body, modelo);
    textContent = JSON.stringify(body, null, 2);
  } else if (typeof body === "string") {
    // Es texto plano
    modelo = modelo || "Desconocido";
    htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333;">
      <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; background-color: #f5f5f5; padding: 15px; border-radius: 4px;">${body}</pre>
      <p style="margin-top: 15px; color: #757575; font-size: 12px;">Modelo usado: ${modelo}</p>
    </div>`;
    textContent = body;
  } else {
    modelo = modelo || "Desconocido";
    htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px;">
      <pre>${JSON.stringify(body, null, 2)}</pre>
      <p style="margin-top: 15px; color: #757575; font-size: 12px;">Modelo usado: ${modelo}</p>
    </div>`;
    textContent = JSON.stringify(body, null, 2);
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: "fedemagri23@gmail.com", // matiascompany@icloud.com
    subject,
    text: textContent,
    html: htmlContent,
  });
};

