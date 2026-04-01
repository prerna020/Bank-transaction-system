import express from 'express'
import { createAccount, getAccountBalance, getAccounts } from '../controllers/account.controller'

const router = express.Router()

router.route('/').post(createAccount)
router.route('/').post(getAccounts)
router.route('/balance/:accountId').post(getAccountBalance)


export default router