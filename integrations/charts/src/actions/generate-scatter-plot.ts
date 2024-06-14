import { buildChart } from './utils'
import * as bp from '.botpress'

export const generateScatterPlot: bp.IntegrationProps['actions']['generateScatterPlot'] = async ({
  client,
  input,
  logger,
  type,
  ctx,
}) => {
  logger.forBot().debug('Generating scatter plot', { input, type })

  const chartConfig = {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: input.title || 'Scatter Plot',
          data: input.data, // input.data should be an array of objects with x and y properties
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

  const imageUrl = await buildChart({ chartConfig, botId: ctx.botId, client, fileName: 'scatter_plot' })
  return { imageUrl }
}
