import { HeaderButtonProps, lang, MainContent } from 'botpress/shared'
import _ from 'lodash'
import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { fetchLicensing, flowEditorRedo, flowEditorUndo } from '~/actions'
import { canFlowRedo, canFlowUndo } from '~/reducers'

import style from './style.scss'

const WorkflowToolbar = ({
  licensing,
  fetchLicensing,
  languages,
  addVariable,
  canAdd,
  canRedo,
  canUndo,
  currentLang,
  currentTab,
  redo,
  setCurrentLang,
  tabChange,
  undo
}) => {
  useEffect(() => {
    if (!licensing) {
      fetchLicensing()
    }
  }, [])

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

  if (!licensing?.isPro) {
    languesTooltip = lang.tr('toolbar.contactSalesForMultilingual')
  } else if (languages?.length <= 1) {
    languesTooltip = lang.tr('toolbar.configureAnotherLanguage')
  }

  const flowButtons: HeaderButtonProps[] = [
    {
      icon: 'undo',
      disabled: !canUndo,
      tooltip: lang.tr('undo'),
      onClick: undo
    },
    {
      icon: 'redo',
      disabled: !canRedo,
      tooltip: lang.tr('redo'),
      onClick: redo
    }
  ]

  const variableButtons: HeaderButtonProps[] = []

  if (canAdd) {
    variableButtons.push({
      icon: 'plus',
      tooltip: lang.tr('addVariable'),
      onClick: () => addVariable()
    })
  }

  const buttons: HeaderButtonProps[] = [
    {
      icon: 'translate',
      optionsItems: languages?.map(language => ({
        label: lang.tr(`isoLangs.${language}.name`),
        selected: currentLang === language,
        action: () => {
          setCurrentLang(language)
        }
      })),
      disabled: languages?.length <= 1,
      tooltip: languesTooltip
    },
    ...(currentTab === 'variables' ? variableButtons : flowButtons)
  ]

  return (
    <MainContent.Toolbar
      className={style.header}
      tabs={tabs}
      currentTab={currentTab}
      buttons={buttons}
      tabChange={tabChange}
    />
  )
}

const mapStateToProps = state => ({
  licensing: state.core.licensing,
  canUndo: canFlowUndo(state),
  canRedo: canFlowRedo(state)
})

const mapDispatchToProps = {
  fetchLicensing,
  undo: flowEditorUndo,
  redo: flowEditorRedo
}

export default connect(mapStateToProps, mapDispatchToProps)(WorkflowToolbar)
