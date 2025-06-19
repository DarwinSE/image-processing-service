import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { Hono } from 'hono'
import { decode, jwt, verify } from 'hono/jwt'
import limiter from '../utils/helper'
import { findUserById } from '../services/user'
import { transformImage } from '../services/method'
import { getAllImagesSchema, getImageSchema, transformImageSchema, uploadImageSchema } from '../schemas/image'
import { createImage, deleteImage, findImageById, getAllImages, totalUserImages } from '../services/image'
import { config } from 'dotenv'

config()

const imageRoutes = new Hono()

const PayloadSchema = z.object({
    id: z.string()
})

imageRoutes.use('*', limiter, async (c, next) => {
    if (c.res.status === 429) {
        return c.json({ success: false, message: 'Too many requests', data: null }, 429)
    }

    return await next()
})

imageRoutes.use('*', jwt({ secret: process.env.JWT_SECRET as string}))
    .use('*', async (c, next) => {
        const token = c.req.header('Authorization')?.replace('Bearer ', '')

        const rawPayload = await verify(token as string, process.env.JWT_SECRET as string)
        const payload = PayloadSchema.parse(rawPayload)

        if (!payload) {
            return c.json({ success: false, message: 'Invalid or expired token', data: null }, 401)
        }

        const user = await findUserById(payload.id)

        if (!user) {
            return c.json({ success: false, message: 'User does not exist', data: null }, 401)
        }

        return await next()
    })
    .post('/images', zValidator('form', uploadImageSchema), async c => {
        const token = c.req.header('Authorization')?.replace('Bearer ', '') as string
        const { payload } = decode(token)
        const formData = await c.req.formData()
        const images = formData.getAll('image')
        const createdImages = []

        for (let index = 0; index < images.length; index++) {
            const image = images[index] as unknown as File
            const size = image.size
            const format = image.type
            const original_name = image.name

            const imageBuffer = Buffer.from(await image?.arrayBuffer()).toString('base64')
            const newImage = await createImage({ image: imageBuffer, size, format, original_name, user: payload?.id as string })

            createdImages.push(newImage)
        }

        return c.json({ success: true, message: 'Images created', data: createdImages }, 201)
    })
    .get('/images/:id', zValidator('param', getImageSchema), async c => {
        const { id } = c.req.valid('param')
        const image = await findImageById(id)

        if (!image) {
            return c.json({ success: false, message: 'Image not found', data: null }, 404)
        }

        const token = c.req.header('Authorization')?.replace('Bearer ', '') as string
        const { payload } = decode(token)

        if (payload.id !== image.user.toString()) {
            return c.json({ success: false, message: 'You are not authorized to access this image', data: null }, 401)
        }

        return c.json({ success: true, message: 'Image found', data: image }, 200)
    })
    .get('/images', zValidator('query', getAllImagesSchema), jwt({ secret: process.env.JWT_SECRET || '' }), async c => {
        const { limit: requestedLimit, page: requestedPage } = c.req.valid('query')
        const token = c.req.header('Authorization')?.replace('Bearer ', '') as string
        const { payload } = decode(token)
        const page = Number(requestedPage) || 1
        const limit = Number(requestedLimit) || 10
        const skip = (page - 1) * limit
        const images = await getAllImages({ limit, skip, id: String(payload?.id) })
        const total = await totalUserImages(String(payload?.id))

        return c.json({
            success: true,
            message: 'Images found',
            data: images,
            meta: {
                total,
                current_page: page,
                per_page: limit,
                total_pages: Math.ceil(total / limit) || 1,
                has_next_page: page < Math.ceil(total / limit),
                has_previous_page: page > 1
            }
        })
    })
    .post('/images/:id/transform', zValidator('param', getImageSchema), zValidator('json', transformImageSchema), async c => {
        const { id } = c.req.valid('param')
        const data = c.req.valid('json')
        const image = await findImageById(id)

        if (!image) {
            return c.json({ success: false, message: 'Image not found', data: null }, 404)
        }

        const token = c.req.header('Authorization')?.replace('Bearer ', '') as string
        const { payload } = decode(token)

        if (payload.id !== image.user.toString()) {
            return c.json({ success: false, message: 'You are not authorized to access this image', data: null }, 401)
        }

        const transformedImage = await transformImage({
            image: Buffer.from(image.image, 'base64'),
            format: data.format,
            quality: data.quality,
            lossless: data.lossless,
            resize: data.resize,
            grayscale: data.grayscale,
            rotate: data.rotate
        })

        return c.json({ success: true, message: 'Image transformed', data: transformedImage }, 200)
    })
    .delete('/images/:id', zValidator('param', getImageSchema), async c => {
        const { id } = c.req.valid('param')
        const image = await findImageById(id)

        if (!image) {
            return c.json({ success: false, message: 'Image not found', data: null }, 404)
        }

        const token = c.req.header('Authorization')?.replace('Bearer ', '') as string
        const { payload } = decode(token)

        if (payload.id !== image.user.toString()) {
            return c.json({ success: false, message: 'You are not authorized to access this image', data: null }, 401)
        }

        await deleteImage(id)

        return c.json({ success: true, message: 'Image deleted', data: null }, 200)
    })

export default imageRoutes