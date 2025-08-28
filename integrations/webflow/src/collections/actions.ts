import { WebflowClient } from 'webflow-api'
import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { CollectionsCreateRequest, FieldCreate } from 'webflow-api/api'

export async function listCollections(
  props: bp.ActionProps['listCollections']
): Promise<bp.actions.listCollections.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const result = await client.collections.list(props.ctx.configuration.siteID)

  if (result.collections == undefined) throw new sdk.RuntimeError('No collections found')
  return { collections: result.collections! }
}

export async function getCollectionDetails(
  props: bp.ActionProps['getCollectionDetails']
): Promise<bp.actions.getCollectionDetails.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  const result = await client.collections.get(props.input.collectionID)

  if (result == undefined) throw new sdk.RuntimeError('Collection not found')
  return { collectionDetails: result! }
}

export async function createCollection(
  props: bp.ActionProps['createCollection']
): Promise<bp.actions.createCollection.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken
  const client = new WebflowClient({ accessToken: apiToken })

  // TODO add check for valid field types

  const collectionData: CollectionsCreateRequest = {
    displayName: props.input.displayName,
    singularName: props.input.singularName,
    slug: props.input.slug ? props.input.slug : '',
    fields: props.input.fields as FieldCreate[],
  }

  const result = await client.collections.create(props.ctx.configuration.siteID, collectionData)

  if (result == undefined) throw new sdk.RuntimeError('Failed to create collection')
  return { collectionDetails: result! }
}

export async function deleteCollection(
  props: bp.ActionProps['deleteCollection']
): Promise<bp.actions.deleteCollection.output.Output> {
  try {
    const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken
    const client = new WebflowClient({ accessToken: apiToken })

    await client.collections.delete(props.input.collectionID)

    return { success: true }
  } catch (e) {
    throw new sdk.RuntimeError('Failed to delete collection')
  }
}
