import { confirmDialog, Dialog, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { Component } from 'react'
import { Button, OverlayTrigger, Radio, Tooltip } from 'react-bootstrap'
import Markdown from 'react-markdown'
import { connect } from 'react-redux'
import ContentPickerWidget from '~/components/Content/Select/Widget'
import { LinkDocumentationProvider } from '~/components/Util/DocumentationProvider'
import { RootReducer } from '~/reducers'

import style from './style.scss'
import ParametersTable from './ParametersTable'
import SelectActionDropdown from './SelectActionDropdown'

interface OwnProps {
  show: boolean
  layoutv2?: boolean
  onSubmit: any
  onClose: any
}

type StateProps = ReturnType<typeof mapStateToProps>

type Props = StateProps & OwnProps

interface State {
  actionType: string
  avActions: any[]
  actionMetadata: any
  functionInputValue: any
  isEdit: boolean
  messageValue: string
  functionParams: any
  paramsDef: any
}

class ActionModalForm extends Component<Props, State> {
  private parametersTable: any

  state: State = {
    actionType: 'message',
    avActions: [],
    actionMetadata: {},
    functionInputValue: '',
    messageValue: '',
    functionParams: {},
    isEdit: false,
    paramsDef: undefined
  }

  textToItemId = text => _.get(text.match(/^say #!(.*)$/), '[1]')

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { item } = nextProps

    if (this.props.show || !nextProps.show) {
      return
    }

    if (item) {
      this.setState({
        actionType: nextProps.item.type,
        functionInputValue:
          this.state.avActions && this.state.avActions.find(x => x.value === nextProps.item.functionName),
        messageValue: nextProps.item.message,
        functionParams: nextProps.item.parameters
      })
    } else {
      this.resetForm()
    }
    this.setState({ isEdit: Boolean(item) })
  }

  componentDidMount() {
    if (this.props.layoutv2) {
      this.setState({ actionType: 'code' })
    }

    this.prepareActions()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.actions !== this.props.actions) {
      this.prepareActions()
    }
  }

  prepareActions() {
    this.setState({
      avActions: (this.props.actions || []).map(x => {
        return {
          label: x.name,
          value: x.name,
          metadata: { params: x.params, title: x.title, description: x.description, category: x.category }
        }
      })
    })
  }

  onChangeType = type => () => {
    this.setState({ actionType: type })
  }

  resetForm() {
    this.setState({
      actionType: 'message',
      functionInputValue: '',
      messageValue: ''
    })
  }

  renderSectionAction() {
    const { avActions } = this.state

    const tooltip = <Tooltip id="notSeeingAction">{lang.tr('studio.flow.node.actionsRegisteredOnServer')}</Tooltip>

    const tooltip2 = <Tooltip id="whatIsThis">{lang.tr('studio.flow.node.youCanChangeActions')}</Tooltip>

    const help = (
      <OverlayTrigger placement="bottom" overlay={tooltip}>
        <span className={style.tip}>{lang.tr('studio.flow.node.cantSeeActions')}</span>
      </OverlayTrigger>
    )

    const paramsHelp = <LinkDocumentationProvider file="main/memory" />

    const onParamsChange = params => {
      params = _.values(params).reduce((sum, n) => {
        if (n.key === '') {
          return sum
        }
        return { ...sum, [n.key]: n.value }
      }, {})
      this.setState({ functionParams: params })
    }

    // const args = JSON.stringify(this.state.functionParams, null, 4)

    return (
      <div>
        <h5>{lang.tr('studio.flow.node.actionToRun', { help })}</h5>
        <div className={style.section}>
          <SelectActionDropdown
            id="select-action"
            value={this.state.functionInputValue}
            options={avActions}
            onChange={val => {
              const fn = avActions.find(fn => fn.value === (val && val.value))
              const paramsDefinition = _.get(fn, 'metadata.params') || []
              this.setState({
                functionInputValue: val,
                paramsDef: paramsDefinition,
                actionMetadata: fn.metadata || {}
              })

              // TODO Detect if default or custom arguments
              if (
                Object.keys(this.state.functionParams || {}).length > 0 &&
                !confirmDialog(lang.tr('studio.flow.node.confirmOverwriteParameters'), {
                  acceptLabel: lang.tr('overwrite')
                })
              ) {
                return
              }

              this.setState({
                functionParams: _.fromPairs(paramsDefinition.map(param => [param.name, param.default || '']))
              })
            }}
          />
          {this.state.actionMetadata.title && <h4>{this.state.actionMetadata.title}</h4>}
          {this.state.actionMetadata.description && <Markdown source={this.state.actionMetadata.description} />}
        </div>
        <h5>
          {lang.tr('studio.flow.node.actionParameters')} {paramsHelp}
        </h5>
        <div className={style.section}>
          <ParametersTable
            ref={el => (this.parametersTable = el)}
            onChange={onParamsChange}
            value={this.state.functionParams}
            definitions={this.state.paramsDef}
          />
        </div>
      </div>
    )
  }

  renderSectionMessage() {
    const handleChange = item => {
      this.setState({ messageValue: `say #!${item.id}` })
    }

    const itemId = this.textToItemId(this.state.messageValue)

    return (
      <div>
        <h5>{lang.tr('studio.flow.node.message')}:</h5>
        <div className={style.section}>
          <ContentPickerWidget
            itemId={itemId}
            onChange={handleChange}
            placeholder={lang.tr('studio.flow.node.messageToSend')}
          />
        </div>
      </div>
    )
  }

  onSubmit = () => {
    this.resetForm()
    this.props.onSubmit &&
      this.props.onSubmit({
        type: this.state.actionType,
        functionName: this.state.functionInputValue && this.state.functionInputValue.value,
        message: this.state.messageValue,
        parameters: this.state.functionParams
      })
  }

  onClose = () => {
    this.props.onClose && this.props.onClose()
  }

  render() {
    return (
      <Dialog.Wrapper
        title={this.state.isEdit ? lang.tr('studio.flow.node.editAction') : lang.tr('studio.flow.node.addAction')}
        isOpen={this.props.show}
        onClose={this.onClose}
        onSubmit={this.onSubmit}
      >
        <Dialog.Body>
          {!this.props.layoutv2 ? (
            <div>
              <h5>{lang.tr('studio.flow.node.theBotWill')}:</h5>
              <div className={style.section}>
                <Radio checked={this.state.actionType === 'message'} onChange={this.onChangeType('message')}>
                  {lang.tr('studio.flow.node.saySomething')}
                </Radio>
                <Radio checked={this.state.actionType === 'code'} onChange={this.onChangeType('code')}>
                  {lang.tr('studio.flow.node.executeCode')} <LinkDocumentationProvider file="main/code" />
                </Radio>
              </div>
              {this.state.actionType === 'message' ? this.renderSectionMessage() : this.renderSectionAction()}
            </div>
          ) : (
            this.renderSectionAction()
          )}
        </Dialog.Body>
        <Dialog.Footer>
          <Button id="btn-cancel-action" onClick={this.onClose}>
            {lang.tr('cancel')}
          </Button>
          <Button id="btn-submit-action" type="submit" bsStyle="primary">
            {this.state.isEdit
              ? lang.tr('studio.flow.node.finishUpdateAction')
              : lang.tr('studio.flow.node.finishAddAction')}{' '}
            (Alt+Enter)
          </Button>
        </Dialog.Footer>
      </Dialog.Wrapper>
    )
  }
}

const mapStateToProps = (state: RootReducer) => ({
  actions: state.skills.actions?.filter(a => a.legacy)
})

export default connect(mapStateToProps, undefined)(ActionModalForm)
