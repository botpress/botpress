import { lang, MainContainer, utils } from 'botpress/shared'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import * as portals from 'react-reverse-portal'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import {
  changeContentLanguage,
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
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { Timeout, toastFailure, toastInfo } from '~/components/Shared/Utils'
import { isOperationAllowed } from '~/components/Shared/Utils/AccessControl'
import DocumentationProvider from '~/components/Util/DocumentationProvider'
import { RootReducer } from '~/reducers'

import withLanguage from '../../components/Util/withLanguage'
import { PanelPermissions } from '../FlowBuilder/sidePanel'
import SkillsBuilder from '../FlowBuilder/skills'
import style from '../FlowBuilder/style.scss'

import Diagram from './diagram'
import SidePanel from './sidePanel'

const CMS_LANG_KEY = `bp::${window.BOT_ID}::cmsLanguage`

interface OwnProps {
  currentMutex: any
}

interface LangProps {
  contentLang: string
  languages: string[]
  defaultLanguage: string
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps & LangProps & RouteComponentProps

const allActions: PanelPermissions[] = ['create', 'rename', 'delete']
const SEARCH_TAG = '#search:'

const FlowBuilder = (props: Props) => {
  const { flow } = props.match.params as any

  const getLang = () => {
    const lang = localStorage.getItem(CMS_LANG_KEY)
    return lang && props.languages.includes(lang) ? lang : props.contentLang
  }

  const diagram: any = useRef(null)
  const [showSearch, setShowSearch] = useState(false)
  const [readOnly, setReadOnly] = useState(false)
  const [flowPreview, setFlowPreview] = useState(true)
  const [currentLang, setCurrentLang] = useState(getLang())
  const [mutex, setMutex] = useState(null)
  const [actions, setActions] = useState(allActions)
  const [highlightFilter, setHighlightFilter] = useState('')
  const [topicQnA, setTopicQnA] = useState(null)

  const editorPortal = React.useMemo(() => portals.createHtmlPortalNode(), [])

  useEffect(() => {
    props.refreshActions()
    props.refreshIntents()
    props.refreshLibrary()

    if (!isOperationAllowed({ operation: 'write', resource: 'bot.flows' })) {
      setReadOnly(true)
      setActions([])
    }

    const { hash } = props.location
    setHighlightFilter(hash.startsWith(SEARCH_TAG) ? hash.replace(SEARCH_TAG, '') : '')
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
      const message = status === 403 ? lang.tr('studio.flow.unauthUpdate') : lang.tr('studio.flow.errorWhileSaving')
      toastFailure(message, Timeout.LONG, props.clearErrorSaveFlows, { delayed: true })
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

  const pushFlowState = flow =>
    props.history.push(`/oneflow/${flow.replace(/\.flow\.json/i, '')}${props.history.location.search}`)
  const pathName = window.location.pathname.split('/')
  const currentWorkflow = pathName.pop()
  let currentTopic = pathName.pop()
  const isQna = currentWorkflow === 'qna'

  currentTopic = currentTopic === 'oneflow' ? '' : currentTopic

  const keyHandlers = {
    add: e => {
      e.preventDefault()
      props.setDiagramAction('insert_node')
    },
    undo: e => {
      e.preventDefault()
      if (!isQna) {
        props.flowEditorUndo()
      }
    },
    redo: e => {
      e.preventDefault()
      if (!isQna) {
        props.flowEditorRedo()
      }
    },
    find: e => {
      e.preventDefault()
      setShowSearch(true)
    },
    'preview-flow': e => {
      e.preventDefault()
      setFlowPreview(true)
    },
    save: e => {
      e.preventDefault()
      toastInfo(lang.tr('studio.flow.nowSaveAuto'), Timeout.LONG)
    },
    delete: e => {
      if (!utils.isInputFocused()) {
        e.preventDefault()
        diagram.current?.deleteSelectedElements()
      }
    },
    cancel: e => {
      e.preventDefault()
      props.closeFlowNodeProps()
    }
  }

  const handleFilterChanged = (filter: string) => {
    setHighlightFilter(filter)

    const query = filter ? `${SEARCH_TAG}${filter}` : ''
    props.history.replace(`${props.location.pathname}${query}`)
  }

  const createFlow = name => {
    diagram.current.createFlow(name)
    props.switchFlow(`${name}.flow.json`)
  }

  return (
    <MainContainer keyHandlers={keyHandlers}>
      <SidePanel
        onDeleteSelectedElements={() => diagram.current?.deleteSelectedElements()}
        readOnly={readOnly}
        defaultLang={props.defaultLanguage}
        currentLang={currentLang}
        mutexInfo={mutex}
        permissions={actions}
        flowPreview={flowPreview}
        onCreateFlow={createFlow}
        selectedTopic={currentTopic}
        selectedWorkflow={currentWorkflow}
      />
      <div className={style.diagram}>
        <Diagram
          readOnly={readOnly}
          flowPreview={flowPreview}
          editorPortal={editorPortal}
          showSearch={showSearch}
          topicQnA={topicQnA}
          setCurrentLang={lang => {
            setCurrentLang(lang)
            props.changeContentLanguage(lang)
            localStorage.setItem(CMS_LANG_KEY, lang)
          }}
          languages={props.languages}
          defaultLang={props.defaultLanguage}
          currentLang={currentLang}
          hideSearch={() => setShowSearch(false)}
          handleFilterChanged={handleFilterChanged}
          highlightFilter={highlightFilter}
          selectedTopic={currentTopic}
          selectedWorkflow={currentWorkflow}
          childRef={el => {
            if (!!el) {
              diagram.current = el
            }
          }}
        />
      </div>

      <portals.InPortal node={editorPortal}>
        <WrappedEditor />
      </portals.InPortal>

      <DocumentationProvider file="flows" />
      <SkillsBuilder />
    </MainContainer>
  )
}

const WrappedEditor = props => {
  return <InjectedModuleView moduleName="code-editor" componentName="LiteEditor" extraProps={props} />
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: state.flows.currentFlow,
  flowsByName: state.flows.flowsByName,
  user: state.user,
  errorSavingFlows: state.flows.errorSavingFlows
})

const mapDispatchToProps = {
  changeContentLanguage,
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

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(withLanguage(FlowBuilder)))
