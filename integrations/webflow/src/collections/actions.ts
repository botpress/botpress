import * as sdk from '@botpress/sdk'
import axios from 'axios'
import { Collection, CollectionDetails } from '../types'
import * as bp from '.botpress'

export async function listCollections(
  props: bp.ActionProps['listCollections']
): Promise<bp.actions.listCollections.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  type Result = {
    collections: Collection[]
  }

  try {
    const response = await axios.get<Result>(
      `https://api.webflow.com/v2/sites/${props.ctx.configuration.siteID}/collections`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    )

    return response.data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err
  }
}

export async function getCollectionDetails(
  props: bp.ActionProps['getCollectionDetails']
): Promise<bp.actions.getCollectionDetails.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  try {
    const response = await axios.get<CollectionDetails>(
      `https://api.webflow.com/v2/collections/${props.input.collectionID}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    )

    return { collectionDetails: response.data }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err
  }
}

export async function createCollection(
  props: bp.ActionProps['createCollection']
): Promise<bp.actions.createCollection.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken
  // TODO add check for valid field types

  try {
    const response = await axios.post<CollectionDetails>(
      `https://api.webflow.com/v2/sites/${props.ctx.configuration.siteID}/collections`,
      props.input.collectionInfo,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return { collectionDetails: response.data }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err
  }
}

export async function deleteCollection(
  props: bp.ActionProps['deleteCollection']
): Promise<bp.actions.deleteCollection.output.Output> {
  const apiToken = props.input.apiTokenOverwrite ? props.input.apiTokenOverwrite : props.ctx.configuration.apiToken

  try {
    await axios.delete(`https://api.webflow.com/v2/collections/${props.input.collectionID}`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })

    return { success: true }
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const serverMessage = (err.response?.data as any)?.message || err.response?.statusText || err.message
      throw new sdk.RuntimeError(`webflow API error: ${serverMessage}`)
    }
    throw err
  }
}
