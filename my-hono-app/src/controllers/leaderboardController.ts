import type { Context } from "hono"
import { User } from "../models/User.js"
import { cacheGet, cacheSet, cacheDel } from "../config/redis.js"

// GET /api/leaderboard?page=1&limit=50
export const getLeaderboard = async (c: Context) => {
  const page = Math.max(1, parseInt(c.req.query("page") || "1"))
  const limit = Math.min(100, parseInt(c.req.query("limit") || "50"))

  try {
    const cacheKey = `leaderboard:p${page}:l${limit}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      c.header("X-Cache", "HIT")
      return c.json(JSON.parse(cached), 200)
    }

    const skip = (page - 1) * limit

    // Aggregate: join with submissions to count unique accepted problems
    const [users, total] = await Promise.all([
      User.aggregate([
        {
          $lookup: {
            from: "submissions",
            let: { uid: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$createdBy", "$$uid"] },
                  status: "accepted",
                },
              },
              { $group: { _id: "$problem" } },
            ],
            as: "uniqueAccepted",
          },
        },
        {
          $addFields: {
            solvedCount: { $size: "$uniqueAccepted" },
          },
        },
        { $sort: { solvedCount: -1, coins: -1, createdAt: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            password: 0,
            uniqueAccepted: 0,
            submissions: 0,
          },
        },
      ]),
      User.countDocuments(),
    ])

    const result = {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }

    await cacheSet(cacheKey, JSON.stringify(result), 60) // 60 second TTL
    c.header("X-Cache", "MISS")
    return c.json(result, 200)
  } catch (error) {
    console.error("Leaderboard error:", error)
    return c.json({ message: "Error fetching leaderboard" }, 500)
  }
}

// GET /api/leaderboard/:userId/rank
export const getUserRank = async (c: Context) => {
  const userId = c.req.param("userId")
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: "submissions",
          let: { uid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$createdBy", "$$uid"] },
                status: "accepted",
              },
            },
            { $group: { _id: "$problem" } },
          ],
          as: "uniqueAccepted",
        },
      },
      { $addFields: { solvedCount: { $size: "$uniqueAccepted" } } },
      { $sort: { solvedCount: -1, coins: -1 } },
      { $project: { _id: 1, solvedCount: 1 } },
    ])

    const rank = users.findIndex((u) => u._id.toString() === userId) + 1
    if (rank === 0) return c.json({ message: "User not found" }, 404)

    return c.json({ userId, rank, total: users.length }, 200)
  } catch {
    return c.json({ message: "Error fetching rank" }, 500)
  }
}

export const invalidateLeaderboardCache = () => cacheDel("leaderboard")
