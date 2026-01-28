# Amazon Connect Integration Implementation Plan

## Overview

This plan outlines the implementation of an Amazon Connect integration for Botpress, focusing on:
1. **Channel Implementation**: Enable bidirectional messaging between Botpress bots and Amazon Connect chat contacts
2. **HITL (Human-in-the-Loop) Interface**: Allow seamless handoff from bot to human agents in Amazon Connect

## Amazon Connect Architecture

Amazon Connect provides two main API services for chat integration:

### 1. Amazon Connect Service API
- **StartChatContact**: Initiates a new chat contact and contact flow
- **DescribeContact**: Gets contact details and state
- **StopContact**: Ends a contact
- **CreateParticipantConnection**: Establishes a connection for a participant

### 2. Amazon Connect Participant Service API
- **SendMessage**: Sends messages from a participant (bot/agent/customer)
- **SendEvent**: Sends events like typing indicators
- **GetTranscript**: Retrieves chat history
- **DisconnectParticipant**: Disconnects a participant from the chat

### Integration Flow
```
Customer → Webhook (API Gateway) → Lambda → StartChatContact → Contact Flow
                                            ↓
                                    CreateParticipantConnection
                                            ↓
                                    SendMessage/SendEvent
                                            ↓
                               Amazon SNS → Botpress Webhook
```

## Implementation Structure

### Phase 1: Foundation & Configuration

#### 1.1 Integration Definition (`integration.definition.ts`)

**Configuration Schema:**
```typescript
{
  awsRegion: string              // AWS region (e.g., 'us-east-1')
  instanceId: string             // Amazon Connect instance ID
  contactFlowId: string          // Contact flow ID for bot interactions
  accessKeyId: string (secret)   // AWS IAM access key
  secretAccessKey: string (secret) // AWS IAM secret key
  webhookUrl?: string            // Botpress webhook URL for receiving messages

  // HITL Configuration
  hitlContactFlowId?: string     // Contact flow ID for human handoff
  defaultQueue?: string          // Default queue for HITL routing

  // Optional
  botName?: string               // Bot display name
  botAvatarUrl?: string          // Bot avatar URL
}
```

**Secrets:**
- `accessKeyId`
- `secretAccessKey`

**User Tags:**
```typescript
{
  id: string                     // Amazon Connect participant ID
  contactId?: string             // Current contact ID
}
```

**Conversation Tags:**
```typescript
{
  id: string                     // Contact ID in Amazon Connect
  connectionToken?: string       // Participant connection token
  participantId?: string         // Participant ID
  initialContactId?: string      // Initial contact ID for HITL tracking
}
```

**Message Tags:**
```typescript
{
  id: string                     // Message ID from Amazon Connect
  timestamp: string              // Message timestamp
  type: string                   // Message type (MESSAGE, EVENT, etc.)
}
```

#### 1.2 AWS SDK Integration (`src/client.ts`)

Create a client module for Amazon Connect SDK:

```typescript
import { ConnectClient, StartChatContactCommand } from '@aws-sdk/client-connect'
import { ConnectParticipantClient, SendMessageCommand, SendEventCommand } from '@aws-sdk/client-connect-participant'

export function getConnectClient(config: IntegrationConfig): ConnectClient {
  return new ConnectClient({
    region: config.awsRegion,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

export function getParticipantClient(config: IntegrationConfig): ConnectParticipantClient {
  return new ConnectParticipantClient({
    region: config.awsRegion,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}
```

**Dependencies to Add:**
```json
{
  "@aws-sdk/client-connect": "^3.x.x",
  "@aws-sdk/client-connect-participant": "^3.x.x"
}
```

#### 1.3 Register/Unregister Handlers (`src/index.ts`)

**Register:**
- Validate AWS credentials by attempting to describe the instance
- Validate contact flow IDs exist
- Store integration state
- Set up webhook URL if using Amazon SNS/EventBridge for incoming messages

**Unregister:**
- Clean up any stored state
- Optionally disconnect active contacts

### Phase 2: Channel Implementation

#### 2.1 Channel Definition (`definitions/channels.ts`)

Define a single `channel` for Amazon Connect chat:

