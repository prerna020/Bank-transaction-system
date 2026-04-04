import bcrypt from 'bcryptjs';
import {User} from '../models/user.model.js'
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendRegistrationEmail } from '../services/email.service.js';
import cookie from 'cookie'

const generateAccessRefreshToken = async (userId) =>{
    try {
        const user = await User.findById(userId)
        if(!user){
            throw new ApiError(400, "User not found")
        }
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return {refreshToken, accessToken}

    } catch (error) {
        console.error("GENERR:", error);
        throw new ApiError(500, "Error in generating access and refresh token")
    }
}

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

    // await sendRegistrationEmail(user.email, user.username)

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered Successfully")
    )

}

const login = async (req, res) =>{
    const { username, password, email} = req.body;

    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{username}, {email}]
    }).select('+password')
    if(!user){
        throw new ApiError(409, "User does not exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const {refreshToken, accessToken} = await generateAccessRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("refresh_token", refreshToken, options)
    .cookie("access_token", accessToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
}

export {register, login} 