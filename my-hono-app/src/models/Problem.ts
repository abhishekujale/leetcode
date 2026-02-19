import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    constraits: { type: String },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sampleTestcases: [{ type: mongoose.Schema.Types.ObjectId, ref: "Testcase" }],
    tags: [{ type: String }],
});

export const Problem = mongoose.model("Problem", problemSchema);