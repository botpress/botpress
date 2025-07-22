# Project Structure

## Root Level
- `integration.definition.ts` - Main integration definition and metadata
- `package.json` - Dependencies and build scripts
- `tsconfig.json` - TypeScript configuration
- `hub.md` - Integration documentation for Botpress Hub
- `icon.svg` - Integration icon
- `extract.vrl` - VRL script for identifier extraction
- `linkTemplate.vrl` - VRL script for link templating

## Core Directories

### `/definitions/` - Schema Definitions
- `actions.ts` - Action schemas and metadata
- `channels.ts` - Channel and message type definitions
- `configuration.ts` - Integration configuration schemas
- `events.ts` - Event type definitions
- `states.ts` - State management schemas
- `secrets.ts` - Secret configuration
- `user-tags.ts` - User tagging definitions
- `index.ts` - Exports all definitions

### `/src/` - Implementation Code
- `index.ts` - Main integration entry point
- `setup.ts` - Registration and unregistration logic

#### `/src/actions/` - Bot Actions
- `check-inbox.ts` - List and filter inbox emails
- `get-email.ts` - Retrieve specific email content
- `get-my-email.ts` - Get user's email address
- `send-email.ts` - Send email functionality
- `index.ts` - Export all actions
- `action-wrapper.ts` - Common action utilities

#### `/src/channels/` - Communication Channels
- `channels.ts` - Channel implementation
- `channel-wrapper.ts` - Channel utilities
- `index.ts` - Export channels

#### `/src/google-api/` - Google API Integration
- `google-client.ts` - Gmail API client
- `jwt-validation.ts` - JWT token validation
- `error-handling.ts` - API error handling
- `types.d.ts` - Type definitions
- `index.ts` - API exports

#### `/src/webhook-events/` - Event Handling
- `handler.ts` - Main webhook event handler
- `new-mail.ts` - New email event processing
- `oauth-callback.ts` - OAuth callback handling
- `index.ts` - Export event handlers

#### `/src/utils/` - Utilities
- `datetime-utils.ts` - Date/time helper functions
- `mail-composing.tsx` - Email composition with React
- `string-utils.ts` - String manipulation utilities

#### `/src/config/` - Configuration
- `integration-config.ts` - Integration configuration management

### `/.botpress/` - Generated Code
- Auto-generated TypeScript definitions and implementations
- Should not be manually edited

## Architecture Patterns

### Action Pattern
Actions follow a consistent structure:
- Input/output schema validation using Zod
- Wrapper functions for common functionality
- Error handling and logging
- Google API integration

### Channel Pattern
Channels extend Botpress SDK message types with Gmail-specific features:
- Support for rich message types (markdown, images, files)
- Email thread conversation mapping
- Message and conversation tagging

### Event Handling
Webhook events use a handler pattern:
- Centralized event routing
- JWT validation for security
- Pub/Sub integration for real-time updates

### Configuration Management
Two-tier configuration system:
- Base configuration (empty schema)
- Custom app configuration for manual OAuth setup