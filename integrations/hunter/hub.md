# Hunter Integration

## Overview

Connect your Botpress chatbot to [Hunter.io](https://hunter.io/), a leading platform for finding and managing professional email leads.

This integration allows your bot to interact with Hunter’s API to manage your lead database efficiently.

## Key Features

- Manage your leads directly from your bot
- Retrieve or update existing lead information
- Add new leads to your Hunter account

## Use Cases

- **Lead Management** – Centralize lead creation and updates directly from your chatbot
- **CRM Automation** – Automatically push new user information to Hunter
- **Sales Operations** – Keep your Hunter database clean and up to date

# Configuration

You need a **Hunter API key** to authenticate the integration.

1.  Go to your [Hunter dashboard](https://hunter.io/dashboard).
2.  Navigate to **API** → copy your **API key**.
3.  In Botpress, open the Hunter integration settings and paste your API key.

Once saved, your bot will be able to perform operations via Hunter’s API.

## Limitations

- Only lead management endpoints are currently supported
- Email verification, campaign management, and domain search are not yet implemented
- Standard [Hunter API rate limits](https://hunter.io/api-documentation/v2) apply

# Changelog

- **1.0.0** – Initial release with lead management (list, retrieve, create, update, create/update, delete)
