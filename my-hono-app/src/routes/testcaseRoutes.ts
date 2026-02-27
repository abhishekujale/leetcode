import { Hono } from "hono";
import {
    allTestcases,
    createTestCase,
    getTestCase,
    updateTestCase,
    deleteTestCase,
    testCaseCreator,
} from "../controllers/testcaseController";

const router = new Hono();

router.get("/problems/:id/testcases", allTestcases);
router.post("/problems/:id/testcases", createTestCase);

// Static route before /:id to avoid conflict
router.get("/testcases/:id/creator", testCaseCreator);
router.get("/testcases/:id", getTestCase);
router.put("/testcases/:id", updateTestCase);
router.delete("/testcases/:id", deleteTestCase);

export default router;
