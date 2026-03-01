import { serve } from "@hono/node-server"
import dotenv from "dotenv"

dotenv.config()

import app from "./src/index"

const PORT = parseInt(process.env.PORT || "8787")

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`🚀 LeetClone API running on http://localhost:${info.port}`)
  }
)
