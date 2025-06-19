// api/src/middleware/apiKey.middleware.js
const apiKeyMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.API_KEY;

    // --- Perbaikan di sini: Logika blocking yang lebih ketat ---
    if (!expectedApiKey || expectedApiKey === 'YOUR_STATIC_SECURE_API_KEY_HERE') {
        // Dalam DEVELOPMENT, mungkin masih bisa dilanjutkan dengan WARNING.
        // Tetapi dalam PRODUCTION, ini HARUS MEMBLOKIR.
        if (process.env.NODE_ENV === 'production') {
            console.error("CRITICAL ERROR: API_KEY is not configured in production environment. Blocking request.");
            return res.status(500).json({ message: 'Server configuration error: API Key not set.' });
        }
        console.warn("API_KEY environment variable is not set or is using default placeholder. API key check is DISABLED for development.");
        return next(); // Lanjutkan di development jika API_KEY tidak diset/placeholder
    }

    // Jika API_KEY terdefinisi, wajib ada dan cocok
    if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(401).json({ message: 'Unauthorized: Invalid or missing API Key.' });
    }

    next(); // Lanjutkan jika API Key valid
};

module.exports = apiKeyMiddleware;