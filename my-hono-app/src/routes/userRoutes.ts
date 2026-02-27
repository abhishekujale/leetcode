import { Hono } from "hono";
import { getAllUser, getUserById, updateUser, deleteUser } from "../controllers/userController";

const router = new Hono();

router.get("/users", getAllUser);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
