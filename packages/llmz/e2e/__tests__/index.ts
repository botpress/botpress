import fs from 'node:fs'
import path from 'node:path'

import { CachedCognitive } from './cached-cognitive.js'

export { TEST_MODELS } from './cached-cognitive.js'

/** Base64 data URI for a fixture file in this directory. */
export function getFixtureDataUri(filename: string, mimeType: string) {
  const buffer = fs.readFileSync(path.resolve(__dirname, filename))
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

/**
 * A short spoken voice message (macOS TTS), base64-encoded as a data URI.
 * The speaker says: "Hey! Please say the word pineapple, and also tell me
 * what the capital of France is."
 */
export function getVoiceMessageDataUri() {
  return getFixtureDataUri('./voice-message.wav', 'audio/wav')
}

/**
 * Fixtures for the screen-share scenario: three checkout screenshots
 * (purchase page, payment form, payment-failed error page) and the user's
 * spoken narration. The speaker says: "Hey, so I was trying to buy the
 * premium plan. I clicked buy now, I filled in my card and a little note,
 * and then I landed on this error page you can see on my screen. Can you
 * tell me exactly what went wrong, and was I charged anything?"
 *
 * The error details (ERR-PAY-042, insufficient funds, no charge made) appear
 * ONLY in screenshot C — reading the image is the only way to answer.
 */
export function getScreenShareFixtures() {
  return {
    screenshotA: getFixtureDataUri('./screenshot-a.png', 'image/png'),
    screenshotB: getFixtureDataUri('./screenshot-b.png', 'image/png'),
    screenshotC: getFixtureDataUri('./screenshot-c.png', 'image/png'),
    voice: getFixtureDataUri('./voice-screenshare.wav', 'audio/wav'),
  }
}

export const getCachedCognitiveClient = () => {
  return new CachedCognitive({
    apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.cloud',
    botId: process.env.CLOUD_BOT_ID,
    token: process.env.CLOUD_PAT,
    timeout: 60_000,
  })
}
