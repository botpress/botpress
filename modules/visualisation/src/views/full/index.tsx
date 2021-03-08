import { Checkbox } from '@blueprintjs/core'
import { Container } from 'botpress/ui'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import Plot from 'react-plotly.js'
import { createInterface } from 'readline'

import { PredRes } from '../../backend/typings'

import style from './style.scss'

const NewQnA = props => {
  const [resEmb, setResEmb] = useState([])
  const [scatEmb, setScatEmb] = useState([])
  // const [scatTsneEmb, setScatTsneEmb] = useState([])
  const [CF, setCF] = useState([])
  const [intentCF, setIntentCF] = useState([])
  const [clusterScore, setClusterScore] = useState({})

  const computeOutliers = async () => {
    const { data } = await props.bp.axios.get('/mod/new_qna/computeOutliers')
    // console.log(data)
    setClusterScore(data)
  }

  const similarityEmbeddings = async () => {
    console.log('testing embeddings')
    const { data } = await props.bp.axios.get('/mod/new_qna/similarityEmbeddings', { timeout: 0 })
    console.log(data)
    setResEmb(data)
  }

  const computeIntentsSimilarity = async () => {
    console.log('testing intents')
    const { data } = await props.bp.axios.get('/mod/new_qna/similarityIntents', { timeout: 0 })
    setIntentCF(data)
  }

  const loadDatas = async () => {
    console.log('Loading Datas')
    const { data } = await props.bp.axios.get('/mod/new_qna/loadDatas', { timeout: 0 })
    console.log('Done')
  }

  const scatterEmbeddings = async () => {
    console.log('scaterring embeddings')
    const { data } = await props.bp.axios.get('/mod/new_qna/scatterEmbeddings', { timeout: 0 })
    setScatEmb(data)
  }

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
    setCF([
      {
        x: allIntents,
        y: allIntents,
        z: zTransposeNorm,
        text: textTranspose,
        type: 'heatmap'
      }
    ])
  }

  const confusionMatrix = async () => {
    const { data } = await props.bp.axios.get('/mod/new_qna/confusionMatrix', { timeout: 0 })
    const jobId = data
    console.log('Job ID : ', jobId)
    const interval = setInterval(async () => {
      const { data } = await props.bp.axios.get(`/mod/new_qna/long-jobs-status/${jobId}`)
      if (data.status === 'done') {
        console.log('Confusion Matrix done')
        clearInterval(interval)
        try {
          createCM(data.data)
        } catch (e) {
          console.log(e)
        }
      } else if (data.status === 'crashed') {
        console.error(`Confusion Matrix crashed : ${data.error}`)
        clearInterval(interval)
      } else {
        console.log('Computing Confusion Matrix ')
        try {
          createCM(data.data)
        } catch (e) {
          console.log(e)
        }
      }
    }, 5000)
  }

  return (
    <Container sidePanelHidden>
      <div />
      <div className={style.main}>
        <button onClick={confusionMatrix}>Compute confusion Matrix</button>
        <button onClick={similarityEmbeddings}>Similarity Embeddings</button>
        <button onClick={scatterEmbeddings}>Scatter Embeddings</button>
        {/* <button onClick={scatterTsneEmbeddings}>Scatter Tsne Embeddings</button> */}
        <button onClick={computeOutliers}>Compute Outliers</button>
        <button onClick={loadDatas}>Load Datas</button>
        <button onClick={computeIntentsSimilarity}>Compute Intents Similarity</button>
        <h2> Scatter</h2>
        <Plot
          data={scatEmb}
          layout={{
            title: {
              text: 'Dimensionality reduction and scatter of intents embeddings',
              font: { family: 'Courier New, monospace', size: 24 },
              xref: 'paper',
              x: 0.05
            },
            xaxis: { automargin: true },
            yaxis: { automargin: true },
            colorway: [
              '#808080',
              '#FFFFE0',
              '#66CDAA',
              '#F08080',
              '#DC143C',
              '#FFA07A',
              '#00FFFF',
              '#FFDAB9',
              '#8B4513',
              '#FF4500',
              '#483D8B',
              '#AFEEEE',
              '#CD853F',
              '#ADFF2F',
              '#1E90FF',
              '#C0C0C0',
              '#CD5C5C',
              '#FFFAFA',
              '#696969',
              '#87CEFA',
              '#B0E0E6',
              '#32CD32',
              '#F4A460',
              '#F8F8FF',
              '#FF69B4',
              '#00FFFF',
              '#00FA9A',
              '#708090',
              '#8A2BE2',
              '#BC8F8F',
              '#B0C4DE',
              '#808000',
              '#6A5ACD',
              '#DCDCDC',
              '#B8860B',
              '#FFA500',
              '#FFF5EE',
              '#FAFAD2',
              '#0000CD',
              '#DDA0DD',
              '#F0FFF0',
              '#2E8B57',
              '#E6E6FA',
              '#FF7F50',
              '#F5F5DC',
              '#B22222',
              '#4682B4',
              '#FAF0E6',
              '#7B68EE',
              '#FFA07A',
              '#90EE90',
              '#008000',
              '#FFEBCD',
              '#FFFFF0',
              '#00FF00'
            ]
          }}
          config={{ responsive: true }}
          style={{ width: '100%', height: '100%' }}
        />

        <div>
          <Plot
            data={resEmb}
            layout={{
              title: {
                text: 'Cosine similarity for the mean of the embeddings per intent',
                font: { family: 'Courier New, monospace', size: 24 },
                xref: 'paper',
                x: 0.05
              },
              xaxis: { automargin: true, autosize: true, tickangle: -45 },
              yaxis: { automargin: true, autosize: true }
            }}
            config={{ responsive: true }}
            style={{ width: '100%', height: '1300px' }}
          />
        </div>
        <div>
          <Plot
            data={intentCF}
            layout={{
              title: {
                text: 'Kmeans for intents pairwise',
                font: { family: 'Courier New, monospace', size: 24 },
                xref: 'paper',
                x: 0.05
              },
              xaxis: { automargin: true, autosize: true, tickangle: 45 },
              yaxis: { automargin: true, autosize: true }
            }}
            config={{ responsive: true }}
            style={{ width: '100%', height: '1300px' }}
          />
        </div>
        <div>
          <Plot
            data={CF}
            layout={{
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
                autosize: true,
                tickangle: -90
              }
            }}
            config={{ responsive: true }}
            style={{ width: '100%', height: '1350px' }}
          />
        </div>
        <div style={{ marginTop: '50vh' }}></div>
        <h3>Outliers and possible clusters in intents </h3>
        <div>
          {_.toPairs(clusterScore).map(([k, v]: [string, { outliers: string[]; clusters: string[][] }]) => {
            return (
              <div>
                <h4>{k}</h4>
                <p> Outliers </p>
                <ul>
                  {v.outliers.map(s => (
                    <li>{s}</li>
                  ))}
                </ul>
                <p> Clusters </p>
                <ul>
                  {v.clusters.map((c, i) => (
                    <li>
                      <h6>{i}</h6>
                      <ul>
                        {c.map(s => (
                          <li>{s}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </Container>
  )
}
export default NewQnA
