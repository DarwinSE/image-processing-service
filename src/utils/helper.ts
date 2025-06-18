import { rateLimiter } from 'hono-rate-limiter'
import { nanoid } from 'nanoid'

const limiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-6',
    keyGenerator: () => nanoid()
})

export default limiter