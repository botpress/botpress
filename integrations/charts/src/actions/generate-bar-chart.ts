import { buildChart, ChartConfig } from './utils'
import * as bp from '.botpress'

export const generateBarChart: bp.IntegrationProps['actions']['generateBarChart'] = async ({
  client,
  input,
  logger,
  type,
  ctx,
}) => {
  logger.forBot().debug('Generating bar chart', { input, type })

  const chartConfig: ChartConfig = {
    type: 'bar',
    data: {
      labels: input.xData,
      datasets: [
        {
          label: input.title || 'Bar Chart',
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

  const imageUrl = await buildChart({ chartConfig, botId: ctx.botId, client, fileName: 'bar_chart' })
  return { imageUrl }
}
