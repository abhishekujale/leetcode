import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
    status: { type: String, required: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    language: { type: String, required: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
    runtime: { type: Number },
    memory: { type: Number }
});

export const Submission = mongoose.model("Submission", submissionSchema);