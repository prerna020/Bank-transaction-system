import express, { urlencoded } from 'express'
import userRouter from './routes/user.route.js'
import cookieParser from 'cookie-parser'
import accountRouter from './routes/account.route.js'
import transactionRouter from './routes/transaction.route.js'

const app = express()


app.use(express.json({ limit: '16kb' }))
app.use(urlencoded({ extended: true, limit: "16kb" }))
app.use(cookieParser())

app.use('/api/v1/user', userRouter)
app.use('/api/v1/account', accountRouter)
app.use('/api/v1/transaction',transactionRouter)
export { app }