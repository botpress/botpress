import { RuntimeError } from '@botpress/client'
import * as bp from '.botpress'

export const getCredentials = async ({ ctx }: { client: bp.Client; ctx: bp.Context }) => {
  const { APIKey, projectId } = ctx.configuration

  if (!APIKey) {
    throw new RuntimeError('API key not found')
  } else if (!projectId) {
    throw new RuntimeError('Project ID not found')
  }
  return { APIKey, projectId }
}
