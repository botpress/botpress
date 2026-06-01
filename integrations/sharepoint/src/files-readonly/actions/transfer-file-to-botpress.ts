import { wrapAction } from '../../action-wrapper'

export const filesReadonlyTransferFileToBotpress = wrapAction(
  { actionName: 'filesReadonlyTransferFileToBotpress' },
  async ({ sharepointClient, client }, { file, fileKey, shouldIndex }) => {
    if (!file.absolutePath) {
      throw new Error(`Cannot transfer file: absolutePath is missing for file id=${file.id}`)
    }
    const content = await sharepointClient.downloadFile(file.absolutePath)

    const { file: uploaded } = await client.uploadFile({
      key: fileKey,
      content,
      index: shouldIndex,
    })

    return { botpressFileId: uploaded.id }
  }
)
