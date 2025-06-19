import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import mongoose from 'mongoose'
import connectDB from './utils/db'
import userRoutes from './routes/user'
import imageRoutes from './routes/image'
import compressRoutes from './routes/compress'
import { config } from 'dotenv'

config()

const app = new Hono()

app.use(cors())
app.use(logger())
app.use(prettyJSON())

app.get('/api/v1/health-check', async c => { return c.text('Ok') })

app.route('/api/v1/auth', userRoutes)
app.route('/api/v1', imageRoutes)
app.route('/api/v1', compressRoutes)

app.notFound(async c => {
    return c.json({ success: false, message: `Route ${c.req.url} not found`, data: null }, 404)
})

mongoose.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret._id = undefined
        ret.password = undefined

        return ret
    }
})

connectDB()

export default {
    port: process.env.PORT || 3000,
    fetch: app.fetch
}