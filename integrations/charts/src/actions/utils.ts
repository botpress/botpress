import axios from 'axios'
import * as bp from '.botpress'

export type BuildChartProps = {
  chartConfig: any // TODO: type this properly
  client: bp.Client
  botId: string
  fileName: string
}
export const buildChart = async (props: BuildChartProps) => {
  try {
    const response = await axios.get('https://quickchart.io/chart', {
      params: {
        key: bp.secrets.QUICKCHARTS_API_KEY,
        c: JSON.stringify(props.chartConfig),
      },
      responseType: 'arraybuffer',
    })

    const { file } = await props.client.uploadFile({
      key: `${props.fileName}_${Date.now()}.png`,
      content: response.data,
      index: false,
    })

    return file.url!
  } catch (err) {
    console.error(`Error generating ${props.fileName}:`, err)
    throw err
  }
}
