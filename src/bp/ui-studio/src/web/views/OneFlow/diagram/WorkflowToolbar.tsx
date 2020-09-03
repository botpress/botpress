import { HeaderButtonProps, lang, MainContent } from 'botpress/shared'
import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { flowEditorRedo, flowEditorUndo } from '~/actions'
import { canFlowRedo, canFlowUndo } from '~/reducers'

import style from './style.scss'

const WorkflowToolbar = props => {
  const { languages } = props
  const tabs = [
    {
      id: 'workflow',
      title: lang.tr('workflow')
    },
    {
      id: 'variables',
      title: lang.tr('variables')
    }
  ]

  let languesTooltip = lang.tr('translate')

  if (languages?.length <= 1) {
    languesTooltip = lang.tr('module.qna.form.onlyOneLanguage')
  }

  const flowButtons: HeaderButtonProps[] = [
    {
      icon: 'undo',
      disabled: !props.canUndo,
      tooltip: lang.tr('undo'),
      onClick: props.undo
    },
    {
      icon: 'redo',
      disabled: !props.canRedo,
      tooltip: lang.tr('redo'),
      onClick: props.redo
    }
  ]

  const variableButtons: HeaderButtonProps[] = []

  if (props.canAdd) {
    variableButtons.push({
      icon: 'plus',
      tooltip: lang.tr('addVariable'),
      onClick: () => props.addVariable()
    })
  }

  const buttons: HeaderButtonProps[] = [
    {
      icon: 'translate',
      optionsItems: languages?.map(language => ({
        label: lang.tr(`isoLangs.${language}.name`),
        selected: props.currentLang === language,
        action: () => {
          props.setCurrentLang(language)
        }
      })),
      disabled: languages?.length <= 1,
      tooltip: languesTooltip
    },
    ...(props.currentTab === 'variables' ? variableButtons : flowButtons)
  ]

  return (
    <MainContent.Header
      className={style.header}
      tabs={tabs}
      currentTab={props.currentTab}
      buttons={buttons}
      tabChange={props.tabChange}
    />
  )
}

const mapStateToProps = state => ({
  canUndo: canFlowUndo(state),
  canRedo: canFlowRedo(state)
})

const mapDispatchToProps = {
  undo: flowEditorUndo,
  redo: flowEditorRedo
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkflowToolbar)
