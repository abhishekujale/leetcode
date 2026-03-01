import { Hono } from "hono"
import { adminMiddleware } from "../middlewares/adminMiddleware.js"
import { createProblem, updateProblem, deleteProblem } from "../controllers/problemController.js"
import { createTestCase, updateTestCase, deleteTestCase } from "../controllers/testcaseController.js"

const router = new Hono()

// All admin routes require a valid admin JWT
router.use("*", adminMiddleware)

// Problem management (admin only)
router.post("/problems", createProblem)
router.put("/problems/:id", updateProblem)
router.delete("/problems/:id", deleteProblem)

// Testcase management (admin only)
router.post("/problems/:id/testcases", createTestCase)
router.put("/testcases/:id", updateTestCase)
router.delete("/testcases/:id", deleteTestCase)

export default router
