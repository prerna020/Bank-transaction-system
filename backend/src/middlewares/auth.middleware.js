import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import jwt, { decode } from 'jsonwebtoken'
import { ApiResponse } from "../utils/ApiResponse.js"
import { tokenBlackList } from "../models/blackList.model.js"


export const verifyJWT = async (req, res, next) =>{
    try {
        const token = req.cookies?.access_token ||  req.header("Authorization")?.replace("Bearer ", "")
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
        
        const isBlacklisted = await tokenBlackList.findOne({ token })
        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized access, token is invalid"
            })
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decoded?._id).select(" -refreshToken")
    
        if(!user){
            throw new ApiError(401, "Invalid access token")
        }
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
}

export const authSystemUser = async (req,res, next) =>{
    const token = req.cookies.access_token ||  req.header("Authorization")?.replace("Bearer ", "")
    if(!token){
        throw new ApiError(401, "Unauthorized request")
    }
    const isBlacklisted = await tokenBlackList.findOne({ token })
    if (isBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decoded?._id).select('+systemUser')
        if(!user.systemUser){
            throw new ApiError(403, "Forbidden access, not a system user")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, "Unauthorized access, token is invalid")
    }
}