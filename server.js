const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = process.env.PORT || 8080

// Disable telemetry
process.env.NEXT_TELEMETRY_DISABLED = '1'

// Ensure .next directory exists and create trace file if needed
const nextDir = path.join(process.cwd(), '.next')
const traceFile = path.join(nextDir, 'trace')

if (!fs.existsSync(nextDir)) {
  fs.mkdirSync(nextDir, { recursive: true })
}

// Create empty trace file to prevent the error
if (!fs.existsSync(traceFile)) {
  fs.writeFileSync(traceFile, '')
}

const app = next({
  dev,
  hostname,
  port,
  conf: {
    experimental: {
      instrumentationHook: false
    },
    // Additional config to disable tracing
    tracing: {
      instrumentationHook: false
    }
  }
})

const handle = app.getRequestHandler()

console.log(`Starting Next.js app on ${hostname}:${port}...`)

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error('Server error:', err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
}).catch((err) => {
  console.error('Failed to start Next.js app:', err)
  process.exit(1)
})