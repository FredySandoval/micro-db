import rateLimit from 'express-rate-limit';

const limit_50max_15min = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Limit is set to create 10 collections every 15 minutes, to prevent spam' }
})

const limit_1000max_60min = rateLimit({
    windowMs: 60 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Limit is set to create 10 collections every 15 minutes, to prevent spam' }
})

export { limit_50max_15min, limit_1000max_60min };