# SharePoint

Connect one or many SharePoint document libraries to Botpress. Supports both real-time webhook sync to knowledge bases and file browsing via the knowledge-connector plugin.

> **Webhook expiry:** SharePoint webhook subscriptions expire after **30 days**. The integration automatically renews them on incoming notifications before they expire.

## Knowledge-Connector

This integration is compatible with the Botpress knowledge-connector plugin. Once configured, you can browse SharePoint document libraries directly from the knowledge base UI and select files to index.

## Actions

### Add To Sync

Dynamically add new document libraries to your sync configuration without re-deploying.

**Input:**

- `documentLibraryNames` — Array of library names to add.

## Setup

### 1. Register an app in Microsoft Entra

1. Open **App registrations** in the Microsoft Entra admin center.
2. Click **New registration**, give it a name, click **Register**.
3. Note the **Application (client) ID** and **Directory (tenant) ID**.

### 2. Create a self-signed certificate

```bash
# Generate PKCS#8 private key and self-signed certificate in one step
openssl req -x509 -newkey rsa:2048 -keyout myPrivateKey.key \
  -out myCertificate.crt -days 365 -nodes \
  -subj "/CN=BotpressSharePoint"
```

The `myPrivateKey.key` file contains your private key (starts with `-----BEGIN PRIVATE KEY-----`). The `myCertificate.crt` file is what you upload to Azure AD.

### 3. Upload the certificate to your app registration

Go to **Certificates & secrets → Certificates → Upload certificate** and upload the `.crt` file.

After uploading, Azure shows the thumbprint (40 hex characters). You can also compute it locally:

```bash
openssl x509 -in myCertificate.crt -fingerprint -sha1 -noout \
  | sed 's/SHA1 Fingerprint=//' | tr -d ':'
# → e.g. A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2
```

Use this value (no colons) as the **Certificate Thumbprint** in the integration configuration.

### 4. Grant API permissions

Under **API Permissions**, add the following **Application permissions** and grant admin consent:

- **SharePoint → Sites.FullControl.All** — required to create and delete webhook subscriptions (read/write alone is insufficient for push notifications)

Click **Grant admin consent** when done.

> **Note:** This integration authenticates directly against the SharePoint REST API (not Microsoft Graph), so only SharePoint permissions are required.
