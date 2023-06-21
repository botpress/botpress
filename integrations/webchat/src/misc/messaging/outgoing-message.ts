import { z } from 'zod'
import * as ct from './content-types'
import { triggerSchema } from './triggers'

const outgoingMessageSchema = z.union([
  ct.textSchema.extend({ type: z.literal('text') }),
  ct.imageSchema.extend({ type: z.literal('image') }),
  ct.cardSchema.extend({ type: z.literal('card') }),
  ct.carouselSchame.extend({ type: z.literal('carousel') }),
  ct.locationSchema.extend({ type: z.literal('location') }),
  ct.dropdownSchema.extend({ type: z.literal('dropdown') }),
  ct.singleChoiceSchema.extend({ type: z.literal('single-choice') }),
  ct.fileSchema.extend({ type: z.literal('file') }),
  ct.videoSchema.extend({ type: z.literal('video') }),
  ct.audioSchema.extend({ type: z.literal('audio') }),
  z.object({ type: z.literal('trigger'), trigger: triggerSchema }),
])

export type OutgoingMessage = z.infer<typeof outgoingMessageSchema>
