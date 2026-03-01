import { Hono } from "hono"
import { getLeaderboard, getUserRank } from "../controllers/leaderboardController.js"

const router = new Hono()

router.get("/leaderboard", getLeaderboard)
router.get("/leaderboard/:userId/rank", getUserRank)

export default router
