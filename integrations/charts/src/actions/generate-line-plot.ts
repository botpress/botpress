import { buildChart, ChartConfig } from './utils'
import * as bp from '.botpress'

export const generateLinePlot: bp.IntegrationProps['actions']['generateLinePlot'] = async ({
  client,
  input,
  logger,
  type,
  ctx,
}) => {
  logger.forBot().debug('Generating line plot', { input, type })

  const chartConfig: ChartConfig = {
    type: 'line',
    data: {
      labels: input.xData,
      datasets: [
        {
          label: input.title || 'Line Plot',
          data: input.yData!,
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

  const imageUrl = await buildChart({ chartConfig, botId: ctx.botId, client, fileName: 'line_plot' })
  return { imageUrl }
}
