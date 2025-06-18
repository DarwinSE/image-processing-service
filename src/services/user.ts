import type { FilterQuery, ProjectionFields, QueryOptions } from 'mongoose'
import type { UserDocument } from '../models/user'
import User from '../models/user'

type UserInput = Pick<UserDocument, 'username' | 'password'>

export const createUser = async (input: UserInput) => {
    return await User.create(input)
}

export const findUserById = async (id: string) => {
    return await User.findById(id)
}

export const findUser = async (query: FilterQuery<UserDocument>, projection: ProjectionFields<UserDocument>, options: QueryOptions = {}) => {
    return await User.findOne(query, projection, options)
}

export const deleteUser = async (query: FilterQuery<UserDocument>) => {
    return await User.deleteOne(query)
}