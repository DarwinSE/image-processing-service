import { z } from 'zod'
import { imageFormat, losslessFormat } from '../utils/constant'

export const compressImageSchema = z.object({
    image: z.instanceof(File).array().or(z.instanceof(File)),

    format: z.enum(imageFormat, { required_error: `Image format can only be one of: ${imageFormat.join(', ')}` }),

    quality: z.coerce
        .number({ required_error: 'Image quality is required' })
        .positive()
        .gte(1, { message: 'Image quality must be between 1 and 100' })
        .lte(100, { message: 'Image quality must be between 1 and 100' })
        .default(80),

    lossless: z.boolean()
        .optional(),

    resize_width: z.coerce
        .number({ errorMap: (issue, { defaultError }) => ({
            message: issue.code === 'invalid_type' ? 'Resize width must be a number' : defaultError
        }) })
        .positive({ message: 'Resize width must be a positive number' })
        .optional(),

    resize_height: z.coerce
        .number({ errorMap: (issue, { defaultError }) => ({
            message: issue.code === 'invalid_type' ? 'Resize height must be a number' : defaultError
        }) })
        .positive({ message: 'Resize height must be a positive number' })
        .optional(),

    rotate: z.number({ required_error: 'Rotate is required' })
        .optional(),

    grayscale: z.coerce
        .string({ errorMap: (issue, { defaultError }) => ({
            message: issue.code === 'invalid_type' ? 'Grayscale must be a boolean (true or false)' : defaultError
        }) })
        .optional()
})
.superRefine((val, ctx) => {
    if (String(val.lossless) && !losslessFormat.includes(val.format as typeof losslessFormat[number])) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Image format must be one of: ${losslessFormat.join(', ')}, to be lossless` })
    }

    if (val.resize_width && !val.resize_height) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Resize height is required when resize width is provided' })
    }

    if (val.resize_height && !val.resize_width) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Resize width is required when resize height is provided' })
    }
})