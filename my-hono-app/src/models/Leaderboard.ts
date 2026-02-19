import mongoose from "mongoose";

const leaderBoardSchema = new mongoose.Schema({
});

export const Leaderboard = mongoose.model("Leaderboard", leaderBoardSchema);