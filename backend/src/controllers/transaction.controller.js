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
    
    // 1. Validate request
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        throw new ApiError(400, "FromAccount, toAccount, amount and idempotencyKey are required")
    }

    const fromUserAccount = await Account.findOne({ _id: fromAccount})
    const toUserAccount = await Account.findOne({_id: toAccount})
    if (!fromUserAccount || !toUserAccount) {
        throw new ApiError(400, "Invalid fromAccount or toAccount")
    }

    // 2. Validate idempotency key

    const isTransactionAlreadyExists = await Transaction.findOne({
        idempotencyKey: idempotencyKey
    })
    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json(
                new ApiResponse(200, isTransactionAlreadyExists, "Transaction already processed")               
            )
        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json(
                new ApiResponse(200, isTransactionAlreadyExists, "Transaction is still processing")
            )
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json(
                new ApiResponse(200, isTransactionAlreadyExists, "Transaction processing failed, please retry")
            )
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json(
                new ApiResponse(200, isTransactionAlreadyExists, "Transaction was reversed, please retry")
            )
        }
    }

    // 3. Check account status

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json(
            new ApiResponse(400, "Both fromAccount and toAccount must be ACTIVE to process transaction")
        )
    }

    // 4. Derive sender balance from ledger
    const balance = await fromUserAccount.getBalance()

    if (balance < amount) {
        return res.status(400).json(
            new ApiResponse(400, `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`)
        )
    }

    let transaction;
    try {


        // 5. Create transaction (PENDING)
        const session = await mongoose.startSession()
        session.startTransaction()

        transaction = (await Transaction.create([ {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], { session }))[ 0 ]

        const debitLedgerEntry = await Ledger.create([ {
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], { session })

        // await (() => {
        //     return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
        // })()

        const creditLedgerEntry = await Ledger.create([ {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], { session })

        await Transaction.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )


        await session.commitTransaction()
        session.endSession()
    } catch (error) {

        return res.status(400).json({
            message: "Transaction is Pending due to some issue, please retry after sometime",
        })

    }
    // 10. Send email notification

    // await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.status(201).json(
        new ApiResponse(201, transaction, "Transaction is completed successfully")
    )
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