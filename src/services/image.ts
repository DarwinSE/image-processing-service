import type { UserDocument } from '../models/user'
import type { ImageDocument } from '../models/image'
import Image from '../models/image'

type ImageInput = Pick<ImageDocument, 'image' | 'format' | 'original_name' | 'size' | 'user'>

type GetAllImagesInput = {
    id: string
    limit: number
    skip: number
}

export const createImage = async (input: ImageInput) => {
    return await Image.create(input)
}

export const findImageById = async (id: string) => {
    return await Image.findById(id)
}

export const getAllImages = async ({ id, limit, skip }: GetAllImagesInput) => {
    return await Image.find({ user: id }).limit(limit).skip(skip).sort({ created_at: -1 })
}

export const totalUserImages = async (id: UserDocument['id']) => {
    return await Image.countDocuments({ user: id })
}

export const deleteImage = async (id: string) => {
    return await Image.findByIdAndDelete(id)
}