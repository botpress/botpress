import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { setActiveView, updateCode } from '~/actions'
import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { getCurrentFlowNode, RootReducer } from '~/reducers'
import { ViewType } from '~/reducers/ui'

import style from './style.scss'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps

const CodeEditor: FC<Props> = ({
  activeView,
  template,
  setActiveView,
  updateCode,
  currentCode,
  editorCallback,
  currentFlowNode
}) => {
  const visible = activeView === ViewType.CodeEditor
  const title = currentFlowNode ? `${lang.tr(currentFlowNode.type)}: ${currentFlowNode.name}` : ''

  const onClose = () => {
    editorCallback(currentCode)
    setActiveView('diagram')
  }

  return (
    <div className={cx(style.codeEditor, { [style.hidden]: !visible })}>
      <div className={style.header}>
        <div className={style.title}>{title}</div>
        <div className={style.actions}>
          <Button onClick={onClose} text={lang.tr('close')}></Button>
        </div>
      </div>
      <WrappedEditor
        code={currentCode}
        template={template}
        onChange={code => updateCode(code)}
        customKey={`${currentFlowNode?.name}${visible}`}
      />
    </div>
  )
}

const WrappedEditor = props => {
  return <InjectedModuleView moduleName="code-editor" componentName="LiteEditor" extraProps={props} />
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlowNode: getCurrentFlowNode(state),
  activeView: state.ui.activeView,
  template: state.codeEditor.template,
  editorCallback: state.codeEditor.editorCallback,
  currentCode: state.codeEditor.code
})

const mapDispatchToProps = {
  setActiveView,
  updateCode
}

export default connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(CodeEditor)
