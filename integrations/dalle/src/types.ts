import * as botpress from '.botpress'
import { z } from "zod";

// Types
export type TGenerateImageOutput = botpress.actions.generateImage.output.Output
export type TDalleData = botpress.actions.generateImage.input.Input
export type TContext = botpress.configuration.Configuration

// Enums
export const SizeEnum = z.enum(['1024x1024', '1792x1024', '1024x1792']).describe('Size of the image to generate.')
export const defaultSize = SizeEnum.Enum['1024x1024']

export const QualityEnum = z.enum(['standard', 'hd']).describe('Quality of the image to generate.')
export const defaultQuality = QualityEnum.Enum.standard

export const ModelEnum = z.enum(['dall-e-3']).describe('Model to use.')
export const defaultModel = ModelEnum.Enum['dall-e-3']
