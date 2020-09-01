import { Tab, Tabs } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import React, { FC, useEffect, useState } from 'react'
import { FaSkullCrossbones } from 'react-icons/fa'
import { GiLoad } from 'react-icons/gi'
import { IoMdCloudDone } from 'react-icons/io'
import { RiLoader2Line } from 'react-icons/ri'

import { Test, TestResult } from '../../shared/typings'

import ConfusionMatrix from './confusionMatrix'
import NLUTests from './nluTests'
import Outliers from './outliers'
import Scatter from './scatter'
import SlotTests from './slotTests'

interface State {
  createModalVisible: boolean
  importModalVisible: boolean
  tests: Test[]
  testResults: _.Dictionary<TestResult>
  loading: boolean
  working: boolean
  currentTest?: Test
}

interface Props {
  bp: { axios: AxiosInstance }
  contentLang: string
  dataLoaded: boolean
}

const NLUVisusalisation: FC<any> = (props: Props, state: State) => {
  const [loadingDatasIcon, setLoadingDatasIcon] = useState(<GiLoad />)
  const [isLoaded, setIsloaded] = useState(false)
  useEffect(() => {
    async function loadDatas() {
      const { data } = await props.bp.axios.get('/mod/nlu-testing/loadDatas', { timeout: 0 })
      const jobId = data
      console.log('Job ID : ', jobId)
      setLoadingDatasIcon(<RiLoader2Line />)
      const interval = setInterval(async () => {
        const { data } = await props.bp.axios.get(`/mod/nlu-testing/long-jobs-status/${jobId}`)
        if (data.status === 'done') {
          console.log('Loading datas done')
          setLoadingDatasIcon(<IoMdCloudDone />)
          setIsloaded(true)
          clearInterval(interval)
        } else if (data.status === 'crashed') {
          console.error(`Loading datas crashed : ${data.error}`)
          setLoadingDatasIcon(<FaSkullCrossbones />)
          clearInterval(interval)
        } else {
          setLoadingDatasIcon(<RiLoader2Line />)
          console.log('Loading Datas ')
        }
      }, 1000)
    }
    loadDatas()
  }, [])

  return (
    <div>
      <div>Datas {loadingDatasIcon}</div>
      <Tabs animate={true} id="NLU">
        <Tab id="intents" title="Intent tests" panel={<NLUTests {...props} {...state} />} />
        <Tab id="slots" title="Slots tests" panel={<SlotTests {...props} {...state} />} />
        {isLoaded && <Tab id="Confusion Matrix" title="Confusion Matrix" panel={<ConfusionMatrix {...props} />} />}
        {isLoaded && <Tab id="Outliers" title="Outliers" panel={<Outliers {...props} />} />}
        {isLoaded && <Tab id="Scatter" title="Scatter" panel={<Scatter {...props} />} />}
        <Tabs.Expander />
      </Tabs>
    </div>
  )
}

export default NLUVisusalisation
