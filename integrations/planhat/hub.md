# Planhat

Integrate your Botpress bot with Planhat to manage customer success data, track user engagement, and automate customer workflows.

> This integration allows your bot to interact with Planhat's customer success platform.

## Configuration

To configure this integration, you will need:

- A Planhat account
- A Planhat API Access Token

### Obtaining your API Access Token

API Access Tokens are generated using Private Apps under the Settings section in Planhat:

1. Log in to your Planhat account
2. Navigate to **Settings** > **Private Apps**
3. Create a new Private App or use an existing one
4. Generate an API Access Token
5. **Important:** Copy and store the token securely - it will only be displayed once and will last forever

**Note:**
- Operations performed with this token will appear as Private App actions in Planhat
- You can limit the access scope by configuring permissions on the Private App level
- To disable a token, disable the Private App, pause it, or remove the API Access Token (which permanently invalidates it)

## Usage

This integration provides actions to manage assets in Planhat:

### Asset Management Actions

- **Create Asset** - Create a single asset with name, company reference, and optional custom fields
- **Update Asset** - Update an existing asset by ID, externalId, or sourceId
- **Get Asset** - Retrieve a single asset by ID, externalId, or sourceId
- **List Assets** - Query assets with filtering, sorting, pagination, and field selection
- **Delete Asset** - Delete an asset by ID
- **Bulk Upsert Assets** - Create and/or update up to 5,000 assets in a single request

All actions support Planhat's flexible ID referencing using `extid-` and `srcid-` prefixes.

## Limitations

> Known limitations and rate limits will be documented as the integration is developed.

## Changelog

### 0.1.1

- Added API Token configuration for authentication
- Implemented complete asset management:
  - `createAsset` - Create single asset
  - `updateAsset` - Update single asset
  - `getAsset` - Retrieve single asset
  - `listAssets` - Query assets with filtering and pagination
  - `deleteAsset` - Delete asset
  - `bulkUpsertAssets` - Bulk create/update up to 5,000 assets
- Refactored code structure with modular actions folder
- Added support for flexible ID referencing (extid-, srcid- prefixes)

### 0.1.0

- Initial scaffolding

### Integration publication checklist

- [ ] The register handler is implemented and validates the configuration.
- [ ] Title and descriptions for all schemas are present in `integration.definition.ts`.
- [ ] Events store `conversationId`, `userId` and `messageId` when available.
- [ ] Implement events & actions that are related to `channels`, `entities`, `user`, `conversations` and `messages`.
- [ ] Events related to messages are implemented as messages.
- [ ] When an action is required by the bot developer, a `RuntimeError` is thrown with instructions to fix the problem.
- [ ] Bot name and bot avatar URL fields are available in the integration configuration.
