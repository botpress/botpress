import { z } from '@botpress/sdk'
import type { TextPanel, TimeSeriesPanel } from '../grafana-api/GrafanaDashboard'

export const gridPosSchema = z.object({
  h: z.number().optional().title('Height').describe('Panel height in grid units'),
  w: z.number().optional().title('Width').describe('Panel width in grid units'),
  x: z.number().optional().title('X').describe('Panel X position in grid units'),
  y: z.number().optional().title('Y').describe('Panel Y position in grid units'),
})

export const textPanelSchema = z.object({
  type: z.literal('text').title('Type').describe('Panel type — must be "text"'),
  title: z.string().min(1).title('Title').describe('Panel display title'),
  description: z.string().optional().title('Description').describe('Panel description shown as a tooltip'),
  content: z.string().optional().title('Content').describe('Text content to display in the panel'),
  mode: z
    .enum(['markdown', 'html', 'code'])
    .default('markdown')
    .title('Mode')
    .describe('Rendering mode for the content'),
  id: z.number().optional().title('ID').describe('Numeric panel ID (assigned by Grafana)'),
  gridPos: gridPosSchema.optional().title('Grid Position').describe('Position and size of the panel in the grid'),
}) satisfies z.ZodType<Partial<TextPanel>>

export const datasourceSchema = z.object({
  type: z.string().title('Type').describe('Datasource type (e.g. "prometheus")'),
  uid: z.string().title('UID').describe('Datasource UID'),
})

export const timeSeriesPanelSchema = z.object({
  type: z.literal('timeseries').title('Type').describe('Panel type — must be "timeseries"'),
  title: z.string().min(1).title('Title').describe('Panel display title'),
  description: z.string().optional().title('Description').describe('Panel description shown as a tooltip'),
  datasource: datasourceSchema.optional().title('Datasource').describe('Datasource to query'),
  id: z.number().optional().title('ID').describe('Numeric panel ID (assigned by Grafana)'),
  gridPos: gridPosSchema.optional().title('Grid Position').describe('Position and size of the panel in the grid'),
  targets: z
    .array(
      z.object({
        refId: z.string().title('Ref ID').describe('Query reference ID (e.g. "A")'),
        datasource: datasourceSchema.optional().title('Datasource').describe('Datasource override for this query'),
        expr: z.string().optional().title('Expression').describe('PromQL or query expression'),
      })
    )
    .optional()
    .title('Targets')
    .describe('Query targets for this panel'),
  fieldConfig: z.any().optional().title('Field Config').describe('Field display configuration'),
  options: z.any().optional().title('Options').describe('Panel display options'),
}) satisfies z.ZodType<Partial<TimeSeriesPanel>>

export const panelSchema = z.discriminatedUnion('type', [textPanelSchema, timeSeriesPanelSchema])

export const createDashboardInputSchema = z.object({
  uid: z.string().min(1, 'Dashboard UID is required').title('UID').describe('Unique identifier for the dashboard'),
  title: z.string().min(1, 'Title is required').title('Title').describe('Dashboard display name'),
  tags: z.array(z.string()).optional().title('Tags').describe('Tags to categorize the dashboard'),
  timezone: z
    .string()
    .optional()
    .title('Timezone')
    .describe('Dashboard timezone (e.g. "browser", "utc"). Defaults to "browser"'),
  editable: z.boolean().optional().title('Editable').describe('Whether the dashboard can be edited by viewers'),
  graphTooltip: z
    .number()
    .optional()
    .title('Graph Tooltip')
    .describe('Tooltip sharing mode: 0 = default, 1 = shared crosshair, 2 = shared tooltip'),
  time: z
    .object({ from: z.string(), to: z.string() })
    .optional()
    .title('Time Range')
    .describe('Default time range for the dashboard (e.g. { from: "now-6h", to: "now" })'),
  timepicker: z.any().optional().title('Time Picker').describe('Time picker configuration'),
  templating: z.any().optional().title('Templating').describe('Template variable definitions'),
  annotations: z.any().optional().title('Annotations').describe('Annotation query definitions'),
  refresh: z
    .string()
    .optional()
    .title('Refresh')
    .describe('Auto-refresh interval (e.g. "5s", "1m"). Leave empty to disable'),
  schemaVersion: z.number().optional().title('Schema Version').describe('Grafana dashboard schema version'),
  panels: z.array(panelSchema).optional().title('Panels').describe('List of panels on the dashboard'),
  folderUid: z.string().optional().title('Folder UID').describe('UID of the folder to place the dashboard in'),
})
