import { Tab, Tabs } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { FaSkullCrossbones } from 'react-icons/fa'
import { GiLoad } from 'react-icons/gi'
import { IoMdCloudDone } from 'react-icons/io'
import { RiLoader2Line } from 'react-icons/ri'

import { DataResult, Test, TestResult } from '../../shared/typings'

import AccBars from './accBarsTab'
import ConfusionMatrix from './confusionMatrix'
import NLUTests from './nluTests'
import Outliers from './outliers'
import Scatter from './scatter'
import SimilarityEmbeddings from './similarityEmb'

const NLUVisusalisation: FC<any> = props => {
  const [dataResult, setDataResult] = useState(undefined)
  const onTestDone = res => {
    setDataResult(res)
  }
  const [loadingDatasIcon, setLoadingDatasIcon] = useState(<GiLoad />)
  const [dataLoaded, setDataLoaded] = useState(false)
  useEffect(() => {
    async function loadDatas() {
      const { data } = await props.bp.axios.get('/mod/nlu-testing/loadDatas', { timeout: 0 })
      const jobId = data
      setLoadingDatasIcon(<RiLoader2Line />)
      const interval = setInterval(async () => {
        const { data } = await props.bp.axios.get(`/mod/nlu-testing/long-jobs-status/${jobId}`)
        if (data.status === 'done') {
          setLoadingDatasIcon(<IoMdCloudDone />)
          setDataLoaded(true)
          clearInterval(interval)
        } else if (data.status === 'crashed') {
          console.error(`Loading datas crashed : ${data.error}`)
          setLoadingDatasIcon(<FaSkullCrossbones />)
          clearInterval(interval)
        } else {
          setLoadingDatasIcon(<RiLoader2Line />)
        }
      }, 1000)
    }
    loadDatas()
  }, [])

  return (
    <div>
      <div>Datas {loadingDatasIcon}</div>
      <Tabs animate={true} id="NLU">
        <Tab id="intents" title="Intent tests" panel={<NLUTests {...props} onTestDone={onTestDone} />} />
        {dataResult && (
          <Tab
            id="Confusion Matrix"
            title="Confusion Matrix"
            panel={<ConfusionMatrix {...props} dataResult={dataResult} />}
          />
        )}
        {dataResult && <Tab id="Bars" title="Bars" panel={<AccBars {...props} dataResult={dataResult} />} />}
        {dataLoaded && <Tab id="Outliers" title="Outliers" panel={<Outliers {...props} dataLoaded={dataLoaded} />} />}
        {dataLoaded && <Tab id="Scatter" title="Scatter" panel={<Scatter {...props} dataLoaded={dataLoaded} />} />}
        {dataLoaded && (
          <Tab id="Similarity" title="Similarity" panel={<SimilarityEmbeddings {...props} dataLoaded={dataLoaded} />} />
        )}
        <Tabs.Expander />
      </Tabs>
    </div>
  )
}

export default NLUVisusalisation
