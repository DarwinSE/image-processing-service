import { z } from 'zod'
import sharp from 'sharp'
import { transformImageSchema } from '../schemas/image'

type ImageTransform = z.infer<typeof transformImageSchema>

interface TransformImagePayload extends ImageTransform {
    image: Buffer | Uint8Array
}

export const transformImage = async (payload: TransformImagePayload) => {
    try {
        let transformer = sharp(payload.image).toFormat(payload.format, { quality: payload.quality ?? 80, ...(payload.lossless ? { lossless: payload.lossless } : {}) })

        if (payload.resize?.width && payload.resize?.height) {
            transformer = transformer.resize({ width: payload.resize?.width, height: payload.resize?.height })
        }

        if (payload.grayscale) {
            transformer = transformer.grayscale()
        }

        if (payload.rotate) {
            transformer = transformer.rotate(payload.rotate)
        }

        const metadata = await transformer.metadata()
        const { data, info } = await transformer.toBuffer({ resolveWithObject: true })
        const imageBase64 = `data:image/${info.format};base64,${data.toString('base64')}`

        return {
            image: imageBase64,
            new_metadata: {
                width: info.width,
                height: info.height,
                size: info.size,
                format: info.format
            },
            original_metadata: {
                width: metadata.width,
                height: metadata.height,
                size: metadata.size,
                format: metadata.format
            }
        }
    } catch (error) {
        throw new Error('Error transforming image')
    }
}