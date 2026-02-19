import { Testcase } from "../models/Testcase";
import { Hono } from "hono";

const router = new Hono();

router.post('/testcases/:problemId', async (c) => {
    const { problemId } = c.req.param();
    const { input, output, description, createdBy } = await c.req.json();
    const testcase = new Testcase({ problem: problemId, input, output, description, createdBy });
    await testcase.save();
    return c.json(testcase);
})

router.get('/testcases/:problemId', async (c) => {
    const { problemId } = c.req.param();
    const testcases = await Testcase.find({ problem: problemId });
    return c.json(testcases);
})

