import { AuthRole, Pipeline, Workspace } from './typings'

export const defaultUserRole = 'dev'
export const defaultAdminRole = 'admin'
export const defaultRoles: AuthRole[] = [
  {
    id: 'admin',
    name: 'admin.workspace.roles.default.administrator.name',
    description: 'admin.workspace.roles.default.administrator.description',
    rules: [
      { res: '*', op: '+r+w' },
      {
        res: 'module.code-editor.global.main_config',
        op: '-r-w'
      },
      {
        res: 'module.code-editor.global.module_config',
        op: '-r-w'
      }
    ]
  },
  {
    id: 'dev',
    name: 'admin.workspace.roles.default.developer.name',
    description: 'admin.workspace.roles.default.developer.description',
    rules: [
      { res: '*', op: '+r+w' },
      { res: 'admin.*', op: '+r-w' },
      { res: 'admin.collaborators.*', op: '-r' },
      {
        res: 'module.code-editor.global.*',
        op: '+r-w'
      },
      {
        res: 'module.code-editor.global.main_config',
        op: '-r-w'
      },
      {
        res: 'module.code-editor.global.module_config',
        op: '-r-w'
      }
    ]
  },
  {
    id: 'editor',
    name: 'admin.workspace.roles.default.contentEditor.name',
    description: 'admin.workspace.roles.default.contentEditor.description',
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
      },
      { res: 'admin.logs.*', op: '-r' },
      {
        res: 'admin.bots.archive',
        op: '-r'
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
  rolloutStrategy: 'anonymous',
  authStrategies: ['default']
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

export const BUILTIN_MODULES = [
  'analytics',
  'basic-skills',
  'bot-improvement',
  'broadcast',
  'builtin',
  'channel-messenger',
  'channel-slack',
  'channel-smooch',
  'channel-teams',
  'channel-telegram',
  'channel-web',
  'code-editor',
  'examples',
  'history',
  'hitl',
  'misunderstood',
  'ndu',
  'nlu',
  'testing',
  'uipath'
]
