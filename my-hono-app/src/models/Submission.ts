import mongoose from "mongoose"

const testResultSchema = new mongoose.Schema(
  {
    input: String,
    expectedOutput: String,
    actualOutput: String,
    passed: Boolean,
    runtime: Number,
    error: String,
  },
  { _id: false }
)

const submissionSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: [
      "pending",
      "accepted",
      "wrong_answer",
      "time_limit_exceeded",
      "runtime_error",
      "compilation_error",
      "no_testcases",
      "error",
    ],
    default: "pending",
  },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  language: { type: String, required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
  runtime: { type: Number, default: 0 },
  memory: { type: Number, default: 0 },
  testResults: { type: [testResultSchema], default: [] },
})

export const Submission = mongoose.model("Submission", submissionSchema)
