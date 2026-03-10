export const config = {
    schedule: "0 12 * * *", // cron expression (solo referencia, GitHub Actions lo usa directo)
    geminiApiKey: process.env.GEMINI_API_KEY!,
    email: {
        smtpHost: process.env.SMTP_HOST!,
        smtpPort: Number(process.env.SMTP_PORT ?? 587),
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
        from: process.env.SMTP_FROM!,
    },
    subscribers: (process.env.SUBSCRIBERS ?? "")
        .split(",")
        .map(e => e.trim())
        .filter(Boolean),
    newsTopics: (process.env["NEWS_TOPICS"] ?? "tecnología,ciencia,economía global")
        .split(",")
        .map((t) => t.trim()),
    newsCountArgentina: Number(process.env["NEWS_COUNT_ARGENTINA"] ?? 5),
    newsCountInternational: Number(process.env["NEWS_COUNT_INTERNATIONAL"] ?? 5),
};