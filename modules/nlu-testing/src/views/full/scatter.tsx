import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import Plot from 'react-plotly.js'

const Scatter = props => {
  const [scatEmb, setScatEmb] = useState([])

  useEffect(() => {
    async function scatterEmbeddings() {
      const { data } = await props.bp.axios.get('/mod/nlu-testing/scatterEmbeddings', { timeout: 0 })
      setScatEmb(data)
    }
    scatterEmbeddings()
  }, [props.dataLoaded])

  return (
    <Plot
      data={scatEmb}
      config={{ responsive: true }}
      style={{ width: '100%', height: '100%' }}
      layout={{
        autosize: true,
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
    />
  )
}
export default Scatter
