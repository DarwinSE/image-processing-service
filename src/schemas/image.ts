import { z } from 'zod'
import { isObjectIdOrHexString } from 'mongoose'
import { imageFormat, losslessFormat } from '../utils/constant'

export const uploadImageSchema = z.object({
    image: z.instanceof(File).array().or(z.instanceof(File))
})

export const getImageSchema = z.object({
    id: z.string({ required_error: 'Image ID is required' })
        .trim()
        .refine(val => isObjectIdOrHexString(val), { message: 'Invalid image ID' })
})

export const getAllImagesSchema = z.object({
    limit: z.coerce
        .number()
        .positive()
        .min(5, { message: 'Limit must be greater than or equal to 5' })
        .max(100, { message: 'Limit must be less than or equal to 100' })
        .optional(),

    page: z.coerce
        .number({ required_error: 'Page is required' })
        .positive({ message: 'Page must be a positive number' })
        .catch(1)
})

export const transformImageSchema = z.object({
    format: z.enum(imageFormat, { required_error: `Image format can only be one of: ${imageFormat.join(', ')}` }),

    quality: z.number({ required_error: 'Quality is required' })
        .positive()
        .gte(1, { message: 'Quality must be between 1 and 100' })
        .lte(100, { message: 'Quality must be between 1 and 100' })
        .default(80),

    lossless: z.boolean()
        .optional(),

    resize: z.object({
        width: z.number({ required_error: 'Width is required' })
            .positive(),
        height: z.number({ required_error: 'Height is required' })
            .positive()
    })
        .optional(),

    rotate: z.number({ required_error: 'Rotate is required' })
        .or(z.literal(undefined)),

    grayscale: z.boolean()
        .or(z.literal(undefined))
})
.superRefine((val, ctx) => {
    if (String(val.lossless) && !losslessFormat.includes(val.format as typeof losslessFormat[number])) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Image format must be one of: ${losslessFormat.join(', ')}, to be lossless` })
    }

    if (val.resize?.width && !val.resize?.height) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Resize height is required when resize width is provided' })
    }

    if (val.resize?.height && !val.resize?.width) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Resize width is required when resize height is provided' })
    }
})