import { Testcase } from "../models/Testcase";
import { User } from "../models/User";

// GET /problems/:id/testcases
export const allTestcases = async (c: any) => {
    const id = c.req.param("id");
    try {
        const testcases = await Testcase.find({ problem: id });
        return c.json(testcases, 200);
    } catch (error) {
        return c.json({ message: "Error fetching testcases" }, 500);
    }
}

// POST /problems/:id/testcases
export const createTestCase = async (c: any) => {
    const id = c.req.param("id");
    try {
        const data = await c.req.json();
        const testcase = await Testcase.create({ ...data, problem: id });
        return c.json(testcase, 201);
    } catch (error) {
        return c.json({ message: "Error creating testcase: " + error }, 500);
    }
}

// GET /testcases/:id
export const getTestCase = async (c: any) => {
    const id = c.req.param("id");
    try {
        const testcase = await Testcase.findById(id);
        if (!testcase) {
            return c.json({ message: "Testcase not found" }, 404);
        }
        return c.json(testcase, 200);
    } catch (error) {
        return c.json({ message: "Error fetching testcase" }, 500);
    }
}

// PUT /testcases/:id
export const updateTestCase = async (c: any) => {
    const id = c.req.param("id");
    try {
        const data = await c.req.json();
        const testcase = await Testcase.findByIdAndUpdate(id, data, { new: true });
        if (!testcase) {
            return c.json({ message: "Testcase not found" }, 404);
        }
        return c.json(testcase, 200);
    } catch (error) {
        return c.json({ message: "Error updating testcase" }, 500);
    }
}

// DELETE /testcases/:id
export const deleteTestCase = async (c: any) => {
    const id = c.req.param("id");
    try {
        const testcase = await Testcase.findByIdAndDelete(id);
        if (!testcase) {
            return c.json({ message: "Testcase not found" }, 404);
        }
        return c.json({ message: "Testcase deleted successfully" }, 200);
    } catch (error) {
        return c.json({ message: "Error deleting testcase" }, 500);
    }
}

// GET /testcases/:id/creator
export const testCaseCreator = async (c: any) => {
    const id = c.req.param("id");
    try {
        const testcase = await Testcase.findById(id);
        if (!testcase) {
            return c.json({ message: "Testcase not found" }, 404);
        }
        const user = await User.findById(testcase.createdBy);
        if (!user) {
            return c.json({ message: "Creator not found" }, 404);
        }
        return c.json({ message: "Creator fetched successfully", user }, 200);
    } catch (error) {
        return c.json({ message: "Error fetching creator" }, 500);
    }
}