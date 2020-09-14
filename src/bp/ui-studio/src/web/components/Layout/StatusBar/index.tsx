import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useReducer, useState } from 'react'
import { connect } from 'react-redux'

import style from './style.scss'
import ConfigStatus from './ConfigStatus'
import IssueForm from './IssueForm'
import LangSwitcher from './LangSwitcher'
import TrainingStatusComponent from './TrainingStatus'

interface Props {
  langSwitcherOpen: boolean
  user: any
  contentLang: string
  toggleLangSwitcher: (e: any) => void
}

export const formReducer = (state, action) => {
  if (action.type === 'update') {
    return {
      ...state,
      ...action.data
    }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

const StatusBar: FC<Props> = props => {
  const [state, dispatch] = useReducer(formReducer, { title: '', body: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  return (
    <footer className={style.statusBar}>
      <div className={style.item}>
        <span>
          {window.APP_VERSION}{' '}
          {window.USE_ONEFLOW && (
            <Fragment>
              {' '}
              <span className={style.betaTag}>Beta</span>
              <button onClick={() => setIsSubmitting(!isSubmitting)} className={style.issueBtn}>
                {lang.tr('issue.submitBug')}
              </button>
              {isSubmitting && (
                <IssueForm
                  formData={state}
                  onUpdate={value => dispatch({ type: 'update', data: value })}
                  close={() => {
                    this.timeout = setTimeout(() => {
                      setIsSubmitting(false)
                    }, 200)
                  }}
                />
              )}
            </Fragment>
          )}
        </span>
        <span className={style.botName}>{window.BOT_NAME}</span>
        {!window.USE_ONEFLOW && (
          <LangSwitcher toggleLangSwitcher={props.toggleLangSwitcher} langSwitcherOpen={props.langSwitcherOpen} />
        )}
      </div>
      <div className={style.item}>
        <TrainingStatusComponent />
        {props.user && props.user.isSuperAdmin && <ConfigStatus />}
      </div>
    </footer>
  )
}

const mapStateToProps = state => ({
  user: state.user,
  contentLang: state.language.contentLang
})

export default connect(mapStateToProps)(StatusBar)
