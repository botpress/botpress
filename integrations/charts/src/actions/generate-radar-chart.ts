import { buildChart, ChartConfig } from './utils'
import * as bp from '.botpress'

export const generateRadarChart: bp.IntegrationProps['actions']['generateRadarChart'] = async ({
  client,
  input,
  logger,
  type,
  ctx,
}) => {
  logger.forBot().debug('Generating radar chart', { input, type })

  const chartConfig: ChartConfig = {
    type: 'radar',
    data: {
      labels: input.labels,
      datasets: [
        {
          label: input.title || 'Radar Chart',
          data: input.data!,
        },
      ],
    },
    options: {
      scales: {
        r: {
          title: {
            display: true,
            text: input.axisTitle || 'Axis',
          },
        },
      },
    },
  }

  const imageUrl = await buildChart({ chartConfig, botId: ctx.botId, client, fileName: 'radar_chart' })
  return { imageUrl }
}
