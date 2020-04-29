import { toast, utils } from 'botpress/shared'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import {
  clearErrorSaveFlows,
  closeFlowNodeProps,
  flowEditorRedo,
  flowEditorUndo,
  refreshActions,
  refreshIntents,
  setDiagramAction,
  switchFlow
} from '~/actions'
import { Container } from '~/components/Shared/Interface'
import { isOperationAllowed } from '~/components/Shared/Utils/AccessControl'
import DocumentationProvider from '~/components/Util/DocumentationProvider'
import { getDirtyFlows, RootReducer } from '~/reducers'
import { UserReducer } from '~/reducers/user'

import Diagram from './diagram'
import SidePanel from './sidePanel'
import { PanelPermissions } from './sidePanel'
import { MutexInfo } from './sidePanel/Toolbar'
import SkillsBuilder from './skills'
import style from './style.scss'

const searchTag = '#search:'

type Props = {
  currentFlow: string
  showFlowNodeProps: boolean
  dirtyFlows: string[]
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
  flowsByName: _.Dictionary<FlowView>
} & RouteComponentProps

interface State {
  initialized: any
  readOnly: boolean
  panelPermissions: PanelPermissions[]
  mutexInfo: MutexInfo
  showSearch: boolean
  highlightFilter: string
}

class FlowBuilder extends Component<Props, State> {
  private diagram
  private userAllowed = false
  private hash = this.props.location.hash
  private highlightFilter = this.hash.startsWith(searchTag) ? this.hash.replace(searchTag, '') : ''

  state = {
    initialized: false,
    readOnly: false,
    panelPermissions: this.allPermissions,
    mutexInfo: undefined,
    showSearch: Boolean(this.highlightFilter),
    highlightFilter: this.highlightFilter
  }

  get allPermissions(): PanelPermissions[] {
    return ['create', 'rename', 'delete']
  }

  init() {
    if (this.state.initialized || !this.props.user || this.props.user.email == null) {
      return
    }
    this.userAllowed = isOperationAllowed({ operation: 'write', resource: 'bot.flows' })
    this.setState({
      initialized: true
    })
    if (!this.userAllowed) {
      this.freezeAll()
    }
  }

  freezeAll() {
    this.setState({
      readOnly: true,
      panelPermissions: []
    })
  }

  componentDidMount() {
    this.init()
    this.props.refreshActions()
    this.props.refreshIntents()
  }

  componentDidUpdate(prevProps: Props) {
    this.init()

    const { flow } = this.props.match.params as any
    const nextRouteFlow = `${flow}.flow.json`

    if (prevProps.currentFlow !== this.props.currentFlow) {
      this.pushFlowState(this.props.currentFlow)
    } else if (flow && prevProps.currentFlow !== nextRouteFlow) {
      this.props.switchFlow(nextRouteFlow)
    }

    if (!prevProps.errorSavingFlows && this.props.errorSavingFlows) {
      const { status, data } = this.props.errorSavingFlows
      const message = status === 403 ? 'studio.flow.unauthUpdate' : 'studio.flow.errorWhileSaving'
      toast.failure(message, data, { timeout: 'long', delayed: true, onDismiss: this.props.clearErrorSaveFlows })
    }

    const flowsHaveChanged = !_.isEqual(prevProps.flowsByName, this.props.flowsByName)
    const currentFlowHasSwitched = prevProps.currentFlow !== this.props.currentFlow
    if (flowsHaveChanged || currentFlowHasSwitched) {
      this.handleFlowFreezing()
    }
  }

  handleFlowFreezing() {
    if (!this.userAllowed) {
      this.freezeAll()
      return
    }

    const me = this.props.user.email

    const currentFlow = this.props.flowsByName[this.props.currentFlow]
    const { currentMutex } = (currentFlow || {}) as FlowView

    if (currentMutex && currentMutex.lastModifiedBy !== me && currentMutex.remainingSeconds) {
      this.setState({
        readOnly: true,
        panelPermissions: ['create'],
        mutexInfo: { currentMutex }
      })
      return
    }

    const someoneElseIsEditingOtherFlow = _.values(this.props.flowsByName).some(
      f => f.currentMutex && f.currentMutex.lastModifiedBy !== me && !!f.currentMutex.remainingSeconds
    )

    if (someoneElseIsEditingOtherFlow) {
      this.setState({
        readOnly: false,
        panelPermissions: ['create'],
        mutexInfo: { someoneElseIsEditingOtherFlow: true }
      })
      return
    }

    this.setState({
      readOnly: false,
      panelPermissions: this.allPermissions,
      mutexInfo: undefined
    })
  }

  handleFilterChanged = ({ target: { value: highlightFilter } }) => {
    const newUrl = this.props.location.pathname + searchTag + highlightFilter
    this.setState({ highlightFilter })
    this.props.history.replace(newUrl)
  }

  pushFlowState = flow => {
    const hash = this.state.showSearch ? searchTag + this.state.highlightFilter : ''
    this.props.history.push(`/flows/${flow.replace(/\.flow\.json$/i, '')}${hash}`)
  }

  hideSearch = () => {
    this.setState({ showSearch: false })
    this.props.history.replace(this.props.location.pathname)
  }

  render() {
    if (!this.state.initialized) {
      return null
    }

    const { readOnly, panelPermissions } = this.state

    const keyHandlers = {
      add: e => {
        e.preventDefault()
        this.props.setDiagramAction('insert_node')
      },
      undo: e => {
        e.preventDefault()
        this.props.flowEditorUndo()
      },
      redo: e => {
        e.preventDefault()
        this.props.flowEditorRedo()
      },
      find: e => {
        e.preventDefault()
        this.setState({ showSearch: !this.state.showSearch })
        const { pathname } = this.props.location
        this.props.history.replace(this.state.showSearch ? pathname + searchTag + this.state.highlightFilter : pathname)
      },
      save: e => {
        e.preventDefault()
        toast.info('studio.flow.nowSaveAuto')
      },
      delete: e => {
        if (!utils.isInputFocused()) {
          e.preventDefault()
          this.diagram.deleteSelectedElements()
        }
      },
      cancel: e => {
        e.preventDefault()
        this.props.closeFlowNodeProps()
        this.hideSearch()
      }
    }

    return (
      <Container keyHandlers={keyHandlers}>
        <SidePanel
          readOnly={this.state.readOnly}
          mutexInfo={this.state.mutexInfo}
          permissions={panelPermissions}
          onCreateFlow={name => {
            this.diagram.createFlow(name)
            this.props.switchFlow(`${name}.flow.json`)
          }}
        />
        <div className={style.diagram}>
          <Diagram
            readOnly={readOnly}
            showSearch={this.state.showSearch}
            hideSearch={this.hideSearch}
            ref={el => {
              if (!!el) {
                this.diagram = el.getWrappedInstance()
              }
            }}
            handleFilterChanged={this.handleFilterChanged}
            highlightFilter={this.state.highlightFilter}
          />
        </div>

        <DocumentationProvider file="main/dialog" />
        <SkillsBuilder />
      </Container>
    )
  }
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: state.flows.currentFlow,
  flowsByName: state.flows.flowsByName,
  showFlowNodeProps: state.flows.showFlowNodeProps,
  dirtyFlows: getDirtyFlows(state),
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
  refreshIntents
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(FlowBuilder))
