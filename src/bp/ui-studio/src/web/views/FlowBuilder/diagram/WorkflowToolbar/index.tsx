import { HeaderButtonProps, lang, MainLayout } from 'botpress/shared'
import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { flowEditorRedo, flowEditorUndo } from '~/actions'
import { canFlowRedo, canFlowUndo } from '~/reducers'

import style from './style.scss'

const WorkflowToolbar = ({ canRedo, canUndo, currentTab, redo, tabChange, undo }) => {
  const tabs = [
    {
      id: 'workflow',
      title: lang.tr('workflow')
    }
  ]

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

  return (
    <MainLayout.Toolbar
      className={style.header}
      tabs={tabs}
      buttons={flowButtons}
      currentTab={currentTab}
      tabChange={tabChange}
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
