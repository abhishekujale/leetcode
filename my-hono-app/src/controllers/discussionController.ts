import { Discussion } from "../models/discussion";

// GET /problems/:id/discussions
export const getAllDiscussionByProblem = async (c: any) => {
    const id = c.req.param("id");
    try {
        const discussions = await Discussion.find({ problem: id })
            .populate("createdBy", "username email")
            .sort({ createdAt: -1 });
        return c.json(discussions, 200);
    } catch (error) {
        return c.json({ message: "Error fetching discussions" }, 500);
    }
}

// GET /discussions/:id
export const getDiscussionById = async (c: any) => {
    const id = c.req.param("id");
    try {
        const discussion = await Discussion.findById(id)
            .populate("createdBy", "username email")
            .populate("problem", "title");
        if (!discussion) {
            return c.json({ message: "Discussion not found" }, 404);
        }
        return c.json(discussion, 200);
    } catch (error) {
        return c.json({ message: "Error fetching discussion" }, 500);
    }
}

// GET /users/:id/discussions
export const getDiscussionByUser = async (c: any) => {
    const id = c.req.param("id");
    try {
        const discussions = await Discussion.find({ createdBy: id })
            .populate("problem", "title difficulty")
            .sort({ createdAt: -1 });
        return c.json(discussions, 200);
    } catch (error) {
        return c.json({ message: "Error fetching discussions" }, 500);
    }
}

// GET /users/:userId/problems/:problemId/discussions
export const getDiscussionbyUserByProblem = async (c: any) => {
    const userId = c.req.param("userId");
    const problemId = c.req.param("problemId");
    try {
        const discussions = await Discussion.find({ createdBy: userId, problem: problemId })
            .sort({ createdAt: -1 });
        return c.json(discussions, 200);
    } catch (error) {
        return c.json({ message: "Error fetching discussions" }, 500);
    }
}

// POST /problems/:id/discussions
export const createDiscussion = async (c: any) => {
    const problemId = c.req.param("id");
    try {
        const data = await c.req.json();
        const discussion = await Discussion.create({ ...data, problem: problemId });
        return c.json(discussion, 201);
    } catch (error) {
        return c.json({ message: "Error creating discussion" }, 500);
    }
}

// PUT /discussions/:id
export const updateDiscussion = async (c: any) => {
    const id = c.req.param("id");
    try {
        const data = await c.req.json();
        const discussion = await Discussion.findByIdAndUpdate(
            id,
            { ...data, updatedAt: new Date() },
            { new: true }
        );
        if (!discussion) {
            return c.json({ message: "Discussion not found" }, 404);
        }
        return c.json(discussion, 200);
    } catch (error) {
        return c.json({ message: "Error updating discussion" }, 500);
    }
}

// DELETE /discussions/:id
export const deleteDiscussion = async (c: any) => {
    const id = c.req.param("id");
    try {
        const discussion = await Discussion.findByIdAndDelete(id);
        if (!discussion) {
            return c.json({ message: "Discussion not found" }, 404);
        }
        return c.json({ message: "Discussion deleted successfully" }, 200);
    } catch (error) {
        return c.json({ message: "Error deleting discussion" }, 500);
    }
}

// GET /discussions?sortBy=createdAt&order=desc
export const getAllDiscussionBySorted = async (c: any) => {
    const sortBy = c.req.query("sortBy") || "createdAt";
    const order = c.req.query("order") === "asc" ? 1 : -1;
    try {
        const discussions = await Discussion.find()
            .populate("createdBy", "username email")
            .populate("problem", "title")
            .sort({ [sortBy]: order });
        return c.json(discussions, 200);
    } catch (error) {
        return c.json({ message: "Error fetching discussions" }, 500);
    }
}

// GET /discussions?search=query
export const getAllDiscussionBySearch = async (c: any) => {
    const search = c.req.query("search") || "";
    try {
        const discussions = await Discussion.find({
            $or: [
                { title: { $regex: search, $options: "i" } },
                { content: { $regex: search, $options: "i" } },
            ],
        })
            .populate("createdBy", "username email")
            .populate("problem", "title")
            .sort({ createdAt: -1 });
        return c.json(discussions, 200);
    } catch (error) {
        return c.json({ message: "Error searching discussions" }, 500);
    }
}

// GET /discussions?problem=id&user=id
export const getAllDiscussionByFilter = async (c: any) => {
    const problemId = c.req.query("problem");
    const userId = c.req.query("user");
    try {
        const filter: Record<string, any> = {};
        if (problemId) filter.problem = problemId;
        if (userId) filter.createdBy = userId;

        const discussions = await Discussion.find(filter)
            .populate("createdBy", "username email")
            .populate("problem", "title")
            .sort({ createdAt: -1 });
        return c.json(discussions, 200);
    } catch (error) {
        return c.json({ message: "Error filtering discussions" }, 500);
    }
}

// GET /discussions?page=1&limit=10
export const getAllDiscussionByPagination = async (c: any) => {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
    const skip = (page - 1) * limit;
    try {
        const [discussions, total] = await Promise.all([
            Discussion.find()
                .populate("createdBy", "username email")
                .populate("problem", "title")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Discussion.countDocuments(),
        ]);
        return c.json({
            discussions,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        }, 200);
    } catch (error) {
        return c.json({ message: "Error fetching discussions" }, 500);
    }
}
