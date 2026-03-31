import express, { urlencoded } from 'express'
import userRouter from './routes/user.route.js'
import cookieParser from 'cookie-parser'
const app = express()


app.use(express.json({ limit: '16kb' }))
app.use(urlencoded({ extended: true, limit: "16kb" }))
app.use(cookieParser())
app.use('/api/v1/user', userRouter)

export { app }