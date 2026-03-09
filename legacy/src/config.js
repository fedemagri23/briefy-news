import 'dotenv/config';

// Configuración del servidor
export const PORT = process.env.PORT || 3000;

// Configuración de emails
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

// Lista de destinatarios (separados por comas)
// Ejemplo: "email1@example.com,email2@example.com"
export const EMAIL_RECIPIENTS = process.env.EMAIL_RECIPIENTS
  ? process.env.EMAIL_RECIPIENTS.split(',').map(email => email.trim()).filter(email => email)
  : [];

// Prefijo para el asunto del email
export const EMAIL_SUBJECT_PREFIX = process.env.EMAIL_SUBJECT_PREFIX || '📰 Noticias Diarias';

// Configuración del scheduler (cron job)
// Formato cron: minuto hora día mes día-semana
// Ejemplo: "00 07 * * *" = todos los días a las 07:00
export const SCHEDULER_CRON = process.env.SCHEDULER_CRON || '00 07 * * *';

// Zona horaria para el scheduler
// Lista de zonas: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
export const SCHEDULER_TIMEZONE = process.env.SCHEDULER_TIMEZONE || 'America/Argentina/Buenos_Aires';

// Configuración de modelos de Gemini AI
// Lista de modelos separados por comas (se intentarán en orden)
export const GEMINI_MODELS = process.env.GEMINI_MODELS
  ? process.env.GEMINI_MODELS.split(',').map(model => model.trim()).filter(model => model)
  : ['gemini-3-flash-preview', 'gemini-2.5-flash'];

// Habilitar/deshabilitar el scheduler automático
export const SCHEDULER_ENABLED = process.env.SCHEDULER_ENABLED !== 'false'; // Por defecto true

// Configuración de cantidad de noticias
// Cantidad de noticias argentinas a incluir en el newsletter
export const NEWS_COUNT_ARGENTINA = parseInt(process.env.NEWS_COUNT_ARGENTINA || '5', 10);

// Cantidad de noticias internacionales a incluir en el newsletter
export const NEWS_COUNT_INTERNATIONAL = parseInt(process.env.NEWS_COUNT_INTERNATIONAL || '5', 10);

// Configuración de categorías disponibles
// Lista de categorías separadas por comas que la IA puede usar para clasificar noticias
// Ejemplo: "Político,Económico,Social,General"
// Las categorías deben coincidir con los nombres de archivo de imágenes en src/assets/img/
export const NEWS_CATEGORIES = process.env.NEWS_CATEGORIES
  ? process.env.NEWS_CATEGORIES.split(',').map(cat => cat.trim()).filter(cat => cat)
  : ['Político', 'Económico', 'Social', 'General'];

// Mapeo de categorías a archivos de imagen (configurable)
// Formato: "Categoría:archivo.png,Categoría2:archivo2.png"
// Si no se configura, se usa el mapeo por defecto
export const NEWS_CATEGORY_IMAGE_MAP = process.env.NEWS_CATEGORY_IMAGE_MAP
  ? Object.fromEntries(
      process.env.NEWS_CATEGORY_IMAGE_MAP.split(',').map(item => {
        const [category, filename] = item.split(':').map(s => s.trim());
        return [category, filename];
      })
    )
  : {
      'Político': 'polÍtica.png',
      'Económico': 'economía.png',
      'Social': 'social.png',
      'General': 'social.png'
    };

// Mapeo de categorías a colores (configurable)
// Formato ENV sugerido: "Politico:#e53935,Economico:#1e88e5,Social:#43a047,General:#6c757d"
// Internamente se normalizan las claves para que coincidan con las devueltas por normalizeCategory
const rawColorMap = process.env.NEWS_CATEGORY_COLOR_MAP
  ? Object.fromEntries(
      process.env.NEWS_CATEGORY_COLOR_MAP.split(',').map(item => {
        const [rawCategory, color] = item.split(':').map(s => s.trim());
        const normalized = rawCategory
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // quitar tildes
          .replace(/\s+/g, ''); // quitar espacios
        return [normalized, color];
      })
    )
  : {
      politico: '#e53935',
      economico: '#1e88e5',
      social: '#43a047',
      general: '#6c757d'
    };

export const NEWS_CATEGORY_COLOR_MAP = rawColorMap;
