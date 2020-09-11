import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import Plot from 'react-plotly.js'

const SimilarityEmbeddings: FC<any> = props => {
  const [simEmb, setSimEmb] = useState([])

  useEffect(() => {
    async function similarityEmbeddings() {
      const { data } = await props.bp.axios.get('/mod/nlu-testing/similarityEmbeddings', { timeout: 0 })
      setSimEmb(data)
    }

    similarityEmbeddings()
      .then()
      .catch()
  }, [props.dataLoaded])

  if (!props.dataLoaded) {
    return <h3>Please wait for the data to be embeded</h3>
  }
  return <Plot data={simEmb} title={'Cosine similarity for the mean of the embeddings per intent'} />
}

export default SimilarityEmbeddings
