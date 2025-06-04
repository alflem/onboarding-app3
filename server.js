// const { createServer } = require('http')
// const { parse } = require('url')
// const next = require('next')
// const fs = require('fs')
// const path = require('path')

// const dev = process.env.NODE_ENV !== 'production'
// const hostname = '0.0.0.0'
// const port = process.env.PORT || 8080

// // Disable telemetry
// process.env.NEXT_TELEMETRY_DISABLED = '1'

// console.log('Starting Next.js app...')
// console.log('NODE_ENV:', process.env.NODE_ENV)
// console.log('Current directory:', process.cwd())

// // Check if .next directory exists, create if it doesn't
// const nextDir = path.join(process.cwd(), '.next')
// console.log('Checking .next directory:', nextDir)

// if (!fs.existsSync(nextDir)) {
//   console.log('.next directory does not exist, creating...')
//   try {
//     fs.mkdirSync(nextDir, { recursive: true })
//     console.log('.next directory created successfully')
//   } catch (error) {
//     console.error('Failed to create .next directory:', error)
//   }
// }

// // Create trace file to prevent ENOENT errors
// const traceFile = path.join(nextDir, 'trace')
// if (!fs.existsSync(traceFile)) {
//   try {
//     fs.writeFileSync(traceFile, '', 'utf8')
//     console.log('Trace file created successfully')
//   } catch (error) {
//     console.error('Failed to create trace file:', error)
//     // Don't exit - continue without trace file
//   }
// }

// const app = next({
//   dev,
//   hostname,
//   port,
//   conf: {
//     // Disable tracing completely
//     experimental: {
//       instrumentationHook: false
//     },
//     // Additional config to disable telemetry
//     telemetry: false
//   }
// })

// const handle = app.getRequestHandler()

// console.log(`Preparing Next.js app on ${hostname}:${port}...`)

// app.prepare()
//   .then(() => {
//     console.log('Next.js app prepared successfully')

//     const server = createServer(async (req, res) => {
//       try {
//         const parsedUrl = parse(req.url, true)
//         await handle(req, res, parsedUrl)
//       } catch (err) {
//         console.error('Error occurred handling', req.url, err)
//         res.statusCode = 500
//         res.end('internal server error')
//       }
//     })

//     server.once('error', (err) => {
//       console.error('Server error:', err)
//       process.exit(1)
//     })

//     server.listen(port, hostname, () => {
//       console.log(`> Ready on http://${hostname}:${port}`)
//     })
//   })
//   .catch((err) => {
//     console.error('Failed to start Next.js app:', err)
//     process.exit(1)
//   })