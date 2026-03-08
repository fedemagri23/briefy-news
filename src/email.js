import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EMAIL_USER, EMAIL_PASSWORD, EMAIL_RECIPIENTS, NEWS_CATEGORY_IMAGE_MAP, NEWS_CATEGORIES, NEWS_CATEGORY_COLOR_MAP } from "./config.js";

// Obtener el directorio actual en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar imágenes de categorías (rutas y datos)
const loadCategoryImages = () => {
  const imagesDir = path.join(__dirname, "assets", "img");
  const categoryImages = {};
  const categoryImagePaths = {};

  try {
    // Verificar que el directorio existe
    if (!fs.existsSync(imagesDir)) {
      console.warn(`⚠️  Directorio de imágenes no encontrado: ${imagesDir}`);
      return { images: categoryImages, paths: categoryImagePaths };
    }

    // Mapeo de categorías a archivos de imagen (dinámico desde configuración)
    // Crear mapeo con variantes normalizadas para cada categoría configurada
    const categoryMap = {};
    
    // Agregar cada categoría del mapeo configurado con sus variantes
    for (const [category, filename] of Object.entries(NEWS_CATEGORY_IMAGE_MAP)) {
      const categoryLower = category.toLowerCase();
      // Agregar la categoría original
      categoryMap[categoryLower] = filename;
      // Agregar variantes sin tildes
      categoryMap[categoryLower.replace(/ó/g, "o").replace(/í/g, "i").replace(/é/g, "e").replace(/á/g, "a").replace(/ú/g, "u")] = filename;
      // Agregar variantes con/sin "o" al final (político/política, económico/economía)
      if (categoryLower.endsWith("o")) {
        categoryMap[categoryLower.slice(0, -1) + "a"] = filename;
      }
      if (categoryLower.endsWith("a")) {
        categoryMap[categoryLower.slice(0, -1) + "o"] = filename;
      }
    }
    
    // Agregar "general" como fallback si no existe
    if (!categoryMap["general"]) {
      categoryMap["general"] = Object.values(NEWS_CATEGORY_IMAGE_MAP)[0] || "social.png";
    }

    // Cargar cada imagen en base64 y guardar la ruta
    for (const [category, filename] of Object.entries(categoryMap)) {
      const imagePath = path.join(imagesDir, filename);
      try {
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Image = imageBuffer.toString("base64");
          categoryImages[category] = `data:image/png;base64,${base64Image}`;
          categoryImagePaths[category] = imagePath;
          console.log(`✅ Imagen cargada para categoría "${category}": ${filename} (${Math.round(imageBuffer.length / 1024)}KB)`);
        } else {
          console.warn(`⚠️  Imagen no encontrada: ${imagePath}`);
        }
      } catch (error) {
        console.error(`❌ Error al cargar imagen ${filename} para categoría ${category}:`, error.message);
      }
    }

    // Log de resumen
    const loadedCount = Object.keys(categoryImages).length;
    console.log(`📸 Imágenes de categorías cargadas: ${loadedCount}/${Object.keys(categoryMap).length}`);
  } catch (error) {
    console.error("❌ Error general al cargar imágenes de categorías:", error.message);
  }

  return { images: categoryImages, paths: categoryImagePaths };
};

// Cargar las imágenes una vez al inicio
const { images: categoryImages, paths: categoryImagePaths } = loadCategoryImages();

