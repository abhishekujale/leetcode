import { Hono } from "hono";
import { registerUser, loginUser, oauthSync, setupAdmin } from "../controllers/userController";

const router = new Hono();

router.post("/auth/register", registerUser);
router.post("/auth/login", loginUser);
router.post("/auth/oauth", oauthSync);       // OAuth find-or-create (public)
router.post("/auth/setup-admin", setupAdmin); // One-time admin promotion (ADMIN_SECRET)

export default router;
