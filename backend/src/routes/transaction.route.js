import express from "express"
import { createTransaction, initialFundsTransaction } from "../controllers/transaction.controller.js";
import { authSystemUser, verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route('/').post(verifyJWT, createTransaction)
router.route('/system/initial-fund').post(authSystemUser, initialFundsTransaction)

export default router;
