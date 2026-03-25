import * as sdk from '@botpress/sdk'
import { getLinearClient } from '../../misc/utils'
import * as mapping from '../mapping'
import * as bp from '.botpress'

export const filesReadonlyTransferFileToBotpress: bp.IntegrationProps['actions']['filesReadonlyTransferFileToBotpress'] =
  async ({ input, client, ctx }) => {
    const { file, fileKey, shouldIndex } = input

    if (!file.id.startsWith(mapping.PREFIXES.ISSUE)) {
      throw new sdk.RuntimeError(`Invalid file ID: ${file.id}. Only issues can be transferred.`)
    }

    try {
      const issueId = file.id.slice(mapping.PREFIXES.ISSUE.length)
      const linearClient = await getLinearClient({ client, ctx })
      const issue = await linearClient.issue(issueId)

      if (!issue) {
        throw new sdk.RuntimeError(`Issue not found: ${issueId}`)
      }

      const markdown = _buildIssueMarkdown(issue)

      const { file: uploadedFile } = await client.uploadFile({
        key: fileKey,
        content: markdown,
        index: shouldIndex,
      })

      return { botpressFileId: uploadedFile.id }
    } catch (err: unknown) {
      if (err instanceof sdk.RuntimeError) {
        throw err
      }
      throw new sdk.RuntimeError(
        `Failed to transfer file to Botpress: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

const _buildIssueMarkdown = (issue: any): string => {
  const parts: string[] = []

  parts.push(`# ${issue.identifier} - ${issue.title}`)
  parts.push('')

  if (issue.description) {
    parts.push(issue.description)
    parts.push('')
  }

  return parts.join('\n')
}
