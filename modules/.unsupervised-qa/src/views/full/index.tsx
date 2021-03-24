import { Button, Spinner, Tooltip, Position } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import { MainLayout, Textarea, lang } from 'botpress/shared'
import React, { FC, useState, useEffect } from 'react'
import { ModuleStatus } from '../../typings'
import style from './style.scss'

interface Props {
  bp: { axios: AxiosInstance; events: any }
  contentLang: string
}

const CorpusQA: FC<Props> = props => {
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [corpus, setCorpus] = useState('')
  const [status, setStatus] = useState<ModuleStatus>({ modelLoaded: false, enabled: false })

  useEffect(() => {
    props.bp.axios.get('/mod/unsupervised/corpus').then(({ data: { corpus } }) => {
      setCorpus(corpus)
      setLoading(false)
    })

    props.bp.axios.get('/mod/unsupervised/status').then(({ data: status }) => {
      setStatus(status)
    })
  }, [])

  const updateCorpus = () => {
    setUpdating(true)
    props.bp.axios.post('/mod/unsupervised/corpus', { corpus }).then(() => setUpdating(false))
  }

  const onCorpusChanged = (text: string) => {
    setCorpus(text)
  }

  const renderModuleDisabled = () => {
    return (
      <div>
        <Tooltip content={lang.tr('module.unsupervised-qa.moduleDisabledReason')} position={Position.RIGHT}>
          <div className={style.red}>{lang.tr('module.unsupervised-qa.moduleDisabled')}</div>
        </Tooltip>
      </div>
    )
  }

  const renderModuleEnabled = () => {
    return (
      <React.Fragment>
        <div className={style.green}>{lang.tr('module.unsupervised-qa.moduleEnabled')}</div>
        {status.modelLoaded ? (
          <div className={style.green}>{lang.tr('module.unsupervised-qa.modelLoaded')}</div>
        ) : (
          renderModelLoading()
        )}
      </React.Fragment>
    )
  }

  const renderModelLoading = () => {
    return (
      <div className={style.modelLoading}>
        <div className={style.red}>{lang.tr('module.unsupervised-qa.modelLoading')}</div>
        <Spinner size={20}></Spinner>
      </div>
    )
  }

  return (
    <MainLayout.Wrapper>
      <MainLayout.Toolbar tabs={[{ title: lang.tr('module.unsupervised-qa.fullName'), id: 'qa' }]} />

      <div className={style.status}>
        <span className={style.title}>Status:</span>
        {status.enabled ? renderModuleEnabled() : renderModuleDisabled()}
      </div>

      <div className={style.content}>
        {loading && <Spinner />}
        {!loading && (
          <React.Fragment>
            <div className={style.textareaWrapper}>
              <Textarea
                className={style.textarea}
                onChange={onCorpusChanged}
                value={corpus}
                placeholder={lang.tr('module.unsupervised-qa.placeholder')}
                maxLength={50}
              />
              <Button
                onClick={updateCorpus}
                disabled={updating}
                text={updating ? lang.tr('module.unsupervised-qa.updating') : lang.tr('module.unsupervised-qa.update')}
                rightIcon={updating && <Spinner size={16} />}
              />
            </div>
          </React.Fragment>
        )}
      </div>
    </MainLayout.Wrapper>
  )
}

export default CorpusQA