// Función para normalizar y mapear categorías a las claves del sistema
const normalizeCategory = (categoria) => {
  if (!categoria) return "general";
  
  // Convertir a minúsculas y quitar espacios extra
  let normalized = categoria.toLowerCase().trim();
  
  // Reemplazar tildes
  normalized = normalized
    .replace(/ó/g, "o")
    .replace(/í/g, "i")
    .replace(/é/g, "e")
    .replace(/á/g, "a")
    .replace(/ú/g, "u");
  
  // Buscar coincidencia exacta primero
  if (categoryImagePaths[normalized]) {
    return normalized;
  }
  
  // Buscar coincidencia con las categorías configuradas
  for (const configCategory of NEWS_CATEGORIES) {
    const configCategoryLower = configCategory.toLowerCase();
    const configCategoryNormalized = configCategoryLower
      .replace(/ó/g, "o")
      .replace(/í/g, "i")
      .replace(/é/g, "e")
      .replace(/á/g, "a")
      .replace(/ú/g, "u");
    
    // Si la categoría normalizada contiene la categoría configurada o viceversa
    if (normalized === configCategoryNormalized || 
        normalized.includes(configCategoryNormalized) || 
        configCategoryNormalized.includes(normalized)) {
      // Buscar la clave en categoryImagePaths que corresponda
      for (const key in categoryImagePaths) {
        if (key === configCategoryNormalized || 
            key.includes(configCategoryNormalized) || 
            configCategoryNormalized.includes(key)) {
          return key;
        }
      }
    }
  }
  
  // Mapeo inteligente de variantes comunes (fallback)
  if (normalized.includes("politic")) {
    for (const key in categoryImagePaths) {
      if (key.includes("politic")) return key;
    }
  }
  
  if (normalized.includes("economic")) {
    for (const key in categoryImagePaths) {
      if (key.includes("economic")) return key;
    }
  }
  
  if (normalized.includes("social")) {
    for (const key in categoryImagePaths) {
      if (key.includes("social")) return key;
    }
  }
  
  // Por defecto
  return "general";
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

const generateNewsHTML = (newsData, modelUsed = null, imageCids = {}) => {
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

  // Función para obtener el color de una categoría (con variantes normalizadas)
  const getCategoryColor = (categoriaOriginal, categoriaNormalizada) => {
    // Buscar color por categoría original (exacta)
    if (NEWS_CATEGORY_COLOR_MAP[categoriaOriginal]) {
      return NEWS_CATEGORY_COLOR_MAP[categoriaOriginal];
    }
    
    // Buscar en las categorías configuradas (normalizadas)
    for (const configCategory of NEWS_CATEGORIES) {
      const configCategoryLower = configCategory.toLowerCase();
      const configCategoryNormalized = configCategoryLower
        .replace(/ó/g, "o")
        .replace(/í/g, "i")
        .replace(/é/g, "e")
        .replace(/á/g, "a")
        .replace(/ú/g, "u");
      
      if (categoriaNormalizada === configCategoryNormalized || 
          categoriaNormalizada.includes(configCategoryNormalized) ||
          configCategoryNormalized.includes(categoriaNormalizada)) {
        if (NEWS_CATEGORY_COLOR_MAP[configCategory]) {
          return NEWS_CATEGORY_COLOR_MAP[configCategory];
        }
      }
    }
    
    // Buscar por variantes comunes
    if (categoriaNormalizada.includes("politic")) {
      return NEWS_CATEGORY_COLOR_MAP['Político'] || NEWS_CATEGORY_COLOR_MAP['General'] || '#6c757d';
    }
    if (categoriaNormalizada.includes("economic")) {
      return NEWS_CATEGORY_COLOR_MAP['Económico'] || NEWS_CATEGORY_COLOR_MAP['General'] || '#6c757d';
    }
    if (categoriaNormalizada.includes("social")) {
      return NEWS_CATEGORY_COLOR_MAP['Social'] || NEWS_CATEGORY_COLOR_MAP['General'] || '#6c757d';
    }
    
    // Por defecto
    return NEWS_CATEGORY_COLOR_MAP['General'] || '#6c757d';
  };

  const renderNewsItem = (noticia, index, imageCids = {}) => {
    // Normalizar categoría usando la función inteligente
    const categoriaOriginal = noticia.categoria || "General";
    const categoriaNormalizada = normalizeCategory(categoriaOriginal);
    
    // Obtener color de la categoría
    const categoriaColor = getCategoryColor(categoriaOriginal, categoriaNormalizada);

    // Debug: mostrar qué categoría se está usando (solo para las primeras 3 noticias)
    if (index < 3) {
      console.log(`🔍 [Noticia ${index + 1}] Categoría original: "${noticia.categoria}" → Normalizada: "${categoriaNormalizada}"`);
      console.log(`   CIDs disponibles: ${Object.keys(imageCids).join(", ")}`);
      console.log(`   Tiene CID para esta categoría: ${!!imageCids[categoriaNormalizada]}`);
    }

    // Usar imagen de la noticia si existe, sino usar la imagen de categoría, sino placeholder
    let imagenUrl = noticia.imagen || noticia.image;
    
    if (!imagenUrl) {
      // Buscar imagen por categoría normalizada usando CID primero
      if (imageCids[categoriaNormalizada]) {
        imagenUrl = `cid:${imageCids[categoriaNormalizada]}`;
        if (index === 0) console.log(`✅ Usando CID para categoría "${categoriaNormalizada}": ${imageCids[categoriaNormalizada]}`);
      } else if (imageCids["general"]) {
        imagenUrl = `cid:${imageCids["general"]}`;
        console.warn(`⚠️  No se encontró CID para "${categoriaNormalizada}", usando general`);
      } else {
        // Si no hay CID, intentar con base64
        imagenUrl = categoryImages[categoriaNormalizada];
        if (!imagenUrl) {
          imagenUrl = categoryImages["general"];
          if (!imagenUrl) {
            console.warn(`⚠️  No se encontró imagen para categoría "${categoriaNormalizada}", usando placeholder`);
            imagenUrl = `https://via.placeholder.com/600x200/${categoriaColor.replace('#', '')}/ffffff?text=${encodeURIComponent(noticia.titulo?.substring(0, 30) || 'Noticia')}`;
          } else {
            console.warn(`⚠️  Usando imagen general para categoría "${categoriaNormalizada}"`);
          }
        }
      }
    }

    return `
      <div style="margin-bottom: 24px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e8e8e8;">
        <div style="width: 100%; overflow: hidden; background-color: #f0f0f0;">
          <img src="${imagenUrl}" alt="${noticia.titulo || 'Noticia'}" style="width: 100%; height: auto; max-height: 200px; object-fit: cover; display: block; border-radius: 16px 16px 0 0;" />
        </div>
        <div class="news-card" style="padding: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
            <span style="background-color: ${categoriaColor}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block;">
              ${noticia.categoria || "General"}
            </span>
          </div>
          <h3 class="news-title" style="margin: 0 0 14px 0; font-size: 22px; font-weight: 700; color: #1a1a1a; line-height: 1.3; letter-spacing: -0.3px;">
            ${noticia.titulo || "Sin título"}
          </h3>
          <div style="color: #4a4a4a; font-size: 15px; line-height: 1.7; margin-bottom: 16px;">
            ${(noticia.resumen || "")
              .split("\n")
              .map((p) => `<p style="margin: 0 0 10px 0;">${p}</p>`)
              .join("")}
          </div>
          ${
            noticia.link
              ? `<a href="${noticia.link}" style="display: inline-block; color: ${categoriaColor}; text-decoration: none; font-size: 14px; font-weight: 600; padding: 8px 0; border-bottom: 2px solid ${categoriaColor};">Leer más →</a>`
              : ""
          }
        </div>
      </div>
    `;
  };

  return `
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
              <!-- Header estilo diario -->
              <tr>
                <td style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid #333;">
                  <div style="margin-bottom: 8px;">
                    <h1 class="header-title" style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; font-family: 'Georgia', 'Times New Roman', serif;">
                      Briefy News
                    </h1>
                  </div>
                  <div style="border-top: 2px solid #ffffff; border-bottom: 2px solid #ffffff; padding: 8px 0; margin: 12px 0;">
                    <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
                      ${formatDate(fecha)}
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
                  ${
                    noticiasArgentina.length > 0
                      ? `
                    <div style="margin-bottom: 32px;">
                      <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 3px solid #000000;">
                        <h2 class="section-title" style="margin: 0; font-size: 28px; font-weight: 800; color: #000000; letter-spacing: -0.5px; text-transform: uppercase; font-family: 'Georgia', 'Times New Roman', serif;">
                          🇦🇷 Argentina
                        </h2>
                      </div>
                      ${noticiasArgentina.map((noticia, index) => renderNewsItem(noticia, index, imageCids)).join("")}
                    </div>
                  `
                      : ""
                  }
                  
                  ${
                    noticiasInternacionales.length > 0
                      ? `
                    <div>
                      <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 3px solid #000000;">
                        <h2 class="section-title" style="margin: 0; font-size: 28px; font-weight: 800; color: #000000; letter-spacing: -0.5px; text-transform: uppercase; font-family: 'Georgia', 'Times New Roman', serif;">
                          🌍 Internacional
                        </h2>
                      </div>
                      ${noticiasInternacionales.map((noticia, index) => renderNewsItem(noticia, index, imageCids)).join("")}
                    </div>
                  `
                      : ""
                  }
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
                    <span style="color: #777777;">
                      ${newsData.fuente || "Gemini"} • Modelo: ${modelo} • ${fecha}
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
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.warn(
      "EMAIL_USER o EMAIL_PASSWORD no están configurados; se omite el envío de correo."
    );
    return;
  }

  if (!EMAIL_RECIPIENTS || EMAIL_RECIPIENTS.length === 0) {
    console.warn(
      "EMAIL_RECIPIENTS no está configurado o está vacío; se omite el envío de correo."
    );
    return;
  }

  let htmlContent;
  let textContent;
  let modelo = modelUsed;
  let attachments = [];

  if (typeof body === "object" && body.noticias) {
    // Es un objeto JSON con noticias estructuradas
    // Obtener el modelo del objeto si no se pasó como parámetro
    modelo = modelo || body.modelo_usado || "Desconocido";
    
    // Preparar attachments con CID para las imágenes
    const imageCids = {};
    
    // Crear attachments para cada categoría única
    const categoriasUsadas = new Set();
    body.noticias.forEach(noticia => {
      const categoriaNormalizada = normalizeCategory(noticia.categoria);
      categoriasUsadas.add(categoriaNormalizada);
    });
    
    // Agregar "general" por si acaso
    categoriasUsadas.add("general");
    
    console.log(`📋 Categorías encontradas en noticias:`, Array.from(categoriasUsadas));
    console.log(`📋 Rutas de imágenes disponibles:`, Object.keys(categoryImagePaths));
    
    categoriasUsadas.forEach(categoria => {
      if (categoryImagePaths[categoria] && fs.existsSync(categoryImagePaths[categoria])) {
        // Usar un CID único por categoría (sin timestamp para evitar problemas)
        const cid = `category-${categoria}`;
        imageCids[categoria] = cid;
        attachments.push({
          filename: `${categoria}.png`,
          path: categoryImagePaths[categoria],
          cid: cid
        });
        console.log(`✅ Attachment creado para categoría "${categoria}" con CID: ${cid}, ruta: ${categoryImagePaths[categoria]}`);
      } else {
        console.warn(`⚠️  No se encontró ruta de imagen para categoría "${categoria}"`);
        console.warn(`   Rutas disponibles: ${Object.keys(categoryImagePaths).join(", ")}`);
      }
    });
    
    console.log(`📎 Total de attachments creados: ${attachments.length}`);
    console.log(`🆔 CIDs generados:`, imageCids);
    
    htmlContent = generateNewsHTML(body, modelo, imageCids);
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

  const mailOptions = {
    from: EMAIL_USER,
    to: EMAIL_RECIPIENTS.join(", "),
    subject,
    text: textContent,
    html: htmlContent,
  };
  
  // Agregar attachments si existen (para imágenes con CID)
  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments;
  }

  await transporter.sendMail(mailOptions);
};

