export const bpConfig = {
  email: 'admin',
  password: '123456',
  botId: 'test-bot',
  host: 'http://localhost:3000',
  licenseKey: process.env.BP_LICENSE_KEY, // add license key to env variables
  apiHost: 'http://localhost:3000', // When testing the Admin UI on port 3001, set this to the correct port
  recreateBot: true // When testing something specific, set to false to keep the existing bot
}
