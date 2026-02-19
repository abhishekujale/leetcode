import mongoose from "mongoose";

const testcaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
});

export const Testcase = mongoose.model("Testcase", testcaseSchema);