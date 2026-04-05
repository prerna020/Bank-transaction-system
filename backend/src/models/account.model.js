import mongoose from "mongoose";
import { Ledger } from "./ledger.model.js";

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "accounts must be associated with a user"],
        index: true
    }, 
    status:{
        type: String,
        enum: {
            values: ['ACTIVE', 'FROZEN', 'CLOSED']
        },
        default: 'ACTIVE'
    },
    currency: {
        type: String,
        required: [true, 'currency is required'],
        default: "INR"
    }
},{
    timestamps : true
})

// compound index 
accountSchema.index({user: 1, status: 1})

accountSchema.methods.getBalance = async function () {
    const balanceData = await Ledger.aggregate([
        { $match: { account: this._id } },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: [ "$type", "DEBIT" ] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: [ "$type", "CREDIT" ] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: [ "$totalCredit", "$totalDebit" ] }
            }
        }
    ])

    if (balanceData.length === 0) {
        return 0
    }

    return balanceData[ 0 ].balance
}

export const Account = mongoose.model("Account", accountSchema)