import * as common from '../common'
import * as uploadFile from '../files/upload-file'
import * as gen from '../gen/public'

export type {
  Message,
  Conversation,
  User,
  State,
  Event,
  File,
  Bot,
  Integration,
  Interface,
  Issue,
  IssueEvent,
  Account,
  Workspace,
  WorkspaceMember,
  Table,
  Column,
  Row,
  Usage,
  Workflow,
  Plugin,
} from '../gen/public/models'

export type IClient = common.types.Simplify<
  gen.Client & {
    uploadFile: (input: uploadFile.UploadFileInput) => Promise<uploadFile.UploadFileOutput>
  }
>
export type Operation = common.types.Operation<IClient>
export type ClientInputs = common.types.Inputs<IClient>
export type ClientOutputs = common.types.Outputs<IClient>
