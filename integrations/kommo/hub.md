# Kommo Integration

The Kommo integration allows you to connect your Botpress chatbot with Kommo. With this integration, your chatbot can create and update leads, manage contacts, and search through your CRM data.

## Prerequisites

Before using this integration, you need:

1. A **Kommo account** with administrator access
2. A **private integration** created in your Kommo account
3. A **long-lived access token** from your private integration

## Configuration

To set up the Kommo integration in Botpress:

### Step 1: Create a Private Integration in Kommo

1. Log in to your Kommo account
2. Navigate to **Settings** → **Integrations** → **Private Integrations**
3. Click **Create Integration**
4. Give your integration a name (e.g., "Botpress Chatbot")
5. Set the required scopes:
6. Save the integration

### Step 2: Generate an Access Token

1. In your private integration settings, click **Generate Token**
2. Select the appropriate scopes
3. Copy the **long-lived access token** - you'll need this for Botpress

### Step 3: Configure Botpress Integration

In your Botpress integration settings, provide:

- **Base Domain**: Your Kommo subdomain (e.g., `yourcompany.kommo.com`)
  - Do not include `https://` or trailing slashes
  - Example: `mycompany.kommo.com`
- **Access Token**: Paste the long-lived access token from Step 2

## Available Actions

### Create Lead

Create a new lead in your Kommo CRM. Leads represent potential sales opportunities and can be tracked through your sales pipeline.

**Required Fields:**

- **Name**: Lead name or title (e.g., "Website Inquiry - John Doe")

**Optional Fields:**

- **Price**: Lead value in dollars (e.g., 5000)
- **Responsible User ID**: Kommo user ID to assign this lead to
- **Pipeline ID**: Which sales pipeline to add this lead to (defaults to main pipeline)
- **Status ID**: Initial status/stage in the pipeline (e.g., "New Lead", "Contacted")

**Output:** Returns the created lead with:

- Lead ID
- Name
- Price
- Responsible User ID
- Pipeline ID
- Status ID
- Created and Updated timestamps

**Example Use Cases:**

- Capture leads from chatbot conversations
- Create sales opportunities from customer inquiries
- Track chatbot-generated leads in your CRM

---

### Update Lead

Update an existing lead in Kommo. This action allows you to modify lead information as the conversation progresses or circumstances change.

**Required Fields:**

- **Lead ID**: The unique identifier of the lead to update

**Optional Fields:**

- **Name**: New lead name
- **Price**: Updated lead value
- **Responsible User ID**: Reassign to a different user
- **Pipeline ID**: Move to a different pipeline
- **Status ID**: Update the lead's stage (e.g., move from "Contacted" to "Qualified")

**Output:** Returns the updated lead with all current information.

**Example Use Cases:**

- Update lead value based on customer responses
- Move leads through your sales pipeline automatically
- Reassign leads to different team members
- Update lead information as you gather more details

---

### Search Leads

Search for leads in your Kommo CRM using keywords. This action searches through lead names, prices, and other filled fields to find matching records.

**Required Fields:**

- **Query**: Search term (searches through lead names, prices, and other fields)

**Output:** Returns an array of matching leads. Each lead includes:

- Lead ID, Name, Price
- Responsible User ID
- Pipeline and Status IDs
- Created and Updated timestamps

**Example Use Cases:**

- Look up existing leads by name before creating duplicates
- Find leads by company name or keywords
- Check if a lead already exists in your CRM
- Search for leads by partial matches

---

### Create Contact

Create a new contact in your Kommo CRM. Contacts represent individual people or entities in your CRM database.

**Required Fields:**

- **Responsible User ID**: Kommo user ID to assign this contact to
- **Created By**: Kommo user ID of the person creating this contact

**Optional Fields:**

- **Name**: Full contact name
- **First Name**: Contact's first name
- **Last Name**: Contact's last name
- **Updated By**: Kommo user ID of the person updating this contact

**Output:** Returns the created contact with:

- Contact ID
- Name, First Name, Last Name
- Responsible User ID
- Group ID, Account ID
- Created and Updated timestamps
- Deletion status

**Example Use Cases:**

- Add new contacts from chatbot conversations
- Create CRM entries for new customers
- Store contact information collected during chat

---

### Search Contacts

Search for contacts in your Kommo CRM by name, phone number, or email address. This action helps you find existing contacts before creating duplicates.

**Required Fields:**

- **Query**: Search term (can be name, phone number, or email)

**Output:** Returns an array of matching contacts. Each contact includes:

- Contact ID
- Name, First Name, Last Name
- Responsible User ID
- Group ID, Account ID
- Created and Updated timestamps
- Deletion status

If no contacts are found, returns an empty array.

**Example Use Cases:**

- Look up contacts by email before creating new ones
- Find contacts by phone number
- Search for contacts by name
- Verify if a contact exists in your CRM

## Common Workflows

### Lead Qualification Flow

1. **Search Contacts** to check if the person exists
2. If not found, **Create Contact** with their information
3. **Create Lead** for the sales opportunity
4. As the conversation progresses, **Update Lead** with new information
5. **Search Leads** to find related opportunities

### Customer Inquiry Handling

1. **Search Contacts** by email or phone
2. If found, **Create Lead** and link to existing contact
3. **Update Lead** status as you qualify the opportunity
4. Assign lead to appropriate team member via **Update Lead**

## Important Notes

- **User IDs**: Responsible User IDs and Created By fields must be valid Kommo user IDs from your account
- **Pipeline and Status IDs**: These are specific to your Kommo account setup. Check your Kommo settings for valid IDs
- **Search**: Search queries are flexible and search across multiple fields
- **Phone Numbers**: When searching contacts by phone, use the same format stored in Kommo
- **Lead Values**: Price fields are in dollars (or your account's default currency)

## Limitations

- **Rate Limiting**: Kommo API has rate limits. Excessive requests may be throttled
- **Field Validation**: Some fields (like User IDs, Pipeline IDs) must exist in your Kommo account
- **Search Scope**: Searches are limited to fields populated in your CRM
- **Permissions**: The access token must have appropriate scopes (`crm`, `notifications`)
