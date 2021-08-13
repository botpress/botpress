import { Button, Callout } from '@blueprintjs/core'
import { lang, toast } from 'botpress/shared'
import { ServerConfig } from 'common/typings'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import api from '~/app/api'
import LoadingSection from '~/app/common/LoadingSection'
import { fetchServerConfig } from '~/management/checklist/reducer'
import { AppState } from '../../rootReducer'
import style from './style.scss'

type Feature = 'redis' | 'pro' | 'monitoring' | 'alerting'

type Props = {
  requirements: Feature[]
  feature: Feature
  children: React.ReactNode

  messageReqMissing?: string
  messageDisabled?: string
} & ConnectedProps<typeof connector>

const featureStatus = (serverCfg: ServerConfig) => {
  return {
    redis: !!(_.get(serverCfg, 'env.REDIS_URL') && _.get(serverCfg, 'env.CLUSTER_ENABLED') === 'true'),
    pro: _.get(serverCfg, 'config.pro.enabled') || _.get(serverCfg, 'env.PRO_ENABLED') === 'true',
    monitoring: _.get(serverCfg, 'config.pro.monitoring.enabled'),
    alerting: _.get(serverCfg, 'config.pro.alerting.enabled')
  }
}

const CheckRequirements: FC<Props> = props => {
  const [isEnabled, setEnabled] = useState(false)
  const [missingReq, setMissingReq] = useState<Feature[]>([])

  useEffect(() => {
    if (props.serverConfigLoaded) {
      // Config is disabled, nothing returned from server. Skip requirement check
      if (!props.serverConfig) {
        setEnabled(true)
      } else {
        checkRequirements()
      }
    } else {
      props.fetchServerConfig()
    }
  }, [props.serverConfig])

  const checkRequirements = () => {
    const status = featureStatus(props.serverConfig!)
    setMissingReq(props.requirements.filter(x => !status[x]))
    setEnabled(status[props.feature])
  }

  const enableFeature = async () => {
    try {
      await api.getSecured().post(`/admin/management/features/enable/${props.feature}`)
      toast.success(lang.tr('admin.requirements.confUpdated'))
      props.fetchServerConfig()
    } catch (err) {
      toast.failure(lang.tr('admin.requirements.confNotUpdated', { msg: err.message }))
    }
  }

  if (missingReq.length) {
    return (
      <div className={style.requirements}>
        <Callout title={lang.tr('admin.requirements.missing')}>
          {props.messageReqMissing || lang.tr('admin.requirements.alsoRequired')}
          <div style={{ padding: '20px 0' }}>
            {missingReq.includes('pro') && <strong>{lang.tr('admin.requirements.pro')}</strong>}
            {missingReq.includes('redis') && <strong>{lang.tr('admin.requirements.redis')}</strong>}
            {missingReq.includes('monitoring') && <strong>{lang.tr('admin.requirements.monitoring')}</strong>}
          </div>
        </Callout>
      </div>
    )
  }

  if (!props.serverConfigLoaded) {
    return <LoadingSection />
  }

  return isEnabled ? (
    <div>{props.children}</div>
  ) : (
    <div className={style.requirements}>
      <Callout title={lang.tr('admin.requirements.featureDisabled')}>
        {props.messageDisabled || lang.tr('admin.requirements.toUseRestart')}
        <div style={{ padding: '20px 0' }}>
          <Button onClick={enableFeature} text={lang.tr('admin.requirements.enableFeature')} />
        </div>
      </Callout>
    </div>
  )
}

const mapStateToProps = (state: AppState) => ({
  serverConfig: state.checklist.serverConfig,
  serverConfigLoaded: state.checklist.serverConfigLoaded
})

const connector = connect(mapStateToProps, { fetchServerConfig })
export default connector(CheckRequirements)
