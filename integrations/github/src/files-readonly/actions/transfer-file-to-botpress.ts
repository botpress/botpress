import * as sdk from '@botpress/sdk'
import { wrapActionAndInjectOctokit } from 'src/misc/action-wrapper'
import * as mapping from '../mapping'

export const filesReadonlyTransferFileToBotpress = wrapActionAndInjectOctokit(
  { actionName: 'filesReadonlyTransferFileToBotpress', errorMessage: 'Failed to transfer file to Botpress' },
  async ({ octokit, client }, { file, fileKey, shouldIndex }) => {
    const contentInfo = mapping.decodeContentId(file.id)
    if (!contentInfo) {
      throw new sdk.RuntimeError(`Invalid file ID: ${file.id}`)
    }

    const { owner, repo, path } = contentInfo

    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      mediaType: { format: 'raw' },
    })

    const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)

    const { file: uploadedFile } = await client.uploadFile({
      key: fileKey,
      content,
      index: shouldIndex,
    })

    return { botpressFileId: uploadedFile.id }
  }
)