```typescript
export const channels = {
  channel: {
    title: 'Amazon Connect Chat',
    description: 'Sends messages to Amazon Connect chat contacts',
    messages: {
      text: { schema: z.object({ text: z.string() }) },
      image: { schema: z.object({ imageUrl: z.string() }) },
      audio: { schema: z.object({ audioUrl: z.string() }) },
      video: { schema: z.object({ videoUrl: z.string() }) },
      file: { schema: z.object({ fileUrl: z.string() }) },
      card: { schema: cardSchema },
      carousel: { schema: carouselSchema },
      dropdown: { schema: dropdownSchema },
      choice: { schema: choiceSchema },
      bloc: { schema: blocSchema },
    },
    message: {
      tags: {
        id: { title: 'Message ID', description: 'Amazon Connect message ID' },
        timestamp: { title: 'Timestamp' },
        type: { title: 'Message Type' },
      },
    },
    conversation: {
      tags: {
        id: { title: 'Contact ID', description: 'Amazon Connect contact ID' },
        connectionToken: { title: 'Connection Token' },
        participantId: { title: 'Participant ID' },
        initialContactId: { title: 'Initial Contact ID' },
      },
    },
  },
}
```

#### 2.2 Channel Message Handlers (`src/channels.ts`)

Implement message handlers for each message type:

**Text Message:**
```typescript
async text({ payload, conversation, ack, ctx, logger }) {
  const participantClient = getParticipantClient(ctx.configuration)
  const connectionToken = conversation.tags.connectionToken

  const response = await participantClient.send(
    new SendMessageCommand({
      ConnectionToken: connectionToken,
      ContentType: 'text/plain',
      Content: payload.text,
    })
  )

  await ack({
    tags: {
      id: response.Id,
      timestamp: response.AbsoluteTime,
      type: 'MESSAGE',
    },
  })
}
```

**Image/Audio/Video/File:**
- Amazon Connect supports attachments via the Attachments API
- Use `StartAttachmentUpload` to get a presigned URL
- Upload the file to S3
- Send a message with attachment reference

**Card/Carousel/Dropdown/Choice:**
- Convert to Amazon Connect Interactive Messages format
- Use JSON content type with structured data
- Map Botpress UI elements to Connect's interactive message templates

**Bloc:**
- Process items array and send multiple messages or combined interactive message

#### 2.3 Utility Functions (`src/utils.ts`)

Helper functions for:
- Starting a new contact
- Getting/refreshing connection tokens
- Converting message formats
- Error handling and retries

### Phase 3: Webhook Handler for Incoming Messages

#### 3.1 Event Handler (`src/handler.ts`)

Handle incoming webhooks from Amazon Connect via Amazon SNS or EventBridge:

```typescript
export const handler: bp.IntegrationProps['handler'] = async ({ req, client, ctx, logger }) => {
  // Parse SNS notification or EventBridge event
  const event = JSON.parse(req.body)

  // Handle different event types
  if (isSNSNotification(event)) {
    const message = JSON.parse(event.Message)

    switch (message.Type) {
      case 'MESSAGE':
        await handleIncomingMessage({ message, client, ctx, logger })
        break
      case 'EVENT':
        await handleIncomingEvent({ message, client, ctx, logger })
        break
      case 'ATTACHMENT':
        await handleIncomingAttachment({ message, client, ctx, logger })
        break
    }
  }
}
```

#### 3.2 Message Processing (`src/events/message.ts`)

Convert Amazon Connect messages to Botpress messages:

```typescript
export async function handleIncomingMessage({ message, client, ctx, logger }) {
  const contactId = message.ContactId
  const participantRole = message.ParticipantRole

  // Ignore bot's own messages and agent messages (for standard channel)
  if (participantRole === 'SYSTEM' || participantRole === 'AGENT') {
    return
  }

  // Get or create conversation
  const { conversation } = await client.getOrCreateConversation({
    channel: 'channel',
    tags: {
      id: contactId,
      connectionToken: message.ConnectionToken,
      participantId: message.ParticipantId,
    },
  })

  // Get or create user
  const { user } = await client.getOrCreateUser({
    tags: {
      id: message.ParticipantId,
      contactId: contactId,
    },
  })

  // Convert message content to Botpress format
  const messageContent = convertMessageContent(message)

  // Create message in Botpress
  await client.createMessage({
    conversationId: conversation.id,
    userId: user.id,
    type: messageContent.type,
    payload: messageContent.payload,
    tags: {
      id: message.MessageId,
      timestamp: message.AbsoluteTime,
      type: message.Type,
    },
  })
}
```

