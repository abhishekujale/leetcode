import { Problem } from "../models/Problem";


export const getAllProblems = async (c: any) => {
    try {
        const problems = await Problem.find();
        return c.json(problems, 200);
    }
    catch (error) {
        return c.json("Unable to fetch problems", 500);
    }
}

export const getProblemsByDifficulty = async (c: any) => {
    const diff = c.req.json();
    try {
        const problems = await Problem.find({ difficulty: diff });
        return c.json(problems);
    } catch (error) {
        return c.json("Internal Server Error", 500);
    }
}

export const getProblemsByTags = async (c: any) => {
    const tags = c.req.json();
    try {
        const problems = await Problem.find({ tags: { $in: tags } });
        return c.json(problems);
    } catch (error) {
        return c.json("Internal Server Error", 500);
    }
}

export const createProblems = async (c: any) => {
    const tags = c.req.json();
    try {

    } catch (error) {

    }
}
export const updateProblems = async (c: any) => {
    const id = c.req.param();
    try {

    } catch (error) {

    }
}

export const deleteProblems = async (c: any) => {
    const id = c.req.param();
    try {

    } catch (error) {

    }
}

export const runProblem = async (c: any) => {

    try {

    } catch (error) {

    }
}

