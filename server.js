const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = process.env.PORT || 3000

// Disable tracing to avoid trace file issues
process.env.NEXT_TELEMETRY_DISABLED = '1'

const app = next({
  dev,
  hostname,
  port,
  conf: {
    // Disable tracing
    experimental: {
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