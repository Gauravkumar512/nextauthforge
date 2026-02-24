import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: { 
        type: Date, 
        default: Date.now
    }
})

export const User = mongoose.models.users || mongoose.model("users", userSchema)