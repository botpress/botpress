import { Button, Spinner } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import { MainLayout, Textarea, lang } from 'botpress/shared'
import React, { FC, useState, useEffect } from 'react'
import style from './style.scss'

interface Props {
  bp: { axios: AxiosInstance; events: any }
  contentLang: string
}

const CorpusQA: FC<Props> = props => {
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [corpus, setCorpus] = useState('')

  useEffect(() => {
    props.bp.axios.get('/mod/unsupervised/corpus').then(({ data: { corpus } }) => {
      setCorpus(corpus)
      setLoading(false)
    })
  }, [])

  const updateCorpus = () => {
    setUpdating(true)
    props.bp.axios.post('/mod/unsupervised/corpus', { corpus }).then(() => setUpdating(false))
  }

  const onCorpusChanged = (text: string) => {
    setCorpus(text)
  }

  return (
    <MainLayout.Wrapper>
      <MainLayout.Toolbar tabs={[{ title: lang.tr('module.unsupervisedQA.fullName'), id: 'qa' }]} />
      <div className={style.content}>
        {loading && <Spinner />}
        {!loading && (
          <React.Fragment>
            <div className={style.textareaWrapper}>
              <Textarea
                className={style.textarea}
                onChange={onCorpusChanged}
                value={corpus}
                placeholder={lang.tr('module.unsupervisedQA.placeholder')}
                maxLength={50}
              />
              <Button
                onClick={updateCorpus}
                disabled={updating}
                text={updating ? lang.tr('module.unsupervisedQA.updating') : lang.tr('module.unsupervisedQA.update')}
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
