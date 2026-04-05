import { Transaction } from "../models/transaction.model.js";
import { Ledger } from "../models/ledger.model.js";
import { sendTransactionEmail, sendFailedTransactionEmail } from "../services/email.service.js";
import { ApiError } from "../utils/ApiError.js";
import { Account } from "../models/account.model.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";

/*
1. Validate request
2. Validate idempotency key
3. Check account status
4. Derive sender balance from ledger
5. Create transaction (PENDING)
6. Create DEBIT ledger entry
7. Create CREDIT ledger entry
8. Mark transaction COMPLETED
9. Commit MongoDB session
10. Send email notification
*/

const createTransaction = async (req, res) =>{
    const {fromAccount, toAccount, amount, idempotencyKey} = req.body
}

const initialFundsTransaction = async (req,res) =>{
    try {
        const {toAccount, amount, idempotencyKey} = req.body
        if (!toAccount || !amount || !idempotencyKey) {
            throw new ApiError(400, "toAccount, amount and idempotencyKey are required")
        }
    
        const toUserAccount = await Account.findById(toAccount)
        console.log(toUserAccount)
        if(!toUserAccount){
            throw new ApiError(400, "Invalid account")
        }
    
        const fromUserAccount = await Account.findOne({ user: req.user._id })
        console.log(fromUserAccount);
        
        if(!fromUserAccount){
            throw new ApiError(400, "System user account not found")
        }
    
        const session = await mongoose.startSession();
        session.startTransaction()
    
    const transaction = new Transaction({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await Ledger.create([ {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    } ], { session })

    const creditLedgerEntry = await Ledger.create([ {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    } ], { session })

    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json(new ApiResponse(201, transaction, "Transaction is created successfully"))
} catch (error) {
        console.log(error)
        throw new ApiError(400, "Error in transaction")
    }

}

export {createTransaction, initialFundsTransaction}