import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import { Collection, CollectionDetails } from './collection.d'

export async function listCollections(
  props: bp.ActionProps['listCollections']
): Promise<bp.actions.listCollections.output.Output> {

  type Result = {
    collections?: Collection[]
  }

  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  const response = await fetch(
    `https://api.webflow.com/v2/sites/${props.ctx.configuration.siteID}/collections`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`
      },
    }
  )
  if (!response.ok) throw new sdk.RuntimeError("siteID or apiToken not valid")

  const result = await response.json() as Result


  if (result.collections == undefined) throw new sdk.RuntimeError("no Collection to display")
  return { collections: result.collections }
}

export async function getCollectionDetails(
  props: bp.ActionProps['getCollectionDetails']
): Promise<bp.actions.getCollectionDetails.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  const response = await fetch(
    `https://api.webflow.com/v2/collections/${props.input.collectionID}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiToken}`
      },
    }
  )
  if (!response.ok) throw new sdk.RuntimeError("Collection not found")
  const result = await response.json() as CollectionDetails


  if (result == undefined) throw new sdk.RuntimeError('Collection not found')
  return { collectionDetails: result! }
}

export async function createCollection(
  props: bp.ActionProps['createCollection']
): Promise<bp.actions.createCollection.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  // TODO add check for valid field types
  const response = await fetch(
    `https://api.webflow.com/v2/sites/${props.ctx.configuration.siteID}/collections`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(props.input.collectionInfo)
    }
  )

  if (!response.ok) throw new sdk.RuntimeError("Error Creating the collection")
  const result = await response.json() as CollectionDetails


  if (response == undefined) throw new sdk.RuntimeError('Failed to create collection')
  return { collectionDetails: result! }
}

export async function deleteCollection(
  props: bp.ActionProps['deleteCollection']
): Promise<bp.actions.deleteCollection.output.Output> {
  try {
    const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

    const response = await fetch(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${apiToken}`
        },
      }
    )

    if (!response.ok) throw new sdk.RuntimeError("Error deleting the collection")

    return { success: true }
  } catch (e) {
    throw new sdk.RuntimeError('Failed to delete collection')
  }
}
