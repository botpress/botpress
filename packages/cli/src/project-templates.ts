import { CLI_ROOT_DIR } from './root'
import * as utils from './utils'

export namespace ProjectTemplates {
  export type Template = Readonly<{
    fullName: string
    identifier: string
    defaultProjectName: string
    absolutePath: utils.path.AbsolutePath
  }>
  export type TemplateArray = Readonly<[Template, ...Template[]]>
  export type ProjectType = 'bot' | 'plugin' | 'integration'

  const _dirNameToAbsPath = (directoryName: string) => utils.path.join(CLI_ROOT_DIR, 'templates', directoryName)

  export const templates = {
    bot: [
      {
        fullName: 'Empty Bot',
        identifier: 'empty',
        defaultProjectName: 'empty-bot',
        absolutePath: _dirNameToAbsPath('empty-bot'),
      },
    ],
    plugin: [
      {
        fullName: 'Empty Plugin',
        identifier: 'empty',
        defaultProjectName: 'empty-plugin',
        absolutePath: _dirNameToAbsPath('empty-plugin'),
      },
    ],
    integration: [
      {
        fullName: 'Empty Integration',
        identifier: 'empty',
        defaultProjectName: 'empty-integration',
        absolutePath: _dirNameToAbsPath('empty-integration'),
      },
      {
        fullName: 'Hello World',
        identifier: 'hello-world',
        defaultProjectName: 'hello-world',
        absolutePath: _dirNameToAbsPath('hello-world'),
      },
      {
        fullName: 'Webhook Message',
        identifier: 'webhook-message',
        defaultProjectName: 'webhook-message',
        absolutePath: _dirNameToAbsPath('webhook-message'),
      },
    ],
  } as const satisfies { [k in ProjectType]: TemplateArray }

  export const getAllChoices = () => [...new Set(Object.values(templates).flatMap((t) => t.map((tt) => tt.identifier)))]
}
