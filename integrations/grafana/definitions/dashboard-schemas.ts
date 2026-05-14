import { z } from '@botpress/sdk'
import type { TextPanel, TimeSeriesPanel } from '../src/types/GrafanaDashboard'

export const gridPosSchema = z.object({
  h: z.number().optional(),
  w: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
})

export const textPanelSchema = z.object({
  type: z.literal('text'),
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
  mode: z.enum(['markdown', 'html', 'code']).default('markdown'),
  id: z.number().optional(),
  gridPos: gridPosSchema.optional(),
}) satisfies z.ZodType<Partial<TextPanel>>

export const datasourceSchema = z.object({ type: z.string(), uid: z.string() })

export const timeSeriesPanelSchema = z.object({
  type: z.literal('timeseries'),
  title: z.string().min(1),
  description: z.string().optional(),
  datasource: datasourceSchema.optional(),
  id: z.number().optional(),
  gridPos: gridPosSchema.optional(),
  targets: z.array(z.object({
    refId: z.string(),
    datasource: datasourceSchema.optional(),
    expr: z.string().optional(),
  })).optional(),
  fieldConfig: z.any().optional(),
  options: z.any().optional(),
}) satisfies z.ZodType<Partial<TimeSeriesPanel>>

export const panelSchema = z.discriminatedUnion('type', [textPanelSchema, timeSeriesPanelSchema])

export const createDashboardInputSchema = z.object({
  uid: z.string().min(1, 'Dashboard UID is required'),
  title: z.string().min(1, 'Title is required'),
  tags: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  editable: z.boolean().optional(),
  graphTooltip: z.number().optional(),
  time: z.object({ from: z.string(), to: z.string() }).optional(),
  timepicker: z.any().optional(),
  templating: z.any().optional(),
  annotations: z.any().optional(),
  refresh: z.string().optional(),
  schemaVersion: z.number().optional(),
  panels: z.array(panelSchema).optional(),
  folderUid: z.string().optional(),
})