### Phase 4: HITL Implementation

#### 4.1 HITL Module Definition (`bp_modules/hitl/index.ts`)

Define the HITL interface:

```typescript
export default {
  title: 'Human in the Loop',
  description: 'Transfer conversations to human agents in Amazon Connect',
  version: '1.0.0',
  actions: {
    startHitl: {
      title: 'Start HITL',
      description: 'Transfer the conversation to a human agent',
      input: {
        schema: z.object({
          userId: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          hitlSession: z.object({
            queue: z.string().optional(),
            attributes: z.record(z.string()).optional(),
            priority: z.number().optional(),
          }).optional(),
        }),
      },
      output: {
        schema: z.object({
          conversationId: z.string(),
        }),
      },
    },
    stopHitl: {
      title: 'Stop HITL',
      description: 'End the human agent session',
      input: {
        schema: z.object({
          conversationId: z.string(),
          reason: z.string().optional(),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
}
```

#### 4.2 HITL Actions (`src/actions/hitl.ts`)

**startHitl Implementation:**

```typescript
export const startHitl: bp.IntegrationProps['actions']['startHitl'] = async ({
  ctx,
  input,
  client,
  logger,
}) => {
  const connectClient = getConnectClient(ctx.configuration)

  // Get user
  const { user } = await client.getUser({ id: input.userId })

  // Get the original conversation to transfer context
  const originalConversation = await getOriginalConversation(client, user)

  // Get chat transcript for context
  const transcript = await getChatTranscript({
    contactId: originalConversation?.tags.id,
    ctx,
  })

  // Start a new contact for HITL
  const contactFlowId = input.hitlSession?.contactFlowId || ctx.configuration.hitlContactFlowId

  const startChatResponse = await connectClient.send(
    new StartChatContactCommand({
      InstanceId: ctx.configuration.instanceId,
      ContactFlowId: contactFlowId,
      ParticipantDetails: {
        DisplayName: user.name || 'Customer',
      },
      Attributes: {
        ...input.hitlSession?.attributes,
        previousContactId: originalConversation?.tags.id,
        transferReason: input.description || 'Customer requested agent',
        botTranscript: JSON.stringify(transcript),
      },
      InitialMessage: {
        ContentType: 'text/plain',
        Content: input.title || 'Customer transferred from bot',
      },
    })
  )

  // Create participant connection for bot to monitor/send messages
  const participantResponse = await connectClient.send(
    new CreateParticipantConnectionCommand({
      Type: ['WEBSOCKET', 'CONNECTION_CREDENTIALS'],
      ParticipantToken: startChatResponse.ParticipantToken,
    })
  )

  // Create HITL conversation in Botpress
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: {
      id: startChatResponse.ContactId,
      connectionToken: participantResponse.ConnectionCredentials.ConnectionToken,
      participantId: startChatResponse.ParticipantId,
      initialContactId: originalConversation?.tags.id,
    },
  })

  // Link user to HITL conversation
  await client.getOrCreateUser({
    tags: {
      id: startChatResponse.ParticipantId,
      contactId: startChatResponse.ContactId,
    },
  })

  return {
    conversationId: conversation.id,
  }
}
```

**stopHitl Implementation:**

```typescript
export const stopHitl: bp.IntegrationProps['actions']['stopHitl'] = async ({
  ctx,
  input,
  client,
  logger,
}) => {
  const connectClient = getConnectClient(ctx.configuration)

  // Get conversation
  const { conversation } = await client.getConversation({ id: input.conversationId })
  const contactId = conversation.tags.id

  if (!contactId) {
    logger.forBot().warn('No contact ID found for HITL conversation')
    return {}
  }

  // Stop the contact
  await connectClient.send(
    new StopContactCommand({
      InstanceId: ctx.configuration.instanceId,
      ContactId: contactId,
    })
  )

  // Optionally disconnect participant
  const connectionToken = conversation.tags.connectionToken
  if (connectionToken) {
    const participantClient = getParticipantClient(ctx.configuration)
    await participantClient.send(
      new DisconnectParticipantCommand({
        ConnectionToken: connectionToken,
      })
    )
  }

  return {}
}
```

