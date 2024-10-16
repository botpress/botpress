import * as sdk from '@botpress/sdk'
const { text } = sdk.messages.defaults

const COMMON_TAGS = {
  repository: {
    repoId: {
      title: 'Repository ID',
      description: 'Unique identifier of the repository',
    },
    repoNodeId: {
      title: 'Repository global node ID',
      description: 'Node ID for GraphQL',
    },
    repoName: {
      title: 'Repository Name',
      description: 'Name of the repository',
    },
    repoUrl: {
      title: 'Repository URL',
      description: 'URL of the repository',
    },
    repoOwnerId: {
      title: 'Repository Owner ID',
      description: 'Unique identifier of the repository owner',
    },
    repoOwnerName: {
      title: 'Repository Owner Name',
      description: 'Name of the repository owner. Usually the organization name',
    },
    repoOwnerUrl: {
      title: 'Repository Owner URL',
      description: 'URL of the repository owner',
    },
  },
  pullRequest: {
    pullRequestNumber: {
      title: 'Pull Request Number',
      description: 'The pull request number',
    },
    pullRequestUrl: {
      title: 'Pull Request URL',
      description: 'URL of the pull request',
    },
    pullRequestNodeId: {
      title: 'Pull Request global node ID',
      description: 'Node ID for GraphQL',
    },
  },
  discussion: {
    discussionId: {
      title: 'Discussion ID',
      description: 'Unique identifier of the discussion',
    },
    discussionNodeId: {
      title: 'Discussion global node ID',
      description: 'Node ID for GraphQL',
    },
    discussionUrl: {
      title: 'Discussion URL',
      description: 'URL of the discussion',
    },
    discussionNumber: {
      title: 'Discussion Number',
      description: 'The discussion number',
    },
    discussionCategoryId: {
      title: 'Discussion Category ID',
      description: 'Unique identifier of the discussion category',
    },
    discussionCategoryName: {
      title: 'Discussion Category Name',
      description: 'Name of the discussion category',
    },
    discussionCategoryNodeId: {
      title: 'Discussion Category global node ID',
      description: 'Node ID for GraphQL',
    },
  },
  comment: {
    commentId: {
      title: 'Comment ID',
      description: 'Unique identifier of the comment',
    },
    commentNodeId: {
      title: 'Comment global node ID',
      description: 'Node ID for GraphQL',
    },
    commentUrl: {
      title: 'Comment URL',
      description: 'URL of the comment',
    },
  },
} as const satisfies Record<string, Record<string, sdk.TagDefinition>>

export const channels = {
  pullRequest: {
    title: 'Pull Request',
    description: 'A pull request in a GitHub repository',
    conversation: {
      tags: {
        ...COMMON_TAGS.repository,
        ...COMMON_TAGS.pullRequest,
        channel: {
          title: 'Channel name',
          description: 'Workaround for the SDK',
        },
      },
    },
    message: {
      tags: {
        ...COMMON_TAGS.comment,
      },
    },
    messages: {
      text,
    },
  },
  pullRequestReviewComment: {
    title: 'Pull Request Review Comment',
    description: 'A comment on a pull request review in a GitHub repository',
    conversation: {
      tags: {
        ...COMMON_TAGS.repository,
        ...COMMON_TAGS.pullRequest,
        fileBeingReviewed: {
          title: 'File under review',
          description: 'The file being reviewed',
        },
        commitBeingReviewed: {
          title: 'Commit under review',
          description: 'The commit being reviewed',
        },
        lineBeingReviewed: {
          title: 'Line under review',
          description: 'The line being reviewed',
        },
        lastCommentId: {
          title: 'Last Comment ID',
          description: 'The ID of the last comment posted on the review thread',
        },
        reviewThreadUrl: {
          title: 'Review Thread URL',
          description: 'URL of the review thread',
        },
      },
    },
    message: {
      tags: {
        ...COMMON_TAGS.comment,
      },
    },
    messages: {
      text,
    },
  },
  issue: {
    title: 'Issue',
    description: 'An issue in a GitHub repository',
    conversation: {
      tags: {
        ...COMMON_TAGS.repository,
        issueNumber: {
          title: 'Issue Number',
          description: 'The issue number',
        },
        issueUrl: {
          title: 'Issue URL',
          description: 'URL of the issue',
        },
        issueNodeId: {
          title: 'Issue global node ID',
          description: 'Node ID for GraphQL',
        },
      },
    },
    message: {
      tags: {
        ...COMMON_TAGS.comment,
      },
    },
    messages: {
      text,
    },
  },
  discussion: {
    title: 'Discussion',
    description: 'A discussion in a GitHub repository',
    conversation: {
      tags: {
        ...COMMON_TAGS.repository,
        ...COMMON_TAGS.discussion,
        channel: {
          title: 'Channel name',
          description: 'Workaround for the SDK',
        },
      },
    },
    message: {
      tags: {
        ...COMMON_TAGS.comment,
      },
    },
    messages: {
      text,
    },
  },
  discussionComment: {
    title: 'Discussion Comment',
    description: 'A comment thread on a discussion in a GitHub repository',
    conversation: {
      tags: {
        ...COMMON_TAGS.repository,
        ...COMMON_TAGS.discussion,
        parentCommentId: {
          title: 'Parent Comment ID',
          description: 'The ID of the parent comment from which this comment thread originates',
        },
      },
    },
    message: {
      tags: {
        ...COMMON_TAGS.comment,
      },
    },
    messages: {
      text,
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['channels']
