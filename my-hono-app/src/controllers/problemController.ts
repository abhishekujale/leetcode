import { Problem } from "../models/Problem";

// GET /problems
export const getAllProblems = async (c: any) => {
    try {
        const problems = await Problem.find();
        return c.json(problems, 200);
    } catch (error) {
        return c.json({ message: "Unable to fetch problems" }, 500);
    }
}

// GET /problems/:id
export const getProblemById = async (c: any) => {
    const id = c.req.param("id");
    try {
        const problem = await Problem.findById(id).populate("sampleTestcases");
        if (!problem) {
            return c.json({ message: "Problem not found" }, 404);
        }
        return c.json(problem, 200);
    } catch (error) {
        return c.json({ message: "Unable to fetch problem" }, 500);
    }
}

// GET /problems?difficulty=easy
export const getProblemsByDifficulty = async (c: any) => {
    const difficulty = c.req.query("difficulty");
    try {
        const problems = await Problem.find({ difficulty });
        return c.json(problems, 200);
    } catch (error) {
        return c.json({ message: "Internal Server Error" }, 500);
    }
}

// GET /problems?tags=dp,array
export const getProblemsByTags = async (c: any) => {
    const tagsParam = c.req.query("tags");
    try {
        const tags = tagsParam ? tagsParam.split(",") : [];
        const problems = await Problem.find({ tags: { $in: tags } });
        return c.json(problems, 200);
    } catch (error) {
        return c.json({ message: "Internal Server Error" }, 500);
    }
}

// POST /problems
export const createProblem = async (c: any) => {
    try {
        const data = await c.req.json();
        const problem = await Problem.create(data);
        return c.json(problem, 201);
    } catch (error) {
        return c.json({ message: "Error creating problem" }, 500);
    }
}

// PUT /problems/:id
export const updateProblem = async (c: any) => {
    const id = c.req.param("id");
    try {
        const data = await c.req.json();
        const problem = await Problem.findByIdAndUpdate(id, data, { new: true });
        if (!problem) {
            return c.json({ message: "Problem not found" }, 404);
        }
        return c.json(problem, 200);
    } catch (error) {
        return c.json({ message: "Error updating problem" }, 500);
    }
}

// DELETE /problems/:id
export const deleteProblem = async (c: any) => {
    const id = c.req.param("id");
    try {
        const problem = await Problem.findByIdAndDelete(id);
        if (!problem) {
            return c.json({ message: "Problem not found" }, 404);
        }
        return c.json({ message: "Problem deleted successfully" }, 200);
    } catch (error) {
        return c.json({ message: "Error deleting problem" }, 500);
    }
}

// POST /problems/:id/run
// Runs submitted code against the problem's sample testcases
// Requires an external code execution service (e.g. Judge0)
export const runProblem = async (c: any) => {
    const id = c.req.param("id");
    try {
        const { code, language } = await c.req.json();

        const problem = await Problem.findById(id).populate("sampleTestcases");
        if (!problem) {
            return c.json({ message: "Problem not found" }, 404);
        }

        if (!code || !language) {
            return c.json({ message: "code and language are required" }, 400);
        }

        // TODO: send code + testcases to a code execution service (e.g. Judge0)
        // const results = await executeCode({ code, language, testcases: problem.sampleTestcases });
        // return c.json({ results }, 200);

        return c.json({ message: "Code execution service not yet connected", problem: problem._id }, 501);
    } catch (error) {
        return c.json({ message: "Error running problem" }, 500);
    }
}