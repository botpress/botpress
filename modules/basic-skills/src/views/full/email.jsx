import React from 'react'
import { Row, Col, Label, Input } from 'reactstrap'
import ContentPickerWidget from 'botpress/content-picker'
import { BotpressTooltip } from 'botpress/tooltip'
import _ from 'lodash'

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
      <div>
        <Row>
          <Col md={12}>
            <Label for="fromAddress">From</Label>
            &nbsp;
            <BotpressTooltip message="The address from which the email will be sent" />
            <Input
              id="fromAddress"
              name="fromAddress"
              type="text"
              value={this.state.fromAddress}
              placeholder="your@email.com"
              onChange={event => this.setState({ fromAddress: event.target.value })}
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Label for="toAddress">To</Label>
            &nbsp;
            <BotpressTooltip message="The address to which the email will be sent" />
            <Input
              id="toAddress"
              name="toAddress"
              type="text"
              value={this.state.toAddress}
              placeholder="your@email.com"
              onChange={event => this.setState({ toAddress: event.target.value })}
            />
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Label for="ccAddress">CC</Label>
            &nbsp;
            <BotpressTooltip message="CC the email to these email addresses. This field can be empty." />
            <Input
              id="ccAddress"
              name="ccAddress"
              type="text"
              value={this.state.ccAddress}
              placeholder="your@email.com"
              onChange={event => this.setState({ ccAddress: event.target.value })}
            />
          </Col>
          <Col md={6}>
            <Label for="fromAddress">BCC</Label>
            &nbsp;
            <BotpressTooltip message="BCC the email to these email addresses. This field can be empty." />
            <Input
              id="bccAddress"
              name="bccAddress"
              type="text"
              value={this.state.bccAddress}
              placeholder="your@email.com"
              onChange={event => this.setState({ bccAddress: event.target.value })}
            />
          </Col>
        </Row>
        <hr />
        <Row>
          <Col md={12}>
            <Label for="subjectPicker">Subject Line</Label>
            &nbsp;
            <BotpressTooltip message="The email's subject line (pick a CMS element)" />
            <ContentPickerWidget
              style={{ zIndex: 0 }}
              name="subjectPicker"
              id="subjectPicker"
              itemId={this.state.subjectElement}
              onChange={this.handleSubjectChange}
              placeholder="Pick Subject Line"
            />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Label for="contentPicker">Email Content</Label>
            &nbsp;
            <BotpressTooltip message="The email's actual content (pick a CMS element)" />
            <ContentPickerWidget
              style={{ zIndex: 0 }}
              name="contentPicker"
              id="contentPicker"
              itemId={this.state.contentElement}
              onChange={this.handleContentChange}
              placeholder="Pick Email Content"
            />
          </Col>
        </Row>
      </div>
    )
  }
}
