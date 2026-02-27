import { Hono } from "hono";
import { registerUser, loginUser } from "../controllers/userController";

const router = new Hono();

router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);

export default router;
