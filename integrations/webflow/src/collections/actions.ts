import * as sdk from '@botpress/sdk'
import axios from 'axios'
import * as bp from '../../.botpress'
import { Collection, CollectionDetails } from '../types'

export const listCollections: bp.IntegrationProps['actions']['listCollections'] = async (props) => {
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

export const getCollectionDetails: bp.IntegrationProps['actions']['getCollectionDetails'] = async (props) => {
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

export const createCollection: bp.IntegrationProps['actions']['createCollection'] = async (props) => {
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

export const deleteCollection: bp.IntegrationProps['actions']['deleteCollection'] = async (props) => {
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
