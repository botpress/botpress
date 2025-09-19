# Botpress Integration: Attio CRM

## Overview

The Attio integration connects your Botpress bot to Attio’s workspace data so you can list, retrieve, create, and update records across your objects directly from their chatbot.

## Configuration

To protect your workspace, this integration uses an API token you provide. Create a token in Attio and paste it in your integration configuration.

### Steps

1. In Attio, create an API token with the following scopes:
   - `object_configuration:read` - Required to list and retrieve object definitions
   - `record:read` - Required to list and retrieve records
   - `record:write` - Required to create and update records
2. In Botpress, add the Attio integration to your bot.
3. Paste your API token in the integration configuration and save.

That's it — the integration will validate access using Attio's `/v2/self` endpoint.

## Actions

The integration currently supports the following actions:

- **listObjects**: Retrieve the list of objects in your workspace.
- **getObject**: Retrieve a single object definition by slug or ID.
- **listAttributes**: List attributes for an object.
- **listRecords**: Query records for an object (filter/sort/limit/offset).
- **getRecord**: Retrieve a single record by ID.
- **createRecord**: Create a new record with attribute values.
- **updateRecord**: Update an existing record with attribute values.

## Notes

- Filtering syntax for `List Records` follows Attio’s filtering guide. Pass your filter object as provided by Attio —
- For create/update, provide `values` using attribute slugs or IDs accepted by Attio.
