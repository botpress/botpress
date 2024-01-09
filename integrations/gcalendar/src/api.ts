// Import necessary libraries and dependencies
import { google } from 'googleapis'
import { oauth2Client } from './oauth'

// Initialize the Google Calendar API client
const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

// Function to create a calendar event
async function createEvent(eventData: any) {
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: eventData,
  })
  return response.data
}

// Function to list calendar events
async function listEvents() {
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  })
  return response.data.items
}

// Export the functions for use in other files
export { createEvent, listEvents }
