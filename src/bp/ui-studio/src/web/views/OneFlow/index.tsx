import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import {
  clearErrorSaveFlows,
  closeFlowNodeProps,
  flowEditorRedo,
  flowEditorUndo,
  refreshActions,
  refreshIntents,
  refreshLibrary,
  setDiagramAction,
  switchFlow
} from '~/actions'
import { Container } from '~/components/Shared/Interface'
import { Timeout, toastFailure, toastInfo } from '~/components/Shared/Utils'
import { isOperationAllowed } from '~/components/Shared/Utils/AccessControl'
import DocumentationProvider from '~/components/Util/DocumentationProvider'
import { isInputFocused } from '~/keyboardShortcuts'
import { RootReducer } from '~/reducers'
import { UserReducer } from '~/reducers/user'

import { PanelPermissions } from '../FlowBuilder/sidePanel'
import SkillsBuilder from '../FlowBuilder/skills'
import style from '../FlowBuilder/style.scss'

import Diagram from './diagram'
import SidePanel from './sidePanel'

type Props = {
  currentFlow: string
  currentMutex: any
  user: UserReducer
  setDiagramAction: (action: string) => void
  switchFlow: (flowName: string) => void
  flowEditorUndo: () => void
  flowEditorRedo: () => void
  errorSavingFlows: any
  clearErrorSaveFlows: () => void
  clearFlowsModification: () => void
  closeFlowNodeProps: () => void
  refreshActions: () => void
  refreshIntents: () => void
  refreshLibrary: () => void
  flowsByName: _.Dictionary<FlowView>
} & RouteComponentProps

const allActions: PanelPermissions[] = ['create', 'rename', 'delete']

const FlowBuilder = (props: Props) => {
  const { flow } = props.match.params as any

  const diagram: any = useRef(null)
  const [showSearch, setShowSearch] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [flowPreview, setFlowPreview] = useState(true)
  const [mutex, setMutex] = useState()
  const [actions, setActions] = useState(allActions)

  useEffect(() => {
    props.refreshActions()
    props.refreshIntents()
    props.refreshLibrary()

    if (!isOperationAllowed({ operation: 'write', resource: 'bot.flows' })) {
      setReadOnly(true)
      setActions([])
    }
  }, [])

  useEffect(() => {
    props.currentFlow && pushFlowState(props.currentFlow)
  }, [props.currentFlow])

  useEffect(() => {
    const nextRouteFlow = `${flow}.flow.json`
    if (flow && props.currentFlow !== nextRouteFlow) {
      props.switchFlow(nextRouteFlow)
    }
  }, [flow])

  useEffect(() => {
    if (props.errorSavingFlows) {
      const { status } = props.errorSavingFlows
      const message =
        status === 403
          ? 'Unauthorized flow update. You have insufficient role privileges to modify flows.'
          : 'There was an error while saving, deleting or renaming a flow. Last modification might not have been saved on server. Please reload page before continuing flow edition'
      toastFailure(message, Timeout.LONG, props.clearErrorSaveFlows)
    }
  }, [props.errorSavingFlows])

  useEffect(() => {
    const me = props.user.email

    const currentFlow = props.flowsByName[props.currentFlow]
    const { currentMutex } = (currentFlow || {}) as FlowView

    if (currentMutex?.remainingSeconds && currentMutex.lastModifiedBy !== me) {
      setReadOnly(true)
      setActions(['create'])
      setMutex({ currentMutex })
      return
    }

    const someoneElseIsEditingOtherFlow = _.values(props.flowsByName).some(
      f => f.currentMutex?.remainingSeconds && f.currentMutex.lastModifiedBy !== me
    )

    setReadOnly(false)
    setMutex(undefined)

    if (someoneElseIsEditingOtherFlow) {
      setActions(['create'])
      setMutex({ someoneElseIsEditingOtherFlow: true })
    } else {
      setActions(allActions)
    }
  }, [props.flowsByName, props.currentFlow])

  const pushFlowState = flow => props.history.push(`/oneflow/${flow.replace(/\.flow\.json/i, '')}`)

  const keyHandlers = {
    add: e => {
      e.preventDefault()
      props.setDiagramAction('insert_node')
    },
    undo: e => {
      e.preventDefault()
      props.flowEditorUndo()
    },
    redo: e => {
      e.preventDefault()
      props.flowEditorRedo()
    },
    find: e => {
      e.preventDefault()
      setShowSearch(!showSearch)
    },
    'preview-flow': e => {
      e.preventDefault()
      setFlowPreview(true)
    },
    save: e => {
      e.preventDefault()
      toastInfo('Pssst! Flows now save automatically, no need to save anymore.', Timeout.LONG)
    },
    delete: e => {
      if (!isInputFocused()) {
        e.preventDefault()
        diagram?.deleteSelectedElements()
      }
    },
    cancel: e => {
      e.preventDefault()
      props.closeFlowNodeProps()
      setShowSearch(false)
    }
  }

  const createFlow = name => {
    diagram.createFlow(name)
    props.switchFlow(`${name}.flow.json`)
  }

  return (
    <Container keyHandlers={keyHandlers} sidePanelWidth={320}>
      <SidePanel
        readOnly={readOnly}
        mutexInfo={mutex}
        permissions={actions}
        flowPreview={flowPreview}
        onCreateFlow={createFlow}
      />
      <div className={style.diagram}>
        <Diagram
          readOnly={readOnly}
          flowPreview={flowPreview}
          showSearch={showSearch}
          hideSearch={() => setShowSearch(false)}
          ref={el => {
            if (!!el) {
              // @ts-ignore
              diagram = el.getWrappedInstance()
            }
          }}
        />
      </div>

      <DocumentationProvider file="flows" />
      <SkillsBuilder />
    </Container>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: state.flows.currentFlow,
  flowsByName: state.flows.flowsByName,
  user: state.user,
  errorSavingFlows: state.flows.errorSavingFlows
})

const mapDispatchToProps = {
  switchFlow,
  setDiagramAction,
  flowEditorUndo,
  flowEditorRedo,
  clearErrorSaveFlows,
  closeFlowNodeProps,
  refreshActions,
  refreshIntents,
  refreshLibrary
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(FlowBuilder))
