import * as bp from '../.botpress'

export type Collection = bp.actions.listCollections.output.Output['collections'][number]
export type CollectionDetails = bp.actions.getCollectionDetails.output.Output['collectionDetails']
export type ItemOutput = bp.actions.listItems.output.Output['items'][number]
export type ItemInput = bp.actions.createItems.input.Input['items'][number]
export type Pagination = bp.actions.listItems.input.Input['pagination']