#### 4.3 HITL Channel (`src/channels/hitl.ts`)

Define a separate `hitl` channel for agent-customer messaging:

```typescript
export const hitlChannel = {
  messages: {
    text: async ({ payload, conversation, ack, ctx, logger }) => {
      const participantClient = getParticipantClient(ctx.configuration)
      const connectionToken = conversation.tags.connectionToken

      const response = await participantClient.send(
        new SendMessageCommand({
          ConnectionToken: connectionToken,
          ContentType: 'text/plain',
          Content: payload.text,
        })
      )

      await ack({
        tags: {
          id: response.Id,
          timestamp: response.AbsoluteTime,
          type: 'MESSAGE',
        },
      })
    },
    // Similar implementations for other message types
  },
}
```

#### 4.4 HITL Event Handling (`src/events/hitl-message.ts`)

Handle messages on the HITL channel:

```typescript
export async function handleHitlMessage({ message, client, ctx, logger }) {
  const contactId = message.ContactId
  const participantRole = message.ParticipantRole

  // Only process agent messages on HITL channel
  if (participantRole !== 'AGENT') {
    return
  }

  // Get HITL conversation
  const { conversation } = await client.getOrCreateConversation({
    channel: 'hitl',
    tags: { id: contactId },
  })

  // Get or create user (agent)
  const { user } = await client.getOrCreateUser({
    tags: {
      id: message.ParticipantId,
      contactId: contactId,
    },
  })

  // Convert and create message
  const messageContent = convertMessageContent(message)

  await client.createMessage({
    conversationId: conversation.id,
    userId: user.id,
    type: messageContent.type,
    payload: messageContent.payload,
    tags: {
      id: message.MessageId,
      timestamp: message.AbsoluteTime,
      type: message.Type,
    },
  })
}
```

### Phase 5: Events and State Management

#### 5.1 Event Definitions (`definitions/events.ts`)

Define custom events for Amazon Connect:

```typescript
export const events = {
  contactStarted: {
    title: 'Contact Started',
    description: 'Triggered when a new contact is initiated',
    schema: z.object({
      contactId: z.string(),
      initiationMethod: z.string(),
      channel: z.string(),
    }),
  },
  contactEnded: {
    title: 'Contact Ended',
    description: 'Triggered when a contact ends',
    schema: z.object({
      contactId: z.string(),
      disconnectReason: z.string().optional(),
    }),
  },
  agentConnected: {
    title: 'Agent Connected',
    description: 'Triggered when an agent joins the conversation',
    schema: z.object({
      contactId: z.string(),
      agentId: z.string(),
      agentName: z.string().optional(),
    }),
  },
  agentDisconnected: {
    title: 'Agent Disconnected',
    description: 'Triggered when an agent leaves the conversation',
    schema: z.object({
      contactId: z.string(),
      agentId: z.string(),
    }),
  },
}
```

#### 5.2 State Management

Use Botpress state API to track:
- Active contacts
- Connection tokens (with expiration)
- HITL session metadata
- Conversation context for handoffs

### Phase 6: Advanced Features

#### 6.1 Actions (`src/actions/index.ts`)

Additional actions to expose:

```typescript
export const actions = {
  startHitl,
  stopHitl,

  sendTypingIndicator: {
    title: 'Send Typing Indicator',
    description: 'Show typing indicator in Amazon Connect',
    input: { schema: z.object({ conversationId: z.string() }) },
    output: { schema: z.object({}) },
  },

  getTranscript: {
    title: 'Get Chat Transcript',
    description: 'Retrieve the chat transcript for a contact',
    input: { schema: z.object({ contactId: z.string() }) },
    output: { schema: z.object({ transcript: z.array(z.any()) }) },
  },

  transferToQueue: {
    title: 'Transfer to Queue',
    description: 'Transfer contact to a specific queue',
    input: {
      schema: z.object({
        conversationId: z.string(),
        queueId: z.string(),
        attributes: z.record(z.string()).optional(),
      })
    },
    output: { schema: z.object({}) },
  },
}
```

#### 6.2 Interactive Messages

Map Botpress UI components to Amazon Connect interactive message templates:

- **List Picker** → Botpress dropdown/choice
- **Time Picker** → Custom interactive template
- **Panel** → Card layout

