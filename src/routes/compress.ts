import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { imageFormat } from '../utils/constant'
import limiter from '../utils/helper'
import { transformImage } from '../services/method'
import { compressImageSchema } from '../schemas/compress'

const compressRoutes = new Hono()

type Format  = (typeof imageFormat)[number]

compressRoutes.post('/compress', limiter, zValidator('form', compressImageSchema), async c => {
    const formData = await c.req.formData()
    const format = formData.get('format') as Format
    const quality = Number(formData.get('quality')) ?? 80
    const lossless = Boolean(formData.get('lossless'))

    const allEntries = formData.getAll('image')
    const images = allEntries.filter(entry => entry instanceof File) as File[]

    const width = Number(formData.get('resize_width'))
    const height = Number(formData.get('resize_height'))
    const rotate = Number(formData.get('rotate'))
    const grayscale = Boolean(formData.get('grayscale'))
    let allImages = []

    for (let index = 0; index < images.length; index++) {
        const image = images[index]
        const imageBuffer = Buffer.from(await image?.arrayBuffer()).toString('base64')
        const transformedImage = await transformImage({
            image: Buffer.from(imageBuffer, 'base64'),
            format,
            quality: Number(quality),
            lossless: Boolean(lossless),
            resize: { width, height },
            rotate,
            grayscale
        })

        if (!transformedImage) {
            return c.json({ success: false, message: 'Error transforming image', data: null }, 400)
        }

        allImages.push(transformedImage)
    }

    return c.json({ success: true, message: 'Images compressed', data: allImages }, 201)
})

export default compressRoutes