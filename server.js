import { createReadStream, existsSync } from "node:fs"
import { stat } from "node:fs/promises"
import { createServer } from "node:http"
import { extname, join, normalize } from "node:path"

const port = process.env.PORT || 4173
const root = join(process.cwd(), "dist")

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
}

createServer(async (request, response) => {
  if (request.url === "/api/health") {
    response.writeHead(200, { "Content-Type": "application/json" })
    response.end(JSON.stringify({ ok: true, app: "apex-fitness-vite" }))
    return
  }

  const url = new URL(request.url || "/", `http://${request.headers.host}`)
  const cleanPath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "")
  let filePath = join(root, cleanPath === "/" ? "index.html" : cleanPath)

  try {
    const fileStat = await stat(filePath)
    if (fileStat.isDirectory()) {
      filePath = join(filePath, "index.html")
    }
  } catch {
    filePath = join(root, "index.html")
  }

  if (!existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
    response.end("Build not found. Run npm run build first.")
    return
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
  })
  createReadStream(filePath).pipe(response)
}).listen(port, () => {
  console.log(`APEX FITNESS server running at http://localhost:${port}`)
})
