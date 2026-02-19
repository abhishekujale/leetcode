import { Hono } from 'hono'
import connectDB from './dbconfig'
const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

connectDB();

app.post('')
export default app
