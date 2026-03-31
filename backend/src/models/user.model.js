import mongoose from "mongoose";
import bcrypt, { hash } from 'bcryptjs'

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [ true, "Name is required for creating an account" ],
        trim: true
    },
    email: {
        type: String,
        required: [ true, "Email is required for creating a user" ],
        trim: true,
        lowercase: true,
        match: [ /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid Email address" ],
        unique: [ true, "Email already exists." ]
    },
    
    password: {
        type: String,
        required: [ true, "Password is required for creating an account" ],
        minlength: [ 6, "password should contain more than 6 character" ],
        select: false
    },
}, {
    timestamps: true
})

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")){
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);

})

// user made methods 
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

const User = mongoose.model("User", userSchema)

module.exports = User;