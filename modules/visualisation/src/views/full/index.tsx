import { Checkbox } from '@blueprintjs/core'
import { Container } from 'botpress/ui'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import Plot from 'react-plotly.js'

import style from './style.scss'

const NewQnA = props => {
  const [resEmb, setResEmb] = useState([])
  const [scatEmb, setScatEmb] = useState([])
  const [scatTsneEmb, setScatTsneEmb] = useState([])
  const [CF, setCF] = useState({ data: [], layout: {} })
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

  const scatterTsneEmbeddings = async () => {
    console.log('scaterring embeddings')
    const { data } = await props.bp.axios.get('/mod/new_qna/scatterTsneEmbeddings', { timeout: 0 })
    setScatTsneEmb(data)
  }

  const confusionMatrix = async () => {
    console.log('testing paris')
    const { data } = await props.bp.axios.get('/mod/new_qna/confusionMatrix', { timeout: 0 })
    const jobId = data
    console.log('Job ID', jobId)
    const interval = setInterval(async () => {
      const { data } = await props.bp.axios.get(`/mod/new_qna/long-jobs-status/${jobId}`)
      if (data.status === 'done') {
        setCF(data.data)
        clearInterval(interval)
      } else if (data.status === 'crashed') {
        console.error(`Tests crashed : ${data.error}`)
        clearInterval(interval)
      } else {
        console.log('computing')
        setCF(data.data)
      }
    }, 30000)
  }

  return (
    <Container sidePanelHidden>
      <div />
      <div className={style.main}>
        <button onClick={confusionMatrix}>Compute confusion Matrix</button>
        <button onClick={similarityEmbeddings}>Similarity Embeddings</button>
        <button onClick={scatterEmbeddings}>Scatter Embeddings</button>
        <button onClick={scatterTsneEmbeddings}>Scatter Tsne Embeddings</button>
        <button onClick={computeOutliers}>Compute Outliers</button>
        <button onClick={loadDatas}>Load Datas</button>
        <button onClick={computeIntentsSimilarity}>Compute Intents Similarity</button>
        <h2> Scatter</h2>
        <Plot
          data={scatEmb}
          layout={{
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
        <h2> Scatter TSNE</h2>
        <Plot
          data={scatTsneEmb}
          layout={{
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
        <h2> Result conf embed</h2>
        <div>
          <Plot
            data={resEmb}
            layout={{
              xaxis: { automargin: true, autosize: true, tickangle: -45 },
              yaxis: { automargin: true, autosize: true }
            }}
            config={{ responsive: true }}
            style={{ width: '100%', height: '1300px' }}
          />
        </div>
        <h2>Result sim Intents</h2>
        <div>
          <Plot
            data={intentCF}
            layout={{
              xaxis: { automargin: true, autosize: true, tickangle: -45 },
              yaxis: { automargin: true, autosize: true }
            }}
            config={{ responsive: true }}
            style={{ width: '100%', height: '1300px' }}
          />
        </div>
        <h2>Result Confusion Matrix</h2>
        <div>
          <Plot
            data={CF.data}
            layout={{
              xaxis: { automargin: true, autosize: true, tickangle: 45 },
              yaxis: { automargin: true, autosize: true }
            }}
            config={{ responsive: true }}
            style={{ width: '100%', height: '1350px' }}
          />
          {/* <Plot data={CF.data} layout={CF.layout} config={{ responsive: true }} /> */}
        </div>
        <div style={{ marginTop: '50vh' }}></div>
        <div>
          {_.toPairs(clusterScore).map(([k, v]: [string, { outliers: string[]; clusters: string[][] }]) => {
            // console.log('k', k, 'v', v)
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
          {/* return (
              <div>
                Outliers
                <ul>
                  {v.outliers.map(o => (
                    <li>{o}</li>
                  ))}
                </ul>
                Clusters
                {v.clusters.map((o, i) => (
                  <ul>
                    {i}
                    {o.map(s => (
                      <li>{s}</li>
                    ))}
                  </ul>
                ))}
              </div>
            ) */}
        </div>
      </div>
    </Container>
  )
}
export default NewQnA
