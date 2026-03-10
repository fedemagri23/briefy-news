import { readFileSync } from "fs";
import { join } from "path";
import type { NewsDigest, NewsItem } from "../news/types.js";

function formatDate(date: string): string {
  return date.charAt(0).toUpperCase() + date.slice(1);
}

function renderNewsItem(item: NewsItem): string {
  return `
    <div class="news-card" style="margin-bottom: 24px; padding: 20px; border: 1px solid #e8e8e8; border-radius: 4px; border-left: 4px solid #000000;">
      <img src="cid:general" alt="Imagen de la noticia" style="width: 100%; height: 180px; object-fit: cover; border-radius: 4px; margin-bottom: 14px;" />
      <h3 class="news-title" style="margin: 0 0 10px 0; font-size: 22px; font-weight: 700; color: #000000; line-height: 1.3; font-family: 'Georgia', 'Times New Roman', serif;">
        ${item.title}
      </h3>
      <p style="margin: 0 0 12px 0; color: #444444; font-size: 15px; line-height: 1.6;">
        ${item.summary}
      </p>
      <a href="${item.source.url}" style="color: #000000; font-size: 13px; font-weight: 600; text-decoration: none; border-bottom: 1px solid #000000; padding-bottom: 1px;">
        ${item.source.name} →
      </a>
    </div>
  `;
}

function renderSection(title: string, items: NewsItem[]): string {
  if (items.length === 0) return "";
  return `
    <div style="margin-bottom: 32px;">
      <div style="margin-bottom: 20px; padding-bottom: 12px; border-bottom: 3px solid #000000;">
        <h2 class="section-title" style="margin: 0; font-size: 28px; font-weight: 800; color: #000000; letter-spacing: -0.5px; text-transform: uppercase; font-family: 'Georgia', 'Times New Roman', serif;">
          ${title}
        </h2>
      </div>
      ${items.map((item) => renderNewsItem(item)).join("")}
    </div>
  `;
}

export interface EmailContent {
  html: string;
  attachments: {
    filename: string;
    content: Buffer;
    cid: string;
  }[];
}

export function renderEmail(digest: NewsDigest): EmailContent {
  const argentina = digest.sections.find((s) => s.type === "argentina")?.news ?? [];
  const international = digest.sections.find((s) => s.type === "international")?.news ?? [];

  const imagePath = join(process.cwd(), "assets", "img", "general.png");
  const imageBuffer = readFileSync(imagePath);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Briefy News - Noticias Diarias</title>
      <style>
        @media only screen and (max-width: 600px) {
          .header-title { font-size: 32px !important; }
          .section-title { font-size: 22px !important; }
          .news-card { padding: 16px !important; }
          .news-title { font-size: 20px !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5; padding: 16px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 0; overflow: hidden;">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid #333;">
                  <h1 class="header-title" style="margin: 0 0 8px 0; color: #ffffff; font-size: 42px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; font-family: 'Georgia', 'Times New Roman', serif;">
                    Briefy News
                  </h1>
                  <div style="border-top: 2px solid #ffffff; border-bottom: 2px solid #ffffff; padding: 8px 0; margin: 12px 0;">
                    <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
                      ${formatDate(digest.date)}
                    </p>
                  </div>
                  <p style="margin: 8px 0 0 0; color: #cccccc; font-size: 13px; font-weight: 400; font-style: italic;">
                    Tu resumen diario de noticias
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 20px; background-color: #ffffff;">
                  ${renderSection("🇦🇷 Argentina", argentina)}
                  ${renderSection("🌍 Internacional", international)}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #1a1a1a; padding: 20px 24px; text-align: center; border-top: 2px solid #333;">
                  <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
                    Briefy News
                  </p>
                  <p style="margin: 0; color: #999999; font-size: 11px; line-height: 1.5;">
                    Generado automáticamente por <strong style="color: #cccccc;">Gemini AI</strong><br>
                    <span style="color: #777777;">Modelo: gemini-2.5-flash • ${digest.date}</span>
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

  return {
    html,
    attachments: [
      {
        filename: "general.png",
        content: imageBuffer,
        cid: "general",
      },
    ],
  };
}