Implement converters in `src/converters/interactive-messages.ts`

#### 6.3 Attachment Handling

Implement file upload/download:

```typescript
async function handleAttachment({ payload, conversation, ack, ctx }) {
  const participantClient = getParticipantClient(ctx.configuration)
  const connectionToken = conversation.tags.connectionToken

  // Start attachment upload
  const uploadResponse = await participantClient.send(
    new StartAttachmentUploadCommand({
      ConnectionToken: connectionToken,
      AttachmentName: payload.fileName,
      AttachmentSizeInBytes: payload.fileSize,
      ContentType: payload.contentType,
    })
  )

  // Upload file to presigned URL
  await uploadToS3(uploadResponse.UploadMetadata.Url, payload.fileUrl)

  // Complete attachment upload
  await participantClient.send(
    new CompleteAttachmentUploadCommand({
      ConnectionToken: connectionToken,
      AttachmentIds: [uploadResponse.AttachmentId],
    })
  )

  await ack({ tags: { id: uploadResponse.AttachmentId } })
}
```

#### 6.4 Error Handling and Retries

Implement robust error handling:
- Connection token expiration → refresh token
- Throttling → exponential backoff
- Network errors → retry with jitter
- Contact not found → graceful degradation

### Phase 7: Testing & Documentation

#### 7.1 Testing Strategy

**Unit Tests:**
- Message format conversion
- AWS SDK client initialization
- Error handling

**Integration Tests:**
- Mock Amazon Connect API responses
- Test contact lifecycle
- HITL flow end-to-end

**Manual Testing:**
- Set up Amazon Connect instance
- Configure contact flows
- Test bot → agent handoff
- Test agent → bot responses

#### 7.2 Documentation (`hub.md`)

Update documentation with:

**Configuration:**
- AWS IAM setup (required permissions)
- Amazon Connect instance configuration
- Contact flow setup guide
- Webhook configuration (SNS/EventBridge)

**Usage:**
- Starting conversations
- Message type support
- HITL workflow examples
- Available actions

**Limitations:**
- Message size limits (Amazon Connect: 1024 chars for text)
- Attachment size limits (5MB)
- Rate limiting considerations
- Supported message types

**Troubleshooting:**
- Common configuration errors
- Connection token expiration
- Webhook debugging

## Implementation Checklist

### Phase 1: Foundation
- [ ] Update `integration.definition.ts` with configuration schema
- [ ] Add AWS SDK dependencies to `package.json`
- [ ] Create `src/client.ts` for AWS client initialization
- [ ] Implement register handler with validation
- [ ] Implement unregister handler

### Phase 2: Channel
- [ ] Define channel schema in `definitions/channels.ts`
- [ ] Implement text message handler
- [ ] Implement image/audio/video/file handlers
- [ ] Implement card/carousel/dropdown/choice handlers
- [ ] Implement bloc handler
- [ ] Create utility functions for contact management

### Phase 3: Webhooks
- [ ] Implement webhook handler in `src/handler.ts`
- [ ] Create message event handler
- [ ] Create event handler (typing, etc.)
- [ ] Create attachment handler
- [ ] Test webhook integration with Amazon SNS

### Phase 4: HITL
- [ ] Define HITL module in `bp_modules/hitl/`
- [ ] Implement startHitl action
- [ ] Implement stopHitl action
- [ ] Create HITL channel handlers
- [ ] Implement HITL message event handling
- [ ] Add transcript transfer functionality

### Phase 5: Events & State
- [ ] Define custom events
- [ ] Implement state management for tokens
- [ ] Add contact lifecycle event handlers

### Phase 6: Advanced Features
- [ ] Implement additional actions
- [ ] Add interactive message support
- [ ] Implement attachment upload/download
- [ ] Add error handling and retry logic

