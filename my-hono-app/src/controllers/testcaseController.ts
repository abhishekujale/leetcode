import { Testcase } from "../models/Testcase";
import { Problem } from "../models/Problem";
import { User } from "../models/User";

export const allTestcases = async (c: any) => {
    const { id } = c.req.param();
    try {
        const testcases = await Testcase.find({ problem: id });
        return c.json(testcases);
    }
    catch (error) {
        return c.json({ message: 'Error fetching testcases', error }, 500);
    }
}

export const createTestCase = async (c: any) => {
    const { id } = c.req.param();
    const data = await c.req.json();

    try {
        const testcase = await Testcase.create({ ...data, problem: id });
        return c.json(testcase, 200);
    }
    catch (error) {
        return c.json({ message: 'Error creating testcase', error }, 500);
    }
}

export const getTestCase = async (c: any) => {
    const id = c.req.param();

    try {
        const testCase = await Testcase.findById(id);
        return c.json(testCase, 200);
    }
    catch (error) {
        return c.json("Facing some issues getting testcase", 401)
    }
}

export const updateTestCase = async (c: any) => {
    const id = c.req.param();
    const data = await c.req.json();
    try {
        const testcase = await Testcase.findById(id);

        await testcase?.updateOne(data)

        return c.json(testcase, 200);
    }
    catch (error) {
        c.json("Error updating testcase", 401);
    }
}

export const deleteTestCase = async (c: any) => {
    const id = c.req.param();
    try {
        const testcase = await Testcase.findByIdAndDelete(id);
        return c.json(testcase + "Deleted Successfully", 200);
    }
    catch {
        return c.json("Unable to delete testcase", 500);
    }
}


export const testCaseCreator = async (c: any) => {
    const { id } = c.req.param();
    try {
        const creator = await Testcase.findById(id);
        const user = await User.findById(creator?.createdBy);

        return c.json("Creator Fetched Succesfully", user, 200);
    }
    catch {
        return c.json("Error Fetching user", 500);
    }
}