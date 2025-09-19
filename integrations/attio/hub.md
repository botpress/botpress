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

### Required API Scopes

The integration requires the following Attio API scopes to function properly:

- **`object_configuration:read`** - Enables listing objects (`GET /v2/objects`) and retrieving object details (`GET /v2/objects/{object}`)
- **`record:read`** - Enables querying records (`POST /v2/objects/{object}/records/query`) and retrieving individual records (`GET /v2/objects/{object}/records/{record_id}`)
- **`record:write`** - Enables creating new records (`POST /v2/objects/{object}/records`) and updating existing records (`PUT /v2/objects/{object}/records/{record_id}`)

**Note:** The integration also fetches object attributes (`GET /v2/objects/{object}/attributes`) to provide human-readable responses, which is covered by the `object_configuration:read` scope.

## Actions

The integration currently supports the following actions:

- List Objects: Retrieve the list of objects in your workspace.
- Get Object: Retrieve a single object definition by slug or ID.
- List Attributes: List attributes for an object.
- List Records: Query records for an object (filter/sort/limit/offset).
- Get Record: Retrieve a single record by ID.
- Create Record: Create a new record with attribute values.
- Update Record: Update an existing record with attribute values.

## Notes

- Filtering syntax for `List Records` follows Attio’s filtering guide. Pass your filter object as provided by Attio — the integration forwards it to Attio’s `/v2/objects/{object}/records/query` endpoint.
- For create/update, provide `values` using attribute slugs or IDs accepted by Attio. The API response will be normalized as described above.
