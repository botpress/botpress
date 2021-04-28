import { Button, Callout, Intent, Switch } from '@blueprintjs/core'
import { confirmDialog, lang, toast } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import api from '~/app/api'
import PageContainer from '~/app/common/PageContainer'
import { AppState } from '~/app/rootReducer'

import { ImportModal } from './ModuleUpload'
import { fetchModules } from './reducer'
import style from './style.scss'

type Props = ConnectedProps<typeof connector>

const Modules: FC<Props> = props => {
  const [rebootRequired, setRebootRequired] = useState(false)
  const [isRestarting, setRestart] = useState(false)
  const [isImportOpen, setImportOpen] = useState(false)

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
        await api.getSecured().post('/admin/management/rebootServer')
        setRestart(true)
      }
    } catch (err) {
      toast.failure(err.message)
    }
  }

  const updateModuleStatus = async (moduleName: string, enabled: boolean) => {
    try {
      const { data } = await api.getSecured().post(`/admin/management/modules/${moduleName}/enabled/${enabled}`)
      setRebootRequired(data.rebootRequired)
      props.fetchModules()
      toast.success('Module status updated successfully')
    } catch (err) {
      toast.failure(err.message)
    }
  }

  const unpackModule = async (moduleName: string) => {
    try {
      await api.getSecured().post(`/admin/management/modules/${moduleName}/unpack`)
      toast.success('Module unpacked successfully')
      props.fetchModules()
    } catch (err) {
      toast.failure(err.message)
    }
  }

  const showModule = module => {
    return (
      <div className={style.moduleItem} key={module.name}>
        <div className={style.moduleItemSwitch}>
          {!module.archived && (
            <Switch
              checked={module.enabled}
              onChange={e => updateModuleStatus(module.name, e.currentTarget.checked)}
              className={style.moduleItemSwitch}
            />
          )}
        </div>
        <div>
          <strong>{module.fullName || module.name}</strong>

          <p>
            {module.archived ? (
              <span>
                {lang.tr('admin.modules.unpackRequired')}{' '}
                <Button text={lang.tr('admin.modules.unpackModule')} onClick={() => unpackModule(module.name)} />
              </span>
            ) : (
              module.description || lang.tr('admin.modules.noDescription')
            )}
          </p>
        </div>
      </div>
    )
  }

  return (
    <PageContainer
      title={lang.tr('sideMenu.modules')}
      helpText={<div>{lang.tr('admin.modules.helpText')}</div>}
      superAdmin
    >
      {rebootRequired && (
        <Callout intent={Intent.SUCCESS} style={{ marginBottom: 20 }}>
          {lang.tr('admin.modules.rebootRequired')}
          <br />
          <br />
          <Button
            id="btn-restart"
            text={isRestarting ? lang.tr('pleaseWait') : lang.tr('admin.modules.restartNow')}
            disabled={isRestarting}
            onClick={restartServer}
            intent={Intent.PRIMARY}
            small
          />
        </Callout>
      )}
      <div>
        <div style={{ float: 'right' }}>
          <Button text={lang.tr('admin.modules.uploadModule')} icon="upload" onClick={() => setImportOpen(true)} />
        </div>
        <h3>{lang.tr('admin.modules.stable')}</h3>
        <div>
          {props.modules.filter(x => x.status !== 'experimental' && !x.archived).map(module => showModule(module))}
        </div>
      </div>

      <div>
        <h3>{lang.tr('admin.modules.experimental')}</h3>
        <p>{lang.tr('admin.modules.experimentalWarning')}</p>
        <div>{props.modules.filter(x => x.status === 'experimental').map(module => showModule(module))}</div>
      </div>

      <div>
        <h3>{lang.tr('admin.modules.compressed')}</h3>
        <div>{props.modules.filter(x => x.archived).map(module => showModule(module))}</div>
      </div>

      <ImportModal
        isOpen={isImportOpen}
        close={() => setImportOpen(false)}
        onImportCompleted={() => setRebootRequired(true)}
      />
    </PageContainer>
  )
}

const mapStateToProps = (state: AppState) => state.modules
const connector = connect(mapStateToProps, { fetchModules })

export default connector(Modules)
