import { serve } from "@hono/node-server"
import dotenv from "dotenv"
dotenv.config()
import app from "./index.js"

const PORT = parseInt(process.env.PORT || "3002")

serve({ fetch: app.fetch, port: PORT }, (info) =>
  console.log(`📚 Problem Service → http://localhost:${info.port}`)
)
