import { buildChart, ChartConfig } from './utils'
import * as bp from '.botpress'

export const generateBubbleChart: bp.IntegrationProps['actions']['generateBubbleChart'] = async ({
  client,
  input,
  logger,
  type,
  ctx,
}) => {
  logger.forBot().debug('Generating bubble chart', { input, type })

  const chartConfig: ChartConfig = {
    type: 'bubble',
    data: {
      datasets: [
        {
          label: input.title || 'Bubble Chart',
          data: input.data!,
        },
      ],
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: input.xAxisTitle || 'X Axis',
          },
        },
        y: {
          title: {
            display: true,
            text: input.yAxisTitle || 'Y Axis',
          },
        },
      },
    },
  }

  const imageUrl = await buildChart({ chartConfig, botId: ctx.botId, client, fileName: 'bubble_chart' })
  return { imageUrl }
}