### Phase 7: Testing & Docs
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Manual testing with Amazon Connect
- [ ] Update `hub.md` with complete documentation
- [ ] Add example contact flows
- [ ] Create troubleshooting guide

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Amazon Connect                          │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐            │
│  │  Contact   │  │   Contact   │  │    Queue     │            │
│  │   Flows    │→ │  Management │→ │  Management  │            │
│  └────────────┘  └─────────────┘  └──────────────┘            │
│         ↓                ↓                  ↓                    │
│  ┌────────────────────────────────────────────────┐            │
│  │        Amazon Connect Participant Service       │            │
│  │  • SendMessage  • GetTranscript                │            │
│  │  • SendEvent    • DisconnectParticipant        │            │
│  └────────────────────────────────────────────────┘            │
└──────────────────────┬──────────────────────┬───────────────────┘
                       ↓                      ↓
              ┌─────────────────┐    ┌───────────────┐
              │   Amazon SNS    │    │  EventBridge  │
              │   (Webhooks)    │    │   (Events)    │
              └────────┬────────┘    └───────┬───────┘
                       │                     │
                       └──────────┬──────────┘
                                  ↓
                    ┌──────────────────────────┐
                    │  Botpress Integration    │
                    │  ┌────────────────────┐  │
                    │  │  Webhook Handler   │  │
                    │  └────────┬───────────┘  │
                    │           ↓               │
                    │  ┌────────────────────┐  │
                    │  │  Channel: channel  │  │
                    │  │  • Outbound msgs   │  │
                    │  └────────────────────┘  │
                    │  ┌────────────────────┐  │
                    │  │  Channel: hitl     │  │
                    │  │  • Agent msgs      │  │
                    │  └────────────────────┘  │
                    │  ┌────────────────────┐  │
                    │  │  Actions           │  │
                    │  │  • startHitl       │  │
                    │  │  • stopHitl        │  │
                    │  └────────────────────┘  │
                    └──────────────────────────┘
                                  ↓
                    ┌──────────────────────────┐
                    │     Botpress Runtime     │
                    │  • Conversations         │
                    │  • Users                 │
                    │  • Messages              │
                    │  • State                 │
                    └──────────────────────────┘
```

## Required AWS Permissions

The IAM user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "connect:StartChatContact",
        "connect:StopContact",
        "connect:DescribeContact",
        "connect:CreateParticipantConnection",
        "connect:DescribeContactFlow",
        "connect:DescribeInstance"
      ],
      "Resource": [
        "arn:aws:connect:REGION:ACCOUNT:instance/INSTANCE_ID/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "connect:SendMessage",
        "connect:SendEvent",
        "connect:GetTranscript",
        "connect:DisconnectParticipant",
        "connect:StartAttachmentUpload",
        "connect:CompleteAttachmentUpload",
        "connect:GetAttachment"
      ],
      "Resource": "*"
    }
  ]
}
```

## Contact Flow Setup

Create two contact flows in Amazon Connect:

### 1. Bot Contact Flow (`contactFlowId`)
- Entry point for customer conversations
- Invokes Lambda to notify Botpress webhook
- Routes messages between customer and bot participant

### 2. HITL Contact Flow (`hitlContactFlowId`)
- Entry point for HITL sessions
- Retrieves context from attributes
- Routes to appropriate queue based on attributes
- Connects customer with agent

## References

- [Amazon Connect API Reference](https://docs.aws.amazon.com/connect/latest/APIReference/Welcome.html)
- [StartChatContact API](https://docs.aws.amazon.com/connect/latest/APIReference/API_StartChatContact.html)
- [Amazon Connect Participant Service](https://docs.aws.amazon.com/connect-participant/latest/APIReference/Welcome.html)
- [SendMessage API](https://docs.aws.amazon.com/connect/latest/APIReference/API_connect-participant_SendMessage.html)
- [SendEvent API](https://docs.aws.amazon.com/connect-participant/latest/APIReference/API_SendEvent.html)
- [WhatsApp messaging with Amazon Connect](https://aws.amazon.com/blogs/contact-center/provide-whatsapp-messaging-as-a-channel-with-amazon-connect/)

## Timeline Considerations

This implementation involves multiple phases with dependencies. Focus on getting a minimal viable integration working first (Phases 1-3) before adding HITL and advanced features.

## Success Criteria

- [ ] Bot can receive messages from Amazon Connect contacts
- [ ] Bot can send text messages to Amazon Connect contacts
- [ ] Bot can send rich messages (cards, carousels) to Amazon Connect
- [ ] Bot can hand off to human agents via HITL
- [ ] Agents can communicate with customers through HITL channel
- [ ] HITL sessions can be ended programmatically
- [ ] Chat transcripts are preserved during handoffs
- [ ] Integration handles errors gracefully
- [ ] Documentation is complete and accurate
