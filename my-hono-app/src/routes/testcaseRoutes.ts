import { Hono } from "hono";
import {
    allTestcases,
    getTestCase,
    testCaseCreator,
} from "../controllers/testcaseController";

const router = new Hono();

router.get("/problems/:id/testcases", allTestcases);

// Static route before /:id to avoid conflict
router.get("/testcases/:id/creator", testCaseCreator);
router.get("/testcases/:id", getTestCase);

export default router;
