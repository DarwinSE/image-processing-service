import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

export interface UserDocument extends mongoose.Document {
    username: string
    password: string
}

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        }
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    }
)

UserSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) {
            next()
        }

        const hashedPassword = await bcrypt.hash(this.password, 10)
        this.password = hashedPassword
        next()
    } catch (error) {
        next()
    }
})

const User = mongoose.model<UserDocument>('User', UserSchema)

export default User