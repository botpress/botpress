// Import necessary libraries and dependencies
import { OAuth2Client } from 'google-auth-library';

// Define the OAuth2Client configuration
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'YOUR_REDIRECT_URI';

// Initialize the OAuth2Client with the configuration
let oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Function to generate the authentication URL
function getAuthUrl() {
    const scopes = [
        'https://www.googleapis.com/auth/calendar'
    ];
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });
}

// Function to handle the callback from Google's OAuth server
async function handleCallback(code) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Store the tokens for future use (e.g., in a database)
}

// Export the necessary functions and oauth2Client for use in other files
export { getAuthUrl, handleCallback, oauth2Client };
