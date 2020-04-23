import { Button, Callout, Intent, Switch } from '@blueprintjs/core'
import { confirmDialog } from 'botpress/shared'
import { ModuleInfo } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { toastFailure, toastSuccess } from '~/utils/toaster'
import PageContainer from '~/App/PageContainer'

import api from '../../api'
import { fetchModules } from '../../reducers/modules'

interface Props {
  modules: ModuleInfo[]
  fetchModules: () => void
}

const Modules: FC<Props> = props => {
  const [rebootRequired, setRebootRequired] = useState(false)
  const [isRestarting, setRestart] = useState(false)

  useEffect(() => {
    props.fetchModules()
  }, [])

  if (!props.modules) {
    return null
  }

  useEffect(() => {
    if (!isRestarting) {
      return
    }

    const interval = setInterval(async () => {
      try {
        await api.getSecured({ toastErrors: false }).get('/status', { timeout: 500, baseURL: '/' })
        window.location.reload()
      } catch (err) {} // silent intended
    }, 1000)
    return () => clearInterval(interval)
  }, [isRestarting])

  const restartServer = async () => {
    try {
      if (
        await confirmDialog(
          'Are you sure? If you have multiple servers, they will all be restarted at the same time.',
          { acceptLabel: 'Restart server(s) now' }
        )
      ) {
        await api.getSecured().post(`/admin/server/rebootServer`)
        setRestart(true)
      }
    } catch (err) {
      toastFailure(err.message)
    }
  }

  const updateModuleStatus = async (moduleName: string, enabled: boolean) => {
    try {
      const { data } = await api.getSecured().post(`/modules/${moduleName}/enabled/${enabled}`)
      setRebootRequired(data.rebootRequired)
      props.fetchModules()
      toastSuccess('Module status updated successfully')
    } catch (err) {
      toastFailure(err.message)
    }
  }

  const unpackModule = async (moduleName: string) => {
    try {
      await api.getSecured().post(`/modules/${moduleName}/unpack`)
      toastSuccess('Module unpacked successfully')
      props.fetchModules()
    } catch (err) {
      toastFailure(err.message)
    }
  }

  const showModule = module => {
    return (
      <div className="moduleItem" key={module.name}>
        <div className="moduleItemSwitch">
          {!module.archived && (
            <Switch
              checked={module.enabled}
              onChange={e => updateModuleStatus(module.name, e.currentTarget.checked)}
              className="moduleItemSwitch"
            />
          )}
        </div>
        <div>
          <strong>{module.fullName || module.name}</strong>

          <p>
            {module.archived ? (
              <span>
                This module is compressed. Unpack it to display more informations{' '}
                <Button text="Unpack module" onClick={() => unpackModule(module.name)} />
              </span>
            ) : (
              module.description || 'No description available'
            )}
          </p>
        </div>
      </div>
    )
  }

  console.log(props.modules)
  return (
    <PageContainer
      title="Modules"
      helpText={
        <div>
          Changing the status of a module will update the module status in botpress.config.json. If cluster mode is
          disabled and Botpress is not in production mode, the module will be mounted or unmounted
        </div>
      }
      superAdmin
    >
      {rebootRequired && (
        <Callout intent={Intent.SUCCESS} style={{ marginBottom: 20 }}>
          Your Botpress configuration file was updated successfully. The server must be restarted for changes to take
          effect.
          <br />
          <br />
          <Button
            id="btn-restart"
            text={isRestarting ? 'Please wait...' : 'Restart server now'}
            disabled={isRestarting}
            onClick={restartServer}
            intent={Intent.PRIMARY}
            small
          />
        </Callout>
      )}
      <div>
        <h3>Stable Modules</h3>
        <div>{props.modules.filter(x => x.status !== 'experimental').map(module => showModule(module))}</div>
      </div>

      <div>
        <h3>Experimental Modules</h3>
        <p>
          Modules below are experimental and their use in production is not recommended, since they may change
          drastically before their official release. Migration will not be automatic when upgrading to a newer Botpress
          version. Use at your own risk.
        </p>
        <div>{props.modules.filter(x => x.status === 'experimental').map(module => showModule(module))}</div>
      </div>
    </PageContainer>
  )
}

const mapStateToProps = state => ({
  ...state.modules
})

export default connect(mapStateToProps, { fetchModules })(Modules)
