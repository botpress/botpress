import type * as models from '../../definitions/models'
import type * as types from '../types'

const TRANSFER_FILE_ACTION_NAME = 'filesReadonlyTransferFileToBotpress'

export type CreateIntegrationTransferHandlerProps = {
  integrationName: string
  integrationAlias: string
  client: {
    callAction: (params: {
      type: string
      input: {
        file: models.FileWithPath
        fileKey: string
        shouldIndex: boolean
      }
    }) => Promise<{ output: { botpressFileId: string } }>
  }
  transferFileToBotpressAlias?: string
  shouldIndex?: boolean
}

export function createIntegrationTransferHandler(props: CreateIntegrationTransferHandlerProps): {
  name: string
  alias: string
  transferFileToBotpress: (params: {
    file: models.FileWithPath
    fileKey: string
  }) => Promise<{ botpressFileId: string }>
} {
  const actionName = props.transferFileToBotpressAlias ?? TRANSFER_FILE_ACTION_NAME
  const shouldIndex = props.shouldIndex ?? true

  return {
    name: props.integrationName,
    alias: props.integrationAlias,
    async transferFileToBotpress({ file, fileKey }) {
      const { output } = await props.client.callAction({
        type: `${props.integrationAlias}:${actionName}`,
        input: {
          file,
          fileKey,
          shouldIndex,
        },
      })

      return { botpressFileId: output.botpressFileId }
    },
  }
}
