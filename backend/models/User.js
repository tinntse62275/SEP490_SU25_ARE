import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["admin", "customer", "staff"],
        default: "customer", // Mặc định là "customer" nếu không nhập
    },
    profileImage: { type: String },
    phone: { type: String },
    // Use timestamps under to automatically manage createdAt and updatedAt fields
    // createAT: { type: Date, default: Date.now },
    // updateAT: { type: Date, default: Date.now },
    isOnline: { type: Boolean, default: false },
    // NEW FIELDS for google authentication
    googleId: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values
    },
    picture: {
        type: String, // Google profile picture URL
    },
    // NEW FIELDS END

    lastMessageTime: { type: Date, default: null }
}, {
    timestamps: true    // Automatically manage createdAt and updatedAt fields
})

const User = mongoose.model("User", userSchema)
export default User;