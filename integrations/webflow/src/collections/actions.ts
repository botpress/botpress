import { Webflow, WebflowClient } from 'webflow-api'
import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { CollectionsCreateRequest, FieldCreate } from 'webflow-api/api'

export async function listCollections(
  props: bp.ActionProps['listCollections']
): Promise<bp.actions.listCollections.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const siteId = props.ctx.configuration.siteId
  const result = await client.collections.list(siteId)

  if (result.collections == undefined) throw new sdk.RuntimeError('No collections found')
  return { collections: result.collections! }
}

export async function getCollectionDetails(
  params: bp.ActionProps['getCollectionDetails']
): Promise<bp.actions.getCollectionDetails.output.Output> {
  const apiToken = params.input.apiTokenOverwrite ? params.input.apiTokenOverwrite : params.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const collectionID = params.input.collectionID
  const result = await client.collections.get(collectionID)

  if (result == undefined) throw new sdk.RuntimeError('Collection not found')
  return { collectionDetails: result! }
}

export async function createCollection(
  params: bp.ActionProps['createCollection']
): Promise<bp.actions.createCollection.output.Output> {
  const apiToken = params.input.apiTokenOverwrite ? params.input.apiTokenOverwrite : params.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const siteId = params.ctx.configuration.siteId
  // TODO add check for valid field types

  const collectionData: CollectionsCreateRequest = {
    displayName: params.input.displayName,
    singularName: params.input.singularName,
    slug: params.input.slug ? params.input.slug : '',
    fields: params.input.fields as FieldCreate[],
  }
  params.logger.forBot().info(`Creating collection with data: ${JSON.stringify(collectionData)}`)

  const result = await client.collections.create(siteId, collectionData)

  if (result == undefined) throw new sdk.RuntimeError('Failed to create collection')
  return { collectionDetails: result! }
}

export async function deleteCollection(
  params: bp.ActionProps['deleteCollection']
): Promise<bp.actions.deleteCollection.output.Output> {
  try {
    const apiToken = params.input.apiTokenOverwrite ? params.input.apiTokenOverwrite : params.ctx.configuration.apiToken
    const client = new WebflowClient({ accessToken: apiToken })

    const collectionID = params.input.collectionID
    await client.collections.delete(collectionID)

    return { success: true }
  } catch (e) {
    throw new sdk.RuntimeError('Failed to delete collection')
  }
}
