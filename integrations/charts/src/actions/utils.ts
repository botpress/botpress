import { Client } from '@botpress/client'
import axios from 'axios'
import * as bp from '.botpress'

export const buildChart = async (props: { chartConfig: any; client: any; botId: string; fileName: string }) => {
  try {
    const response = await axios.get('https://quickchart.io/chart', {
      params: {
        key: bp.secrets.QUICKCHARTS_API_KEY,
        c: JSON.stringify(props.chartConfig),
      },
      responseType: 'arraybuffer',
    })

    const cloud = new Client({
      ...props.client.config,
      botId: props.botId,
    })

    const { file } = await cloud.uploadFile({
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
