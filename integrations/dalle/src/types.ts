import { z } from 'zod'
import * as botpress from '.botpress'

// Types
export type GenerateImageOutput = botpress.actions.generateImage.output.Output
export type DalleData = botpress.actions.generateImage.input.Input

// Enums
export const sizeSchema = z.enum(['1024x1024', '1792x1024', '1024x1792']).describe('Size of the image to generate.')
export const defaultSize = sizeSchema.Enum['1024x1024']

export const QualityEnum = z.enum(['standard', 'hd']).describe('Quality of the image to generate.')
export const defaultQuality = QualityEnum.Enum.standard

export const ModelEnum = z.enum(['dall-e-3']).describe('Model to use.')
export const defaultModel = ModelEnum.Enum['dall-e-3']
