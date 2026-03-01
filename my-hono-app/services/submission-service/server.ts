import { serve } from "@hono/node-server"
import dotenv from "dotenv"
dotenv.config()
import app from "./index.js"

const PORT = parseInt(process.env.PORT || "3004")

serve({ fetch: app.fetch, port: PORT }, (info) =>
  console.log(`📝 Submission Svc  → http://localhost:${info.port}`)
)
