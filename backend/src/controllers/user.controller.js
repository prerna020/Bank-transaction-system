import {User} from '../models/user.model.js'
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const register = async (req, res) => {
    const { username, email, password } = req.body;

    if(!username || !email || !password){
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if(existingUser){
        throw new ApiError(409, "User already exists")
    }

    const user = await User.create({
        username, 
        email,
        password
    })

    const createdUser = await User.findById(user._id)
    if(!createdUser){
        throw new ApiError(500, "Internal error while creating user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered Successfully")
    )
}

export {register} 