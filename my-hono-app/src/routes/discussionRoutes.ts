import { Hono } from "hono";
import {
    getAllDiscussionByProblem,
    getDiscussionById,
    getDiscussionByUser,
    getDiscussionbyUserByProblem,
    createDiscussionProblem,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion,
    getAllDiscussionBySorted,
    getAllDiscussionBySearch,
    getAllDiscussionByFilter,
    getAllDiscussionByPagination,
} from "../controllers/discussionController";

const router = new Hono();

// Static routes before /:id to avoid conflict
router.get("/discussions/search", getAllDiscussionBySearch);
router.get("/discussions/filter", getAllDiscussionByFilter);
router.get("/discussions/paginate", getAllDiscussionByPagination);
router.get("/discussions/sorted", getAllDiscussionBySorted);

router.get("/discussions/:id", getDiscussionById);
router.put("/discussions/:id", updateDiscussion);
router.delete("/discussions/:id", deleteDiscussion);

router.get("/problems/:id/discussions", getAllDiscussionByProblem);
router.post("/problems/:id/discussions", createDiscussionProblem);
router.post("/discussions", createDiscussion);

router.get("/users/:id/discussions", getDiscussionByUser);
router.get("/users/:userId/problems/:problemId/discussions", getDiscussionbyUserByProblem);

export default router;
