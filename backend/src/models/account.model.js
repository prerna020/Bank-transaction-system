import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "accounts must be associated with a user"],
        index: true
    }, 
    status:{
        enum: {
            values: ['ACTIVE', 'FROZEN', 'CLOSED']
        },
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

export default Account = mongoose.model("Account" , accountSchema)