import { Hono } from "hono";
import {
    getAllSubmissionsBySorted,
    getSubmissionById,
    getSubmissionsByProblem,
    getSubmissionsByUser,
    getSubmissionsByUserByProblem,
    pollSubmissionStatus,
} from "../controllers/submissionController";

const router = new Hono();

router.get("/submissions", getAllSubmissionsBySorted);
router.get("/submissions/:id", getSubmissionById);
router.get("/submissions/:id/status", pollSubmissionStatus);

router.get("/problems/:id/submissions", getSubmissionsByProblem);

router.get("/users/:id/submissions", getSubmissionsByUser);
router.get("/users/:userId/problems/:problemId/submissions", getSubmissionsByUserByProblem);

export default router;
