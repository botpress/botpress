const urlLength = process.env.BOTPRESS_URL ? process.env.BOTPRESS_URL.length : 0
const hostname =
  typeof process.env.BOTPRESS_URL === 'string' ? process.env.BOTPRESS_URL.substr(8, urlLength - 4) : 'localhost'

module.exports = {
  TWILIO_SID: process.env.TWILIO_SID,
  TWILIO_TOKEN: process.env.TWILIO_TOKEN,
  TWILIO_FROM: process.env.TWILIO_FROM,
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  MESSENGER_APP_ID: process.env.MESSENGER_APP_ID,
  MESSENGER_ACCESS_TOKEN: process.env.MESSENGER_ACCESS_TOKEN,
  MESSENGER_APP_SECRET: process.env.MESSENGER_APP_SECRET,
  MESSENGER_HOST: hostname,
  MICROSOFT_APP_ID: process.env.MICROSOFT_APP_ID,
  MICROSOFT_APP_PASSWORD: process.env.MICROSOFT_APP_PASSWORD,
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET,
  SLACK_HOST: hostname,
  SLACK_VERIFICATION_TOKEN: process.env.SLACK_VERIFICATION_TOKEN,
  BOTPRESS_URL: process.env.BOTPRESS_URL
}
