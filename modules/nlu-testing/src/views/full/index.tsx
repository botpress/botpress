import { Icon, Tab, Tabs } from '@blueprintjs/core'
import React, { FC, useEffect, useState } from 'react'

import { DataResult } from '../../shared/typings'

import AccBars from './accBarsTab'
import ConfusionMatrix from './confusionMatrix'
import NLUTests from './nluTests'
import Outliers from './outliers'
import Scatter from './scatter'
import SimilarityEmbeddings from './similarityEmb'

const NLUVisusalisation: FC<any> = props => {
  const [dataResult, setDataResult] = useState({} as DataResult)
  const onTestDone = res => {
    setDataResult(res)
  }
  const [loadingDatasIcon, setLoadingDatasIcon] = useState(<Icon icon="floppy-disk" />)
  const [dataLoaded, setDataLoaded] = useState(false)
  useEffect(() => {
    async function loadDatas() {
      const { data } = await props.bp.axios.post('/mod/nlu-testing/prepare-data', { timeout: 0 })
      const jobId = data

      setLoadingDatasIcon(<Icon icon="flash" />)

      const interval = setInterval(async () => {
        const { data } = await props.bp.axios.get(`/mod/nlu-testing/prepare-data/${jobId}`)

        if (data.status === 'done') {
          setLoadingDatasIcon(<Icon icon="tick-circle" />)
          setDataLoaded(true)
          clearInterval(interval)
        } else if (data.status === 'crashed') {
          console.error(`Loading datas crashed : ${data.error}`)
          setLoadingDatasIcon(<Icon icon="cross" />)
          clearInterval(interval)
        }
      }, 1000)
    }

    loadDatas()
      .then()
      .catch()
  }, [])

  return (
    <div>
      <div>Datas {loadingDatasIcon}</div>
      <Tabs animate={true} id="NLU">
        <Tab
          id="intents"
          title={
            <>
              <Icon icon="form" /> Intent tests
            </>
          }
          panel={<NLUTests {...props} onTestDone={onTestDone} />}
        />

        {Object.keys(dataResult).length > 0 && (
          <Tab
            id="Confusion Matrix"
            title={
              <>
                <Icon icon="heat-grid" /> Confusion Matrix{' '}
              </>
            }
            panel={<ConfusionMatrix {...props} dataResult={dataResult} />}
          />
        )}

        {Object.keys(dataResult).length > 0 && (
          <Tab
            id="Bars"
            title={
              <>
                <Icon icon="timeline-bar-chart" /> Bars
              </>
            }
            panel={<AccBars {...props} dataResult={dataResult} />}
          />
        )}

        {dataLoaded && (
          <Tab
            id="Outliers"
            title={
              <>
                <Icon icon="layout" /> Outliers
              </>
            }
            panel={<Outliers {...props} dataLoaded={dataLoaded} />}
          />
        )}

        {dataLoaded && (
          <Tab
            id="Scatter"
            title={
              <>
                <Icon icon="heatmap" /> Scatter
              </>
            }
            panel={<Scatter {...props} dataLoaded={dataLoaded} />}
          />
        )}

        {dataLoaded && (
          <Tab
            id="Similarity"
            title={
              <>
                <Icon icon="layout-auto" /> Similarity
              </>
            }
            panel={<SimilarityEmbeddings {...props} dataLoaded={dataLoaded} />}
          />
        )}
        <Tabs.Expander />
      </Tabs>
    </div>
  )
}

export default NLUVisusalisation
