/**
 * Lightweight reactions relay server
 *
 * Usage:
 *   1. Install dependencies (from project root):
 *        npm install express ws cors
 *   2. Start the server:
 *        node obs-reactions/server/reactions-server.js
 *
 * The server exposes a WebSocket endpoint that the OBS overlay and the
 * viewer reaction panel connect to. When a viewer sends a reaction, the
 * server broadcasts it to all connected overlay clients in real time.
 */

const express = require('express')
const http = require('http')
const cors = require('cors')
const WebSocket = require('ws')

const PORT = process.env.PORT || 4000

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

/**
 * Simple in‑memory store of recent reactions so newly connected overlays
 * can render something immediately. We trim it continuously to prevent
 * unbounded growth.
 */
const recentReactions = []
const MAX_RECENT_REACTIONS = 50

/**
 * Helper to broadcast payloads to every connected websocket client
 */
function broadcast(payload) {
  const message = JSON.stringify(payload)
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

wss.on('connection', (ws) => {
  console.log('🔌 Overlay/Client connected')

  // send the history to the new overlay so it can render something quickly
  ws.send(
    JSON.stringify({
      type: 'init',
      reactions: recentReactions,
    }),
  )

  ws.on('message', (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage.toString())

      if (data.type === 'reaction') {
        const reaction = {
          id: Date.now() + Math.random(),
          emoji: data.emoji,
          label: data.label || '',
          color: data.color || '#ffffff',
          createdAt: Date.now(),
          x: Math.random() * 80 + 10, // keep some margin on both sides
        }

        recentReactions.push(reaction)
        if (recentReactions.length > MAX_RECENT_REACTIONS) {
          recentReactions.splice(0, recentReactions.length - MAX_RECENT_REACTIONS)
        }

        broadcast({ type: 'newReaction', reaction })
      }
    } catch (error) {
      console.error('Failed to process WS message', error)
    }
  })

  ws.on('close', () => {
    console.log('❌ Overlay/Client disconnected')
  })
})

/**
 * Simple health endpoint
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', clients: wss.clients.size })
})

server.listen(PORT, () => {
  console.log(`⚡ Reactions server running on port ${PORT}`)
  console.log(`   WS endpoint: ws://localhost:${PORT}`)
})



