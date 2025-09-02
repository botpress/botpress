import { z } from "@botpress/sdk"
import { CollectionDetailsSchema, CollectionSchema, fieldTypeSchema } from "./collectionSchema.js"

export type fieldType = z.infer<typeof fieldTypeSchema>
export type CollectionDetails = z.infer<typeof CollectionDetailsSchema>
export type Collection = z.infer<typeof CollectionSchema>
