import { Hono } from "hono";
import {
    getAllProblems,
    getProblemById,
    getProblemsByDifficulty,
    getProblemsByTags,
    runProblem,
} from "../controllers/problemController";
import { executeProblem, submitProblem } from "../controllers/submissionController";

const router = new Hono();

// Static filter routes must come before /:id to avoid conflict
router.get("/problems/filter/difficulty", getProblemsByDifficulty);
router.get("/problems/filter/tags", getProblemsByTags);

router.get("/problems", getAllProblems);
router.get("/problems/:id", getProblemById);

router.post("/problems/:id/run", runProblem);
router.post("/problems/:id/execute", executeProblem);
router.post("/problems/:id/submit", submitProblem);

export default router;
