import { Hono } from "hono";
import connectDB from "./dbconfig";
import { authMiddleware } from "./middlewares/authMiddleware";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import problemRoutes from "./routes/problemRoutes";
import testcaseRoutes from "./routes/testcaseRoutes";
import submissionRoutes from "./routes/submissionRoutes";
import discussionRoutes from "./routes/discussionRoutes";

const app = new Hono();

connectDB();

app.get("/", (c) => c.text("Hello Hono!"));

// Public routes — no auth required
app.route("/api", authRoutes);

// Auth middleware applied to all /api/* routes below
app.use("/api/*", authMiddleware);

// Protected routes
app.route("/api", userRoutes);
app.route("/api", problemRoutes);
app.route("/api", testcaseRoutes);
app.route("/api", submissionRoutes);
app.route("/api", discussionRoutes);

export default app;
