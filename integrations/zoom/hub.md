# Zoom Transcript Integration

Easily receive and automate Zoom meeting transcripts in Botpress for meetings hosted by specific Zoom users.

## How It Works

1. **Zoom meeting ends** → Zoom sends a webhook when transcript is ready.
2. **Integration filters `host_id`** → Only allows events from specified Zoom user(s).
3. **Transcript is fetched and cleaned** → Downloaded from Zoom and converted to plain text.
4. **Event emitted** → A `transcriptReceived` event with `meetingUUID` and `transcript` is available to your flows.

---

## Usage

- **Trigger workflows** → Add a "Listen to Event" card for `transcriptReceived`.
- **Access data** → Use `event.payload.meetingUUID` and `event.payload.transcript` in flows.
- **Store transcripts** → Save to tables for later analysis or reporting.

---

## Prerequisites

You must be:

- A Zoom **account owner**, **admin**, or have the **“Zoom for Developers” role** to be able to create the Zoom OAuth App
- On a **Zoom premium plan** (free tier doesn't support cloud recordings)

---

## Step-by-Step Setup

### 1. Create a Zoom OAuth App

- Visit: [https://marketplace.zoom.us/](https://marketplace.zoom.us/)
- Go to **Develop > Build App** → Choose **Server-to-Server OAuth** → Name your app
- On the **App Credentials** page, copy:
  - **Account ID**
  - **Client ID**
  - **Client Secret**

You’ll use these in your Botpress integration configuration later.

- In **Information**, fill out the necessary information about yourself and the app.
- In **Features**, copy the **Secret Token**
- In **Scopes**, add:
  cloud_recording:read:list_user_recordings:admin
  cloud_recording:read:list_recording_files:admin
  cloud_recording:read:recording:admin

- Activate the app under the **Activation** tab

### 2. Get Zoom `host_id`

You can find your Zoom `host_id` directly from the Zoom web portal.

#### Steps:

1. Log in to your Zoom account and navigate to:  
   **Zoom Admin Panel > User Management > Users**

2. Click on the name of the user you want to get the `host_id` for.

3. Look at the URL in your browser's address bar. It will be in this format:
   https://yourdomain.zoom.us/user/xxxxxxxxxxxxx/profile you want to copy the xxxxxxxxxxxxx as that is your host_id

---

### 3. Configure the Botpress Integration

- Install this integration into your Bot
- Paste:
- `Zoom Client ID`
- `Zoom Client Secret`
- `Zoom Account ID`
- `Secret Token`
- `Allowed Zoom User IDs` → Paste your `host_id` (you can include multiple)

Click **Save Configuration**.

---

### 4. Set Webhook in Zoom

Back in your Zoom OAuth App:

- Go to **Features** → Enable **Event Subscriptions**
- Name: `Transcript Received` (Can choose a different name as well)
- Method: `Webhook`
- Endpoint URL: use the **Botpress integration URL**
- Add Event:
  - Under **Recording**, select **only**:
    - `Recording transcript files have completed` (`recording.transcript_completed`)
- Click **Done**
- Click **Validate** next to the endpoint URL (you should see Validated)
- Click **Save**

---

## Done!

Your Botpress bot will now receive transcripts for allowed Zoom users when cloud recordings complete. Make sure:

- You **record to the cloud**
- You’re on a **paid Zoom plan**
- You’ve correctly added all intended `host_id`s
