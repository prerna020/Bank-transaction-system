import express from 'express'
import { createAccount, getAccountBalance, getAccounts } from '../controllers/account.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.route('/').post(verifyJWT, createAccount)
router.route('/').post(verifyJWT, getAccounts)
router.route('/balance/:accountId').post(verifyJWT, getAccountBalance)


export default router