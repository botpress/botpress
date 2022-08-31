import React from 'react'
import ContentPickerWidget from 'botpress/content-picker'
import { Classes } from '@blueprintjs/core'
import classnames from 'classnames'
import _ from 'lodash'
import { TipLabel } from './TipLabel'
import style from './style.scss'

export class Email extends React.Component {
  state = {
    fromAddress: undefined,
    toAddress: undefined,
    ccAddress: undefined,
    bccAddress: undefined,
    subjectElement: undefined,
    contentElement: undefined
  }

  componentDidMount() {
    this.setStateFromProps()
  }

  setStateFromProps = () => {
    const data = this.props.initialData

    if (data) {
      this.setState({
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        ccAddress: data.ccAddress,
        bccAddress: data.bccAddress,
        subjectElement: data.subjectElement,
        contentElement: data.contentElement
      })
    }
  }

  componentDidUpdate() {
    if (this.isFormValid()) {
      this.props.onDataChanged && this.props.onDataChanged(this.state)
      this.props.onValidChanged && this.props.onValidChanged(true)
    }
  }

  isFormValid() {
    return (
      !_.isEmpty(this.state.subjectElement) &&
      !_.isEmpty(this.state.contentElement) &&
      !_.isEmpty(this.state.fromAddress) &&
      !_.isEmpty(this.state.toAddress)
    )
  }

  handleContentChange = item => {
    this.setState({ contentElement: item.id })
  }

  handleSubjectChange = item => {
    this.setState({ subjectElement: item.id })
  }

  render() {
    return (
      <>
        <div className={style.skillSection}>
          <div style={{ width: '45%' }}>
            <TipLabel
              htmlFor="fromAddress"
              labelText="From"
              tooltipText="The address from which the email will be sent"
            />
            <input
              className={classnames(Classes.INPUT, Classes.FILL)}
              id="fromAddress"
              name="fromAddress"
              type="text"
              value={this.state.fromAddress}
              placeholder="your@email.com"
              onChange={event => this.setState({ fromAddress: event.target.value })}
            />
          </div>
          <div style={{ width: '45%' }}>
            <TipLabel htmlFor="toAddress" labelText="To" tooltipText="The address to which the email will be sent" />
            <input
              className={classnames(Classes.INPUT, Classes.FILL)}
              id="toAddress"
              name="toAddress"
              type="text"
              value={this.state.toAddress}
              placeholder="your@email.com"
              onChange={event => this.setState({ toAddress: event.target.value })}
            />
          </div>
          <div style={{ width: '45%' }}>
            <TipLabel
              htmlFor="ccAddress"
              labelText="CC"
              tooltipText="CC the email to these email addresses. This field can be empty."
            />
            <input
              className={classnames(Classes.INPUT, Classes.FILL)}
              id="ccAddress"
              name="ccAddress"
              type="text"
              value={this.state.ccAddress}
              placeholder="your@email.com"
              onChange={event => this.setState({ ccAddress: event.target.value })}
            />
          </div>
          <div style={{ width: '45%' }}>
            <TipLabel
              htmlFor="fromAddress"
              labelText="BCC"
              tooltipText="BCC the email to these email addresses. This field can be empty."
            />
            <input
              className={classnames(Classes.INPUT, Classes.FILL)}
              id="bccAddress"
              name="bccAddress"
              type="text"
              value={this.state.bccAddress}
              placeholder="your@email.com"
              onChange={event => this.setState({ bccAddress: event.target.value })}
            />
          </div>
        </div>
        <div>
          <TipLabel
            htmlFor="subjectPicker"
            labelText="Subject Line"
            tooltipText="The email's subject line (pick a CMS element)"
          />
          <ContentPickerWidget
            style={{ zIndex: 0 }}
            name="subjectPicker"
            id="subjectPicker"
            itemId={this.state.subjectElement}
            onChange={this.handleSubjectChange}
            placeholder="Pick Subject Line"
          />
        </div>
        <div>
          <TipLabel
            htmlFor="contentPicker"
            labelText="Email Content"
            tooltipText="The email's actual content (pick a CMS element)"
          />
          <ContentPickerWidget
            style={{ zIndex: 0 }}
            name="contentPicker"
            id="contentPicker"
            itemId={this.state.contentElement}
            onChange={this.handleContentChange}
            placeholder="Pick Email Content"
          />
        </div>
      </>
    )
  }
}
