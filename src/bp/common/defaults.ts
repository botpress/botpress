import { AuthRole, Pipeline, Workspace } from './typings'

export const defaultUserRole = 'dev'
export const defaultAdminRole = 'admin'
export const defaultRoles: AuthRole[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description:
      'Administrators have full access to the workspace including adding members, creating bots and synchronizing changes.',
    rules: [
      { res: '*', op: '+r+w' },
      {
        res: 'module.code-editor.global.configs',
        op: '-r-w'
      }
    ]
  },
  {
    id: 'dev',
    name: 'Developer',
    description: 'Developers have full read/write access to bots, including flows, content, NLU and actions',
    rules: [
      { res: '*', op: '+r+w' },
      { res: 'admin.*', op: '+r-w' },
      { res: 'admin.collaborators.*', op: '-r' },
      {
        res: 'module.code-editor.global.*',
        op: '+r-w'
      },
      {
        res: 'module.code-editor.global.configs',
        op: '-r-w'
      }
    ]
  },
  {
    id: 'editor',
    name: 'Content Editor',
    description:
      'Content Editors have read/write access to content and NLU, and read-only access to flows and actions.',
    rules: [
      { res: '*', op: '+r' },
      { res: 'admin.collaborators.*', op: '-r' },
      { res: 'bot.flows', op: '+r-w' },
      { res: 'bot.content', op: '+r+w' },
      { res: 'module.qna', op: '+r+w' },
      { res: 'module.nlu', op: '+r+w' },
      {
        res: 'module.code-editor.*',
        op: '-r-w'
      }
    ]
  }
]

export const defaultPipelines: { [id: string]: Pipeline } = {
  none: [
    {
      id: 'prod',
      label: 'Production',
      action: 'promote_copy',
      reviewers: [],
      minimumApprovals: 0,
      reviewSequence: 'parallel'
    }
  ],
  botpress: [
    {
      id: 'dev',
      label: 'Dev',
      action: 'promote_copy',
      reviewers: [],
      minimumApprovals: 0,
      reviewSequence: 'parallel'
    },
    {
      id: 'review',
      label: 'Review',
      action: 'promote_copy',
      reviewers: [],
      minimumApprovals: 0,
      reviewSequence: 'parallel'
    },
    {
      id: 'prod',
      label: 'Production',
      action: 'promote_copy',
      reviewers: [],
      minimumApprovals: 0,
      reviewSequence: 'parallel'
    }
  ]
}

export const defaultWorkspace: Workspace = {
  id: 'default',
  name: 'Default',
  audience: 'external',
  bots: [],
  roles: defaultRoles,
  defaultRole: defaultUserRole,
  adminRole: defaultAdminRole,
  pipeline: defaultPipelines['none'],
  rolloutStrategy: 'anonymous'
}

// Builtin role for chat users. It can't be customized
export const CHAT_USER_ROLE = {
  id: 'chatuser',
  name: 'Chat User',
  description: 'Chat users have limited access to bots.',
  rules: [
    {
      res: '*',
      op: '-r-w'
    },
    {
      res: 'user.bots',
      op: '+r'
    }
  ]
}
