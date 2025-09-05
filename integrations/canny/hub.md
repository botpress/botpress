# Canny Integration

This integration provides comprehensive access to Canny's API for managing posts and comments in your feature request boards.

## Features

### Actions

**Post Management:**

- **Create Post**: Create new posts in your Canny boards
- **Get Post**: Retrieve detailed information about a specific post
- **List Posts**: List posts with filtering and pagination options
- **Update Post**: Modify existing posts (title, details, ETA, etc.)
- **Delete Post**: Remove posts from your boards

**Comment Management:**

- **Create Comment**: Add comments to posts
- **Get Comment**: Retrieve comment details
- **List Comments**: List comments with filtering options
- **Delete Comment**: Remove comments

### Channels

**Posts Channel:**

- Handles conversations where posts are the main topic and comments are replies
- When users send messages in conversations, they're automatically created as comments on the associated post

### Events

**Webhook Support:**

- Automatically creates conversations when new posts are created in Canny
- Adds messages to conversations when new comments are posted
- The first message in each conversation is the post content, and subsequent messages are comments

## Configuration

To use this integration, you'll need:

1. **API Key**: Your Canny API key (get this from your Canny account settings)

## Author ID

Posts and comments will appear as "BotpressIntegration" unless you provide a specific `authorId`.

To use a different author, provide an `authorId` of an existing user in your Canny workspace. You can find available user Ids using the "List Users" action.

## Usage Examples

### Creating a Post (uses BotpressIntegration by default)

```javascript
const result = await actions.createPost({
  boardId: 'board456',
  title: 'New Feature Request',
  details: 'I would like to see...',
})
```

### Creating a Post with specific author

```javascript
const result = await actions.createPost({
  authorId: '507f1f77bcf86cd799439011', // Specific user Id
  boardId: 'board456',
  title: 'New Feature Request',
  details: 'I would like to see...',
})
```

### Setting up Webhooks

Configure webhooks in your Canny account to point to your Botpress integration endpoint to automatically sync posts and comments as conversations.

## Conversation Flow

1. **Post Creation**: When a new post is created in Canny, a new conversation is started in Botpress
2. **Comment Replies**: When users reply in the conversation, new comments are created on the original post
3. **Thread Management**: Each post becomes a conversation thread with comments as messages
