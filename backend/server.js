import express from 'express'
import dotenv from 'dotenv'
import connectDB from './src/db/db.js';

dotenv.config()

const app = express();

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 3000, ()=>{
        console.log(`Server running on port ${process.env.PORT}`)
    });
})
.catch((err)=>{
    console.error("DB connection failed!", err);
})