import { buildChart, ChartConfig } from './utils'
import * as bp from '.botpress'

export const generateDoughnutChart: bp.IntegrationProps['actions']['generateDoughnutChart'] = async ({
  client,
  input,
  logger,
  type,
  ctx,
}) => {
  logger.forBot().debug('Generating doughnut chart', { input, type })

  const chartConfig: ChartConfig = {
    type: 'doughnut',
    data: {
      labels: input.labels,
      datasets: [
        {
          label: input.title || 'Doughnut Chart',
          data: input.data!,
        },
      ],
    },
  }

  const imageUrl = await buildChart({ chartConfig, botId: ctx.botId, client, fileName: 'doughnut_chart' })
  return { imageUrl }
}
