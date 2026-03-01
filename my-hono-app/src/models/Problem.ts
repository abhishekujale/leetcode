import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    constraits: { type: String },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tags: [{ type: String }],
    // Per-language starter code shown to the user in the editor
    boilerplate: { type: Map, of: String, default: {} },
    // Per-language driver/harness code — contains {{USER_CODE}} placeholder
    driverCode: { type: Map, of: String, default: {} },
});

export const Problem = mongoose.model("Problem", problemSchema);