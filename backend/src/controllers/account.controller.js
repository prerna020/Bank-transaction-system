import {Account} from '../models/account.model.js'
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const createAccount = async (req,res) => {
    try {
        const user = req.user;
        const account = Account.create({
            user: user._id
        })
        res.status(201).json(
            new ApiResponse(201,account, "Account created successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Error in creating account")
    }
}

const getAccounts = async () => {
    const accounts = await Account.find({ user: req.user._id });

    res.status(200).json(
        new ApiResponse(200, accounts, "Fetched successfully")
    )
}

const getAccountBalance = async () => {
    
}

export {getAccounts, createAccount, getAccountBalance}