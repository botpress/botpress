import { buildChart, ChartConfig } from './utils'
import * as bp from '.botpress'

export const generateHorizontalBarChart: bp.IntegrationProps['actions']['generateHorizontalBarChart'] = async ({
  client,
  input,
  logger,
  type,
  ctx,
}) => {
  logger.forBot().debug('Generating horizontal bar chart', { input, type })

  const chartConfig: ChartConfig = {
    type: 'bar',
    data: {
      labels: input.xData,
      datasets: [
        {
          label: input.title || 'Horizontal Bar Chart',
          data: input.yData!,
        },
      ],
    },
    options: {
      indexAxis: 'y',
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

  const imageUrl = await buildChart({ chartConfig, botId: ctx.botId, client, fileName: 'horizontal_bar_chart' })
  return { imageUrl }
}
