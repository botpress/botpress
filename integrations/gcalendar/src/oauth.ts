import { OAuth2Client } from 'google-auth-library'

const CLIENT_ID = 'YOUR_CLIENT_ID'
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET'
const REDIRECT_URI = 'YOUR_REDIRECT_URI'

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

function getAuthUrl() {
  const scopes = ['https://www.googleapis.com/auth/calendar']
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  })
}

async function handleCallback(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  oauth2Client.setCredentials(tokens)
  // TODO: Store the tokens for future use (e.g., in a database)
}

export { getAuthUrl, handleCallback, oauth2Client }
