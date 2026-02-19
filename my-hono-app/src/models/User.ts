import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    profilePicture: { type: String },
    bio: { type: String },
    coins: { type: Number, default: 0 },
    solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
    submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Submission" }],
    xAccount: { type: String },
    linkedInAccount: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", userSchema);