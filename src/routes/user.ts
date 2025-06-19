import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import userSchema from '../schemas/user'
import { createUser, findUser } from '../services/user'
import { config } from 'dotenv'

config()

const EXPIRE_AT = Math.floor(Date.now() / 1000) + 60 * 15 // 15 minutes

const userRoutes = new Hono()

userRoutes.post('/register', zValidator('json', userSchema), async c => {
    const valid = c.req.valid('json')

    const user = await findUser({ username: valid.username }, { password: valid.password })

    if (user) {
        return c.json({ success: false, message: 'User already exists' }, 409)
    }

    const newUser = await createUser(valid)

    return c.json({ success: true, message: 'User created', data: newUser }, 201)
})
    .post('/login', zValidator('json', userSchema), async c => {
        const valid = c.req.valid('json')

        const user = await findUser({ username: valid.username }, { password: valid.password })

        if (!user) {
            return c.json({ success: false, message: 'This user does not exist' }, 404)
        }

        const validPassword = await user.password === valid.password

        if (!validPassword) {
            return c.json({ success: false, message: 'Invalid password' }, 400)
        }

        const token = await sign({ username: user.username, id: user._id, exp: EXPIRE_AT }, process.env.JWT_SECRET as string)

        return c.json({ success: true, message: 'User logged in', data: { user, token } }, 200)
    })

export default userRoutes