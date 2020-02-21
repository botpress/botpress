import { Button, Switch, Tooltip } from '@blueprintjs/core'
import { ModuleInfo } from 'common/typings'
import React, { FC, useEffect } from 'react'
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
  useEffect(() => {
    props.fetchModules()
  }, [])

  if (!props.modules) {
    return null
  }

  const updateModuleStatus = async (moduleName: string, enabled: boolean) => {
    try {
      await api.getSecured().post(`/modules/${moduleName}/enabled/${enabled}`)
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

  return (
    <PageContainer
      title="Modules"
      helpText={
        <div>
          Changing the status of a module will update the module status in botpress.config.json. If cluster mode is
          disabled and Botpress is not in production mode, the module will be mounted or unmounted
        </div>
      }
      superAdmin={true}
    >
      {props.modules.map(module => (
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
      ))}
    </PageContainer>
  )
}

const mapStateToProps = state => ({
  ...state.modules
})

export default connect(
  mapStateToProps,
  { fetchModules }
)(Modules)
