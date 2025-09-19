# Gatewayz

<<<<<<< Current (Your changes)
Connect your bot to Gatewayz.
=======
Connect your bot to the Gatewayz AI Gateway API for seamless access to AI models with integrated credit management.

## Overview

Gatewayz is an AI Gateway API that provides access to AI models from OpenRouter with built-in credit management, user authentication, and usage monitoring. This integration allows your Botpress bots to:

- Generate AI chat completions using various models
- Manage user accounts and API keys
- Monitor credit balances and usage
- Access available AI models and provider statistics

## Configuration

To use this integration, you need:

1. **API Key**: Your Gatewayz API key for authentication
2. **Base URL**: The Gatewayz API base URL (defaults to https://gatewayz-app.vercel.app)

## Available Actions

### Core AI Functions
- **Chat Completions**: Generate AI responses using available models (compatible with OpenAI format)
- **Get Models**: Retrieve list of available AI models from OpenRouter
- **Get Providers**: Get provider statistics for available models

### User Management
- **Get User Balance**: Check current credit balance
- **Get User Profile**: Retrieve user profile information
- **Update User Profile**: Update user profile details
- **Register User**: Register new users in the system

### API Key Management
- **Create API Key**: Generate new API keys with custom permissions
- **Get API Key Usage**: View usage statistics for all API keys

### System
- **Health Check**: Verify API service status

## Usage Example

```typescript
// Generate AI chat completion
const response = await ctx.actions.chatCompletions({
  model: "gpt-3.5-turbo",
  messages: [
    { role: "user", content: "Hello, how are you?" }
  ],
  temperature: 0.7,
  max_tokens: 150
})

// Check available models
const models = await ctx.actions.getModels({})

// Monitor user balance
const balance = await ctx.actions.getUserBalance({})
```

## Authentication

Most endpoints require Bearer token authentication using your Gatewayz API key. The integration automatically handles authentication headers for secured endpoints.

## API Reference

For detailed API documentation, visit: https://gatewayz-app.vercel.app/docs
>>>>>>> Incoming (Background Agent changes)

