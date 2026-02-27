import { Submission } from "../models/Submission";
import { Problem } from "../models/Problem";

// GET /problems/:id/submissions
export const getSubmissionsByProblem = async (c: any) => {
    const id = c.req.param("id");
    try {
        const submissions = await Submission.find({ problem: id })
            .populate("createdBy", "username email")
            .sort({ createdAt: -1 });
        return c.json(submissions, 200);
    } catch (error) {
        return c.json({ message: "Error fetching submissions" }, 500);
    }
}

// GET /submissions/:id
export const getSubmissionById = async (c: any) => {
    const id = c.req.param("id");
    try {
        const submission = await Submission.findById(id)
            .populate("createdBy", "username email")
            .populate("problem", "title difficulty");
        if (!submission) {
            return c.json({ message: "Submission not found" }, 404);
        }
        return c.json(submission, 200);
    } catch (error) {
        return c.json({ message: "Error fetching submission" }, 500);
    }
}

// GET /users/:id/submissions
export const getSubmissionsByUser = async (c: any) => {
    const id = c.req.param("id");
    try {
        const submissions = await Submission.find({ createdBy: id })
            .populate("problem", "title difficulty")
            .sort({ createdAt: -1 });
        return c.json(submissions, 200);
    } catch (error) {
        return c.json({ message: "Error fetching submissions" }, 500);
    }
}

// GET /users/:userId/problems/:problemId/submissions
export const getSubmissionsByUserByProblem = async (c: any) => {
    const userId = c.req.param("userId");
    const problemId = c.req.param("problemId");
    try {
        const submissions = await Submission.find({ createdBy: userId, problem: problemId })
            .sort({ createdAt: -1 });
        return c.json(submissions, 200);
    } catch (error) {
        return c.json({ message: "Error fetching submissions" }, 500);
    }
}

// GET /submissions?sortBy=createdAt&order=desc
export const getAllSubmissionsBySorted = async (c: any) => {
    const sortBy = c.req.query("sortBy") || "createdAt";
    const order = c.req.query("order") === "asc" ? 1 : -1;
    try {
        const submissions = await Submission.find()
            .populate("createdBy", "username email")
            .populate("problem", "title difficulty")
            .sort({ [sortBy]: order });
        return c.json(submissions, 200);
    } catch (error) {
        return c.json({ message: "Error fetching submissions" }, 500);
    }
}

// POST /problems/:id/execute
// Runs code against sample testcases without saving — like the "Run" button
// Requires an external code execution service (e.g. Judge0)
export const executeProblem = async (c: any) => {
    const id = c.req.param("id");
    try {
        const { code, language } = await c.req.json();

        if (!code || !language) {
            return c.json({ message: "code and language are required" }, 400);
        }

        const problem = await Problem.findById(id).populate("sampleTestcases");
        if (!problem) {
            return c.json({ message: "Problem not found" }, 404);
        }

        // TODO: send code + sampleTestcases to code execution service (e.g. Judge0)
        // const results = await executeCode({ code, language, testcases: problem.sampleTestcases });
        // return c.json({ results }, 200);

        return c.json({ message: "Code execution service not yet connected", problem: problem._id }, 501);
    } catch (error) {
        return c.json({ message: "Error executing code" }, 500);
    }
}

// POST /problems/:id/submit
// Runs code against ALL testcases and saves the submission
// Requires an external code execution service (e.g. Judge0)
export const submitProblem = async (c: any) => {
    const id = c.req.param("id");
    try {
        const { code, language, createdBy } = await c.req.json();

        if (!code || !language || !createdBy) {
            return c.json({ message: "code, language, and createdBy are required" }, 400);
        }

        const problem = await Problem.findById(id);
        if (!problem) {
            return c.json({ message: "Problem not found" }, 404);
        }

        // TODO: fetch all testcases for this problem and run via execution service
        // const testcases = await Testcase.find({ problem: id });
        // const { status, runtime, memory } = await executeCode({ code, language, testcases });

        // Placeholder values until execution service is connected
        const status = "pending";
        const runtime = 0;
        const memory = 0;

        const submission = await Submission.create({
            code,
            language,
            createdBy,
            problem: id,
            status,
            runtime,
            memory,
        });

        return c.json(submission, 201);
    } catch (error) {
        return c.json({ message: "Error submitting problem" }, 500);
    }
}
