import { FormGroup, Icon, InputGroup, Position, Tooltip } from '@blueprintjs/core'
import { ContentForms, Dropdown, lang } from 'botpress/shared'
import { stat } from 'fs'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { closeFlowNodeProps, copyFlowNode, fetchPrompts, pasteFlowNode, refreshFlowsLinks, updateFlow } from '~/actions'
import withLanguage from '~/components/Util/withLanguage'
import { getCurrentFlow, getCurrentFlowNode, RootReducer } from '~/reducers'
import EditableInput from '~/views/FlowBuilder/common/EditableInput'

import InputParams from '../../diagram/TriggerEditor/Condition/InputParams'

import style from './style.scss'

interface OwnProps {
  onDeleteSelectedElements: () => void
  readOnly: boolean
  subflows: any
  contentLang: string
  defaultLanguage: string
  updateNode: any
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

export interface FormState {
  contentType: string
  error: any
}

function PromptNodeReducer(state, action) {
  const { type, data } = action
  if (type === 'setInitialPrompt') {
    return { ...state, ...data }
  } else if (type === 'changePromptType') {
    return { ...state, type: data, params: {} }
  } else if (type === 'setOutput') {
    return { ...state, output: data }
  } else if (type === 'setConfig') {
    return { ...state, config: data }
  } else if (type === 'updateQuestion') {
    return { ...state, question: { ...state.question, [data.lang]: data.question } }
  } else if (type === 'updateConfirm') {
    return { ...state, confirm: { ...state.confirm, [data.lang]: data.confirm } }
  } else if (type === 'updateParam') {
    return { ...state, params: { ...state.params, ...data } }
  } else {
    return state
  }
}

const SubWorkflowNode: FC<Props> = props => {
  const { currentFlowNode, readOnly } = props
  const [promptTypes, setPromptTypes] = useState<any>()

  const [state, dispatch] = React.useReducer(PromptNodeReducer, {
    type: undefined,
    output: undefined,
    params: {},
    question: undefined,
    confirm: undefined
  })

  useEffect(() => {
    setPromptTypes([
      { label: 'Select one', value: '' },
      ...props.prompts.map(x => ({ label: x.config.label, value: x.id }))
    ])
  }, [props.prompts])

  useEffect(() => {
    if (!props.prompts.length) {
      props.fetchPrompts()
    }

    if (!props.currentFlowNode.prompt) {
      return
    }

    const { type, output, params, question, confirm } = props.currentFlowNode.prompt

    dispatch({ type: 'setInitialPrompt', data: { type, output: output || '', params, question, confirm } })
  }, [props.currentFlowNode.id])

  useEffect(() => {
    if (!props.prompts.length) {
      return
    }

    dispatch({ type: 'setConfig', data: props.prompts.find(x => x.id === state.type)?.config })
  }, [state.type, props.prompts])

  useEffect(() => {
    if (!state.type || !state.output) {
      return
    }

    const { type, output, params, question } = props.currentFlowNode.prompt

    if (state.type !== type || state.output !== output || state.params !== params || state.question !== question) {
      props.updateNode({
        prompt: {
          params: state.params,
          type: state.type,
          output: state.output,
          question: state.question,
          confirm: state.confirm
        }
      })
    }
  }, [state.type, state.params, state.output, state.question, state.confirm])

  const renameNode = text => {
    if (text) {
      const alreadyExists = props.currentFlow.nodes.find(x => x.name === text)

      if (!alreadyExists) {
        props.updateNode({ name: text })
      }
    }
  }

  const transformText = text => {
    return text.replace(/[^a-z0-9-_\.]/gi, '_')
  }

  const updateOutput = option => {
    dispatch({ type: 'setOutput', data: option.currentTarget.value })
  }

  const updateParam = param => {
    dispatch({ type: 'updateParam', data: param })
  }

  const onPromptSelected = option => {
    dispatch({ type: 'changePromptType', data: option.value })
  }

  const updateQuestion = event => {
    dispatch({ type: 'updateQuestion', data: { lang: props.contentLang, question: event.currentTarget.value } })
  }

  const updateConfirm = event => {
    dispatch({ type: 'updateConfirm', data: { lang: props.contentLang, confirm: event.currentTarget.value } })
  }

  if (!promptTypes) {
    return null
  }

  return (
    <Fragment>
      <div className={style.formHeader}>
        <h4>Prompt</h4>
      </div>
      <label className={style.fieldWrapper}>
        <span className={style.formLabel}>Node Name</span>
        <EditableInput
          readOnly={readOnly}
          value={currentFlowNode.name}
          className={style.textInput}
          onChanged={renameNode}
          transform={transformText}
        />
      </label>

      <div className={style.fieldWrapper}>
        <span className={style.formLabel}>Prompt Type</span>
        <Dropdown
          items={promptTypes}
          defaultItem={promptTypes?.find(x => x.value === state.type)}
          onChange={onPromptSelected}
        />
      </div>

      <div className={style.fieldWrapper}>
        <span className={style.formLabel}>
          Question to ask{' '}
          <Tooltip
            content="This question will only be asked if the variable has no value or isn't confident enough"
            position={Position.BOTTOM}
          >
            <Icon icon="help"></Icon>
          </Tooltip>
        </span>
        <InputGroup
          value={state.question?.[props.contentLang || props.defaultLanguage]}
          onChange={updateQuestion}
        ></InputGroup>

        <br></br>
      </div>

      <div className={style.fieldWrapper}>
        <span className={style.formLabel}>
          Confirmation question{' '}
          <Tooltip
            content="Ask to validate the provided answer if confidence is less than 50%"
            position={Position.BOTTOM}
          >
            <Icon icon="help"></Icon>
          </Tooltip>
        </span>
        <InputGroup
          value={state.confirm?.[props.contentLang || props.defaultLanguage]}
          onChange={updateConfirm}
        ></InputGroup>

        <br></br>
      </div>

      <div className={style.fieldWrapper}>
        <span className={style.formLabel}>Output Variable</span>
        <InputGroup value={state.output} onChange={updateOutput}></InputGroup>
      </div>

      {state.config && state.config.fields && (
        <div className={style.fieldWrapper}>
          <span className={style.formLabel}>Configuration & Validation</span>

          {console.log(state.config)}

          <ContentForms.Form
            fields={state.config.fields}
            advancedSettings={state.config.advancedSettings}
            bp={undefined}
            formData={state.params}
            contentType={undefined}
            onUpdate={updateParam}
          />

          <br></br>
        </div>
      )}
    </Fragment>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state) as any,
  prompts: state.ndu.prompts,
  user: state.user
})

const mapDispatchToProps = {
  updateFlow,
  closeFlowNodeProps,
  refreshFlowsLinks,
  copyFlowNode,
  pasteFlowNode,
  fetchPrompts
}

export default connect(mapStateToProps, mapDispatchToProps)(withLanguage(SubWorkflowNode))
