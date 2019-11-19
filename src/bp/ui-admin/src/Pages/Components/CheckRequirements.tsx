import { Button, Callout } from '@blueprintjs/core'
import { ServerConfig } from 'common/typings'
import _ from 'lodash'
import React from 'react'
import { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

import { fetchServerConfig } from '../../reducers/server'

type Feature = 'redis' | 'pro' | 'monitoring' | 'alerting'

interface Props {
  requirements: Feature[]
  feature: Feature
  children: React.ReactNode

  messageReqMissing?: string
  messageDisabled?: string

  serverConfig?: ServerConfig
  serverConfigLoaded?: boolean
  fetchServerConfig: () => void
}

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
      await api.getSecured().post(`/admin/server/features/enable/${props.feature}`)
      toastSuccess(`Configuration updated successfully! Restart Botpress for changes to take effect`)
      props.fetchServerConfig()
    } catch (err) {
      toastFailure(`Could not update configuration: ${err.message}`)
    }
  }

  if (missingReq.length) {
    return (
      <div className="requirements">
        <Callout title="Missing requirements">
          {props.messageReqMissing || 'To use this feature, these features are also required:'}
          <div style={{ padding: '20px 0' }}>
            {missingReq.includes('pro') && <strong>Botpress Pro must be enabled with a valid license</strong>}
            {missingReq.includes('redis') && <strong>Redis must be enabled and correctly configured</strong>}
            {missingReq.includes('monitoring') && <strong>Monitoring must be enabled</strong>}
          </div>
        </Callout>
      </div>
    )
  }

  return isEnabled ? (
    <div>{props.children}</div>
  ) : (
    <div className="requirements">
      <Callout title="Feature disabled">
        {props.messageDisabled ||
          'To use this feature, click on the button below. A server restart will be required for changes to take effect.'}
        <div style={{ padding: '20px 0' }}>
          <Button onClick={enableFeature} text="Enable this feature" />
        </div>
      </Callout>
    </div>
  )
}

const mapStateToProps = state => ({
  serverConfig: state.server.serverConfig,
  serverConfigLoaded: state.server.serverConfigLoaded
})

export default connect(
  mapStateToProps,
  { fetchServerConfig }
)(CheckRequirements)
