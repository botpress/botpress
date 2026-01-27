# Botpress Integration: GoHighLevel

## **GoHighLevel OAuth Integration Guide**

For further details, refer to the [**GoHighLevel API documentation**](https://highlevel.stoplight.io/docs/integrations/0443d7d1a4bd0-overview).

### **[Loom video walk through setting up the OAuth configuration.](https://www.loom.com/share/0b7aad49278d4411993c2e88e05405f8?sid=4bbd0c57-b64f-49e6-b6a4-1ab12a05af21)**

## **Step 1: Create a Developer App**

1. Go to the [GoHighLevel Marketplace](https://marketplace.gohighlevel.com/).
2. Sign up for a **developer account** (if you haven’t already).
3. Navigate to **"My Apps"**, then click on **"Create App."**
4. Fill in the required details in the form and submit it. Your app will be created.
5. Click on your newly created app to access its settings.
6. Configure the required **redirect URI**, **OAuth scopes** and generate API keys.

### **Required OAuth Scopes (If using every card)**

```contacts.readonly
contacts.write
conversations.readonly
users.write
opportunities.readonly
opportunities.write
payments/orders.readonly
payments/orders.write
calendars.readonly
calendars.write
calendars/events.readonly
calendars/events.write
companies.readonly
businesses.readonly
businesses.write
```

## **Step 2: Generate the Authorization URL**

Use the appropriate **authorization URL** based on whether you are using the standard GoHighLevel or a white-label instance.

### **Standard (Non-White Label) URL**

```
https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=BOTPRESS_WEBHOOK/oauth&client_id=CLIENT_ID&scope=contacts.readonly contacts.write conversations.readonly users.write opportunities.readonly opportunities.write payments/orders.readonly payments/orders.write calendars.readonly calendars.write calendars/events.readonly calendars/events.write companies.readonly businesses.readonly businesses.write
```

### **White Label URL**

```
https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=BOTPRESS_WEBHOOK/oauth&client_id=CLIENT_ID&scope=contacts.readonly contacts.write conversations.readonly users.write opportunities.readonly opportunities.write payments/orders.readonly payments/orders.write calendars.readonly calendars.write calendars/events.readonly calendars/events.write companies.readonly businesses.readonly businesses.write
```

## **Step 3: Obtain the Authorization Code**

When a user grants access, their browser will be **redirected to the specified redirect URI** with an **authorization code** as a query parameter.

Example:

https://myapp.com/oauth/callback/gohighlevel?code=7676cjcbdc6t76cdcbkjcd09821jknnkj

**Copy the authorization code** from the URL.

## **Step 4: Exchange the Code for an Access Token**

1. Go to [GoHighLevel API Token Exchange](https://highlevel.stoplight.io/docs/integrations/00d0c0ecaa369-get-access-token).
2. Enter the following details:
   - **Client ID**
   - **Client Secret**
   - **Authorization Code** (from Step 3\)
3. Submit the request.

## **Step 5: Save the Access and Refresh Tokens**

Once you successfully exchange the authorization code, you will receive a response containing:

{  
 "access_token": "your_access_token_here",  
 "refresh_token": "your_refresh_token_here",  
}

- **Save the `access_token` and `refresh_token`.**
- Enter these credentials into **Botpress and your client id and secret id** for authentication.

## Overview

This Botpress integration allows seamless interaction with the **GoHighLevel** CRM. It enables users to manage contacts, opportunities, appointments, and orders directly through their chatbot.

## Features

- **Contacts Management:** Create, retrieve, update, delete, and upsert contacts.
- **Opportunities Management:** Create, update, delete, and retrieve opportunities.
- **Appointments & Calendar Events:** Create, update, retrieve, and delete events.
- **Orders Management:** List orders and retrieve orders by ID.
- **General API Call:** Execute custom API requests to GoHighLevel.

---

## API Functions & Usage

Below are the available actions in this integration:

### 1️⃣ **Contacts Management**

#### **Create Contact**

- **Description:** Creates a new contact.
- **Method:** `POST /contacts/`
- **Input:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "locationId": "qWRoUZ6kNRf4Mx3RRtgs"
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "message": "Contact created successfully",
    "data": "{contact details}"
  }
  ```

#### **Get Contact**

- **Description:** Retrieves a contact by ID.
- **Method:** `GET /contacts/{contactId}`
- **Input:**
  ```json
    contactId: 123456
  ```
- **Output:** Same as above.

#### **Update Contact**

- **Description:** Updates an existing contact.
- **Method:** `PUT /contacts/{contactId}`
- **Input:**
  ```json
    contactId: 12345

  {
    "firstName": "NewFirstName"
  }
  ```
- **Output:** Same as above.

#### **Delete Contact**

- **Description:** Deletes a contact by ID.
- **Method:** `DELETE /contacts/{contactId}`
- **Input:**
  ```json
    contactId: 123456
  ```
- **Output:**
  ```json
  {
    "success": true,
    "message": "Contact deleted successfully"
  }
  ```

#### **Upsert Contact**

- **Description:** Creates or updates a contact based on existing data.
- **Method:** `POST /contacts/upsert`
- **Input:** Same as `Create Contact`.
- **Output:** Same as `Create Contact`.

#### **Get Contacts by Business ID**

- **Description:** Retrieves contacts for a specific business ID.
- **Method:** `GET /contacts/business/{businessId}`
- **Input:**
  ```json
    businessId: 123456
  ```
- **Output:**
  ```json
  {
    "success": true,
    "message": "Contacts retrieved successfully",
    "data": "{list of contacts}"
  }
  ```

---

### 2️⃣ **Opportunities Management**

#### **Create Opportunity**

- **Description:** Creates a new opportunity.
- **Method:** `POST /opportunities/`
- **Input:**
  ```json
  {
    "pipelineId": "J0VnRDNAXHjlq2GbcnEm",
    "locationId": "qWRoUZ6kNRf4Mx3RRtgs",
    "name": "New Opp",
    "pipelineStageId": "a1ecd775-b7eb-4352-8a07-c2298dca1e7b",
    "status": "open",
    "contactId": "eKJzJtRYlFlcjqiUArC7"
  }
  ```
- **Output:** Same as `Create Contact`.

#### **Get Opportunity**

- **Description:** Retrieves an opportunity by ID.
- **Method:** `GET /opportunities/{opportunityId}`
- **Input:**
  ```json
    opportunityId: 123456
  ```
- **Output:** Same as above.

#### **Update Opportunity**

- **Description:** Updates an opportunity.
- **Method:** `PUT /opportunities/{opportunityId}`
- **Input:** Same as `Update Contact`.
- **Output:** Same as `Update Contact`.

#### **Update Opportunity Status**

- **Description:** Updates an opportunity.
- **Method:** `PUT /opportunities/{opportunityId}`
- **Input:** Same as `Update Contact`.
- **Output:** Same as `Update Contact`.

#### **Delete Opportunity**

- **Description:** Deletes an opportunity by ID.
- **Method:** `DELETE /opportunities/{opportunityId}`
- **Input:**
  ```json
    opportunityId: 123456
  ```
- **Output:** Same as `Delete Contact`.

#### **Upsert Opportunity**

- **Description:** Creates or updates an opportunity.
- **Method:** `POST /opportunities/upsert`
- **Input:** Same as `Create Opportunity`.
- **Output:** Same as `Create Opportunity`.

---

### 3️⃣ **Orders Management**

#### **List Orders**

- **Description:** Retrieves a list of orders.
- **Method:** `GET /payments/orders`
- **Input:**
  ```json
  {
    "altId": "string",
    "altType": "string"
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "message": "Orders retrieved successfully",
    "data": "{list of orders}"
  }
  ```

#### **Get Order By ID**

- **Description:** Retrieves an order by ID.
- **Method:** `GET /payments/orders/{orderId}`
- **Input:**
  ```json
    orderId: 123
    altId: 123
    altType: abc
  ```
- **Output:** Same as above.

---

### 4️⃣ **Appointments & Calendar Events**

#### **Create Appointment**

- **Description:** Creates an Appointment.
- **Method:** `POST /calendars/events/appointments`
- **Input:**
  ```json
  {
    "calendarId": "5Bv4N9KLGetAIdfZCyGo",
    "locationId": "qWRoUZ6kNRf4Mx3RRtgs",
    "contactId": "655SZAMnQw45ImQenL3b",
    "startTime": "2025-07-23T03:30:00+05:30"
  }
  ```
- **Output:** Same as above.

#### **Get Appointment**

- **Description:** Gets an Appointment.
- **Method:** `GET /calendars/events/appointments/{appointmentId}`
- **Input:**
  ```json
    appointmentId: 123456
  ```
- **Output:** Same as above.

#### **Get Calendar Events**

- **Description:** Gets all Appointments for a calendar.
- **Method:** `GET /calendars/events`
- **Input:**
  ```json
  {
    "calendarId": "5Bv4N9KLGetAIdfZCyGo",
    "locationId": "qWRoUZ6kNRf4Mx3RRtgs",
    "startTime": "2025-07-22T15:00:00-07:00",
    "endTime": "2025-07-22T16:00:00-07:00"
  }
  ```
- **Output:** Same as above.

#### **Update Appointment**

- **Description:** Updates an Appointment.
- **Method:** `PUT /calendars/events/appointments/{appointmentId}`
- **Input:**
  ```json
  {
    "startTime": "2025-11-22T15:00:00-07:00",
    "title": "Updated event"
  }
  ```
- **Output:** Same as above.

#### **Delete Event**

- **Description:** Deletes an Appointment.
- **Method:** `DELETE /calendars/events/{eventId}`
- **Input:**
  ```json
    appointmentId: 123456
  ```
- **Output:** Same as above.

---

### 5️⃣ **General API Call**

- **Method:** Dynamic
- **Input:**
  ```json
  {
    "endpoint": "string",
    "method": "GET | POST | PUT | DELETE",
    "data": "Optional JSON object",
    "params": "Optional params"
  }
  ```
- **Output:** Dynamic based on response.

---

## Notes

- API responses are standardized to include `success`, `message`, and `data`.

For further details, refer to the [**GoHighLevel API documentation**](https://highlevel.stoplight.io/docs/integrations/0443d7d1a4bd0-overview).

---

**🔗 Developed for seamless CRM automation in Botpress.** 🚀
