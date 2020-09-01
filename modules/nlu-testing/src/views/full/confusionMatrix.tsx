import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import Plot from 'react-plotly.js'

import { PredRes } from '../../backend/typings'

const ConfusionMatrix = props => {
  const [CF, setCF] = useState([])

  const createCM = (datas: PredRes[]) => {
    const CM = {}
    const allIntents = Array.from(new Set(datas.map(o => o.pred).concat(datas.map(o => o.gt))))
    for (const intent of allIntents) {
      CM[intent] = {}
      for (const subIntent of allIntents) {
        CM[intent][subIntent] = { score: 0, utts: [] }
      }
    }

    for (const entry of datas) {
      CM[entry.pred][entry.gt]['score'] += 1
      if (!entry.acc) {
        CM[entry.pred][entry.gt]['utts'].push(entry.utt)
      }
    }

    const text = []
    const z = []
    for (const intent of allIntents) {
      const numberRow = []
      const textRow = []
      for (const subIntent of allIntents) {
        textRow.push(CM[intent][subIntent]['utts'].join('<br>'))
        numberRow.push(CM[intent][subIntent]['score'])
      }
      z.push(numberRow)
      text.push(textRow)
    }

    const zTranspose = z[0].map((_, colIndex) => z.map(row => row[colIndex]))
    const textTranspose = text[0].map((_, colIndex) => text.map(row => row[colIndex]))
    const zTransposeNorm = zTranspose.map(row => {
      const sumRow = _.sum(row)
      return row.map(elt => _.round(elt / (sumRow + Number.EPSILON), 2))
    })
    const matrix = [
      {
        x: allIntents,
        y: allIntents,
        z: zTransposeNorm,
        text: textTranspose,
        type: 'heatmap'
      }
    ]
    setCF([...matrix])
  }

  useEffect(() => {
    async function confusionMatrix() {
      const { data } = await props.bp.axios.get('/mod/nlu-testing/confusionMatrix', { timeout: 0 })
      const jobId = data
      console.log('Job ID : ', jobId)
      const interval = setInterval(async () => {
        const { data } = await props.bp.axios.get(`/mod/nlu-testing/long-jobs-status/${jobId}`)
        if (data.status === 'done') {
          console.log('Confusion Matrix done')
          clearInterval(interval)
          createCM(data.data)
        } else if (data.status === 'crashed') {
          console.error(`Confusion Matrix crashed : ${data.error}`)
          clearInterval(interval)
        } else {
          console.log('Computing Confusion Matrix ')
          createCM(data.data)
        }
      }, 20000)
    }
    confusionMatrix()
  }, [props.dataLoaded])

  return (
    <Plot
      data={CF}
      layout={{
        autosize: true,
        title: {
          text: 'Intents from nlu-tests confusion matrix ',
          font: { family: 'Courier New, monospace', size: 24 },
          xref: 'paper',
          x: 0.05
        },
        xaxis: {
          title: { text: 'Predicted', font: { family: 'Courier New, monospace', size: 18, color: '#7f7f7f' } },
          automargin: true,
          autosize: true,
          tickangle: -45
        },
        yaxis: {
          title: { text: 'Actual', font: { family: 'Courier New, monospace', size: 18, color: '#7f7f7f' } },
          automargin: true,
          autosize: true
        }
      }}
      config={{ responsive: true }}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
export default ConfusionMatrix
