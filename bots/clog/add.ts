import cmd from '@botpress/cli'

void cmd.add({
  packageRef: `${__dirname}/../../integrations/slack`,

  botpressHome: '~/.botpress',
  confirm: true,
  installPath: __dirname,
  json: false,
  useDev: false,

  alias: undefined,
  apiUrl: undefined,
  profile: undefined,
  token: undefined,
  verbose: false,
  workspaceId: undefined,
})
