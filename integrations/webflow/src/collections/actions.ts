import { WebflowClient } from 'src/client'
import * as bp from '../../.botpress'

export const listCollections: bp.IntegrationProps['actions']['listCollections'] = async (props) => {
  const client = new WebflowClient(props.ctx.configuration.apiToken)
  return await client.listCollections(props.ctx.configuration.siteID)
}

export const getCollectionDetails: bp.IntegrationProps['actions']['getCollectionDetails'] = async (props) => {
  const client = new WebflowClient(props.ctx.configuration.apiToken)
  return await client.getCollectionDetails(props.input.collectionID)
}

export const createCollection: bp.IntegrationProps['actions']['createCollection'] = async (props) => {
  const client = new WebflowClient(props.ctx.configuration.apiToken)
  return await client.createCollection(props.ctx.configuration.siteID, props.input.collectionInfo)
}

export const deleteCollection: bp.IntegrationProps['actions']['deleteCollection'] = async (props) => {
  const client = new WebflowClient(props.ctx.configuration.apiToken)
  return await client.deleteCollection(props.input.collectionID)
}
