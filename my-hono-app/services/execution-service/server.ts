import { serve } from "@hono/node-server"
import dotenv from "dotenv"
dotenv.config()
import app from "./index.js"

const PORT = parseInt(process.env.PORT || "3003")

serve({ fetch: app.fetch, port: PORT }, (info) =>
  console.log(`⚙️  Execution Worker → http://localhost:${info.port}  (workers=3)`)
)
