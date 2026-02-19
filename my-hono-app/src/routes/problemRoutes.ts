import { Hono } from 'hono';
import { Problem } from '../models/Problem';
const router = new Hono();

router.get('/problems', async (c) => {
    const data = await c.req.json();
    // Here you would typically save the problem to the database
    // For demonstration, we'll just return the received data

    try {
        const problems = await Problem.find();
        return c.json(problems, 200);
    }
    catch (error) {
        return c.json({ message: 'Error fetching problems', error }, 500);
    }
})

router.post('/problems', async (c) => {
    const data = await c.req.json();
    // Here you would typically save the problem to the database
    // For demonstration, we'll just return the received data
    const problem = await Problem.create(data);
    return c.json({ message: 'Problem created successfully', problem }, 201);
})

router.get('/problems/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const problem = await Problem.findById(id);
        if (!problem) {
            return c.json({ message: 'Problem not found' }, 404);
        }
        return c.json(problem, 200);
    } catch (error) {
        return c.json({ message: 'Error fetching problem', error }, 500);
    }
})

router.get()
export default router;