import express from "express"
import { createTransaction, initialFundsTransaction } from "../controllers/transaction.controller.js";
import { authSystemUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route('/').post(authSystemUser, createTransaction)
router.route('/system/initial-fund').post(authSystemUser, initialFundsTransaction)

export default router;
