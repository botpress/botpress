import { HeaderButtonProps, lang, MainContent } from 'botpress/shared'
import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { flowEditorRedo, flowEditorUndo } from '~/actions'
import { canFlowRedo, canFlowUndo } from '~/reducers'

const WorkflowToolbar = props => {
  const tabs = [
    {
      id: 'workflow',
      title: lang.tr('workflow')
    }
  ]

  const buttons: HeaderButtonProps[] = [
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

  return <MainContent.Header tabs={tabs} buttons={buttons} />
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
