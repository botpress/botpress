import * as bp from '.botpress'

/**
 * Maps comment IDs to their root thread IDs and parent IDs
 * Used to resolve thread hierarchy for Facebook feed events
 */
class ThreadResolver {
  private rootMap = new Map<string, string>() // comment_id -> root_thread_id
  private parentMap = new Map<string, string>() // comment_id -> parent_id

  /**
   * Resolve the root thread ID for a given comment
   * @param commentId - The comment ID to resolve
   * @param parentId - The parent ID of the comment
   * @param postId - The post ID (used to identify top-level comments)
   * @returns The root thread ID
   */
  resolveThreadId(commentId: string, parentId: string, postId: string): string {
    // If this is a top-level comment (parent_id === post_id)
    if (parentId === postId) {
      // This comment is its own root thread
      this.rootMap.set(commentId, commentId)
      this.parentMap.set(commentId, parentId)
      return commentId
    }

    // Check if we already have the root thread for this comment
    if (this.rootMap.has(commentId)) {
      return this.rootMap.get(commentId)!
    }

    // Try to find the root by walking up the parent chain
    const rootThreadId = this.findRootByWalkingUp(parentId, postId)

    // Cache the result
    this.rootMap.set(commentId, rootThreadId)
    this.parentMap.set(commentId, parentId)

    return rootThreadId
  }

  /**
   * Walk up the parent chain to find the root thread
   * @param parentId - The parent ID to start from
   * @param postId - The post ID (used to identify top-level comments)
   * @returns The root thread ID
   */
  private findRootByWalkingUp(parentId: string, postId: string): string {
    const visited = new Set<string>()
    let currentId = parentId

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId)

      // If we find a cached root, use it
      if (this.rootMap.has(currentId)) {
        return this.rootMap.get(currentId)!
      }

      // If this is a top-level comment, it's the root
      if (currentId === postId) {
        return currentId
      }

      // Get the parent of current comment
      const parent = this.parentMap.get(currentId)
      if (!parent) {
        // We don't have the parent info, this might be out-of-order delivery
        // For now, treat the current comment as the root
        this.rootMap.set(currentId, currentId)
        return currentId
      }

      currentId = parent
    }

    // If we couldn't resolve, treat the original parent as root
    this.rootMap.set(parentId, parentId)
    return parentId
  }

  /**
   * Pre-populate the resolver with known comment relationships
   * Useful for handling out-of-order webhook deliveries
   */
  addCommentRelationship(commentId: string, parentId: string, rootThreadId?: string): void {
    this.parentMap.set(commentId, parentId)
    if (rootThreadId) {
      this.rootMap.set(commentId, rootThreadId)
    }
  }

  /**
   * Get the parent ID for a comment
   */
  getParentId(commentId: string): string | undefined {
    return this.parentMap.get(commentId)
  }

  /**
   * Get the root thread ID for a comment
   */
  getRootThreadId(commentId: string): string | undefined {
    return this.rootMap.get(commentId)
  }

  /**
   * Clear all cached mappings
   */
  clear(): void {
    this.rootMap.clear()
    this.parentMap.clear()
  }
}

// Global instance for the integration
export const threadResolver = new ThreadResolver()

/**
 * Create a conversation for a Facebook feed event
 * Note: Botpress doesn't have native thread support, so we use conversation tags to simulate threads
 */
export async function createConversationAndThread(
  client: bp.Client,
  postId: string,
  commentId: string,
  parentId: string,
  _eventType: 'post' | 'comment' | 'reaction'
): Promise<{ conversation: any; threadId: string }> {
  // Resolve the root thread ID
  const rootThreadId = threadResolver.resolveThreadId(commentId, parentId, postId)

  // Create or get the conversation (one per post)
  const { conversation } = await client.getOrCreateConversation({
    channel: 'feed',
    tags: {
      id: postId,
      threadId: rootThreadId,
      commentId, // Post ID as sender
      parentId, // Post ID as recipient
    },
    discriminateByTags: ['id', 'commentId', 'parentId'],
  })

  return { conversation, threadId: rootThreadId }
}
