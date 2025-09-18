/**
 * Integration-specific model types for type-safe ModelRef usage
 * This file provides strongly-typed model references for all supported integrations
 * Types are derived from actual integration schemas to stay in sync
 */

import { z } from '@botpress/sdk'

// Import actual model schemas from integrations
import { ModelId as anthropicModelSchema } from '../../../integrations/anthropic/src/schemas'
import { modelId as cerebrasModelSchema } from '../../../integrations/cerebras/src/schemas'
import { languageModelId as fireworksModelSchema } from '../../../integrations/fireworks-ai/src/schemas'
import { ModelId as googleaiModelSchema } from '../../../integrations/google-ai/src/schemas'
import { modelId as groqModelSchema } from '../../../integrations/groq/src/schemas'
import { languageModelId as openaiModelSchema } from '../../../integrations/openai/src/schemas'

// Derive model types from actual schemas
export type OpenAIModelId = z.infer<typeof openaiModelSchema>
export type AnthropicModelId = z.infer<typeof anthropicModelSchema>
export type GoogleAIModelId = z.infer<typeof googleaiModelSchema>
export type GroqModelId = z.infer<typeof groqModelSchema>
export type CerebrasModelId = z.infer<typeof cerebrasModelSchema>
export type FireworksAIModelId = z.infer<typeof fireworksModelSchema>

// Integration-specific ModelRef types
export type OpenAIModelRef = `openai:${OpenAIModelId}`
export type AnthropicModelRef = `anthropic:${AnthropicModelId}`
export type GoogleAIModelRef = `google-ai:${GoogleAIModelId}`
export type GroqModelRef = `groq:${GroqModelId}`
export type CerebrasModelRef = `cerebras:${CerebrasModelId}`
export type FireworksAIModelRef = `fireworks-ai:${FireworksAIModelId}`

// Special model preferences
export type ModelPreference = 'best' | 'fast'

// Complete ModelRef type with all integrations
export type StronglyTypedModelRef =
  | OpenAIModelRef
  | AnthropicModelRef
  | GoogleAIModelRef
  | GroqModelRef
  | CerebrasModelRef
  | FireworksAIModelRef
  | ModelPreference

// Helper types for working with specific integrations
export type ModelRefFor<T extends string> = T extends 'openai'
  ? OpenAIModelRef
  : T extends 'anthropic'
    ? AnthropicModelRef
    : T extends 'google-ai'
      ? GoogleAIModelRef
      : T extends 'groq'
        ? GroqModelRef
        : T extends 'cerebras'
          ? CerebrasModelRef
          : T extends 'fireworks-ai'
            ? FireworksAIModelRef
            : never

// Extract integration name from ModelRef
export type IntegrationFromModelRef<T extends string> = T extends `${infer Integration}:${string}` ? Integration : never

// Extract model ID from ModelRef
export type ModelIdFromModelRef<T extends string> = T extends `${string}:${infer ModelId}` ? ModelId : never

// Utility functions for type-safe model handling
export const createModelRef = <T extends string, M extends string>(integration: T, modelId: M): `${T}:${M}` =>
  `${integration}:${modelId}` as const

// Type guards
export const isOpenAIModelRef = (ref: string): ref is OpenAIModelRef => ref.startsWith('openai:')

export const isAnthropicModelRef = (ref: string): ref is AnthropicModelRef => ref.startsWith('anthropic:')

export const isGoogleAIModelRef = (ref: string): ref is GoogleAIModelRef => ref.startsWith('google-ai:')

export const isGroqModelRef = (ref: string): ref is GroqModelRef => ref.startsWith('groq:')

export const isCerebrasModelRef = (ref: string): ref is CerebrasModelRef => ref.startsWith('cerebras:')

export const isFireworksAIModelRef = (ref: string): ref is FireworksAIModelRef => ref.startsWith('fireworks-ai:')

export const isModelPreference = (ref: string): ref is ModelPreference => ref === 'best' || ref === 'fast'

// Validation schemas using the actual imported schemas
export const OpenAIModelRefSchema = z
  .string()
  .refine(
    (val): val is OpenAIModelRef => val.startsWith('openai:') && openaiModelSchema.safeParse(val.slice(7)).success,
    { message: 'Invalid OpenAI model reference' }
  )

export const AnthropicModelRefSchema = z
  .string()
  .refine(
    (val): val is AnthropicModelRef =>
      val.startsWith('anthropic:') && anthropicModelSchema.safeParse(val.slice(10)).success,
    { message: 'Invalid Anthropic model reference' }
  )

export const GoogleAIModelRefSchema = z
  .string()
  .refine(
    (val): val is GoogleAIModelRef =>
      val.startsWith('google-ai:') && googleaiModelSchema.safeParse(val.slice(10)).success,
    { message: 'Invalid Google AI model reference' }
  )

export const GroqModelRefSchema = z
  .string()
  .refine((val): val is GroqModelRef => val.startsWith('groq:') && groqModelSchema.safeParse(val.slice(5)).success, {
    message: 'Invalid Groq model reference',
  })

export const CerebrasModelRefSchema = z
  .string()
  .refine(
    (val): val is CerebrasModelRef =>
      val.startsWith('cerebras:') && cerebrasModelSchema.safeParse(val.slice(9)).success,
    { message: 'Invalid Cerebras model reference' }
  )

export const FireworksAIModelRefSchema = z
  .string()
  .refine(
    (val): val is FireworksAIModelRef =>
      val.startsWith('fireworks-ai:') && fireworksModelSchema.safeParse(val.slice(13)).success,
    { message: 'Invalid Fireworks AI model reference' }
  )

export const StronglyTypedModelRefSchema = z.union([
  OpenAIModelRefSchema,
  AnthropicModelRefSchema,
  GoogleAIModelRefSchema,
  GroqModelRefSchema,
  CerebrasModelRefSchema,
  FireworksAIModelRefSchema,
  z.enum(['best', 'fast']),
])
