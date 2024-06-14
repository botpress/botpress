import { buildChart, ChartConfig } from './utils'
import * as bp from '.botpress'

export const generatePieChart: bp.IntegrationProps['actions']['generatePieChart'] = async ({
  client,
  input,
  logger,
  type,
  ctx,
}) => {
  logger.forBot().debug('Generating pie chart', { input, type })

  const chartConfig: ChartConfig = {
    type: 'pie',
    data: {
      labels: input.labels,
      datasets: [
        {
          label: input.title || 'Pie Chart',
          data: input.data!,
        },
      ],
    },
  }

  const imageUrl = await buildChart({ chartConfig, botId: ctx.botId, client, fileName: 'pie_chart' })
  return { imageUrl }
}
