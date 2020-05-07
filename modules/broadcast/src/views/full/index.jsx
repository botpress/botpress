//Errors

import { toastFailure } from 'botpress/utils'
import React from 'react'
import ReactDOM from 'react-dom'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'

import { Panel, Table, Label } from 'react-bootstrap'
import {
  Navbar,
  Button,
  FormGroup,
  InputGroup,
  ControlGroup,
  Checkbox,
  Intent,
  Icon,
  Tooltip,
  Position,
  Alignment
} from '@blueprintjs/core'
import { DateInput, TimePicker } from '@blueprintjs/datetime'
import { Dialog } from 'botpress/shared'

import moment from 'moment'
import classnames from 'classnames'

import _ from 'lodash'

import DismissableAlert from './alert'

import style from './style.scss'

const convertHHmmToDate = time => {
  const HH = Number(time.split(':')[0])
  const mm = Number(time.split(':')[1])

  return new Date().setHours(HH, mm, 0)
}

export default class BroadcastModule extends React.Component {
  constructor(props) {
    super(props)

    // window.location = '#'
  }

  state = {
    loading: true,
    showModalForm: false,
    broadcast: {}
  }

  getAxios() {
    return this.props.bp.axios
  }

  componentDidMount() {
    this.fetchAllBroadcasts()
    this.props.bp.events.on('broadcast.changed', this.fetchAllBroadcasts)
  }

  componentWillUnmount() {
    this.props.bp.events.off('broadcast.changed', this.fetchAllBroadcasts)
  }

  fetchAllBroadcasts = () => {
    this.setState({ loading: true })

    return this.getAxios()
      .get('/mod/broadcast/')
      .then(res => {
        this.setState({
          loading: false,
          broadcasts: _.orderBy(res.data, ['date', 'time'])
        })
      })
      .catch(err => {
        this.setState({ loading: false })

        console.error(err)
        toastFailure("Can't fetch broadcast list from the server.")
      })
  }

  extractBroadcastFromModal() {
    const { content, date, userTimezone, time, filteringConditions } = this.state.broadcast

    if (!content) {
      toastFailure('Content field is required.')

      return
    }

    return {
      date: moment(date).format('YYYY-MM-DD'),
      time: moment(time).format('HH:mm'),
      content: content,
      timezone: userTimezone ? null : moment().format('Z'),
      filters: filteringConditions
    }
  }

  closeModal = () => {
    this.setState({ showModalForm: false, error: null })
    return Promise.resolve(true)
  }

  handleRequestError = err => {
    if (err && err.response) {
      return this.setState({
        loading: false,
        error: err.response.data.message
      })
    }

    this.setState({
      loading: false,
      error: err ? err.message : 'An unknown error occurred'
    })
  }

  handleAddBroadcast = () => {
    const broadcast = this.extractBroadcastFromModal()

    if (!broadcast) {
      return
    }

    this.getAxios()
      .put(`/mod/broadcast/`, broadcast)
      .then(this.fetchAllBroadcasts)
      .then(this.closeModal)
      .catch(this.handleRequestError)
  }

  handleModifyBroadcast = () => {
    const broadcast = this.extractBroadcastFromModal()
    const { broadcastId: id } = this.state

    if (!broadcast) {
      return
    }

    this.getAxios()
      .post('/mod/broadcast/', { id, ...broadcast })
      .then(this.fetchAllBroadcasts)
      .then(this.closeModal)
      .catch(this.handleRequestError)
  }

  handleRemoveBroadcast = id => {
    this.getAxios()
      .delete('/mod/broadcast/' + id)
      .then(this.fetchAllBroadcasts)
      .catch(this.handleRequestError)
  }

  handleCloseModalForm = () => this.setState({ showModalForm: false, broadcast: {} })

  handleOpenModalForm = (broadcast, id) => {
    if (!id) {
      id = null
    }

    if (!broadcast) {
      broadcast = {
        content: '',
        date: new Date(),
        time: new Date().setHours(12, 0, 0),
        progress: 0,
        userTimezone: true,
        filteringConditions: []
      }
    }

    this.setState({
      modifyBroadcast: !id ? false : true,
      showModalForm: true,

      broadcastId: id,
      broadcast: {
        content: broadcast.content,
        userTimezone: broadcast.userTimezone,
        date: broadcast.date,
        time: _.isString(broadcast.time) ? convertHHmmToDate(broadcast.time) : broadcast.time,
        filteringConditions: broadcast.filteringConditions,
        progress: broadcast.progress
      }
    })
  }

  handleContentChange = element => {
    const newBroadcast = this.state.broadcast
    newBroadcast.content = element.id
    this.setState({
      broadcast: newBroadcast
    })
  }

  handleDateChange = value => {
    const newBroadcast = this.state.broadcast
    newBroadcast.date = value
    this.setState({
      broadcast: newBroadcast
    })
  }

  handleTimeChange = value => {
    const newBroadcast = this.state.broadcast
    newBroadcast.time = value

    this.setState({
      broadcast: newBroadcast
    })
  }

  handleUserTimezoneChange = () => {
    const newBroadcast = this.state.broadcast
    newBroadcast.userTimezone = !newBroadcast.userTimezone
    this.setState({
      broadcast: newBroadcast
    })
  }

  handleAddToFilteringConditions = () => {
    const input = ReactDOM.findDOMNode(this.filterInput)
    if (input && input.value !== '') {
      ;``
      const newBroadcast = this.state.broadcast
      newBroadcast.filteringConditions = _.concat(newBroadcast.filteringConditions, input.value)

      this.setState({
        broadcast: newBroadcast
      })
      input.value = ''
    }
  }

  handleRemoveFromFilteringConditions = filter => {
    const newBroadcast = this.state.broadcast
    newBroadcast.filteringConditions = _.without(newBroadcast.filteringConditions, filter)

    this.setState({
      broadcast: newBroadcast
    })
  }

  renderTableHeader() {
    return (
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Content</th>
          <th>Filters</th>
          <th>Progress</th>
          <th>Action</th>
        </tr>
      </thead>
    )
  }

  renderBroadcasts(broadcasts) {
    const getDateFormatted = (time, date, userTimezone) => {
      const calendar = moment(date + ' ' + time, 'YYYY-MM-DD HH:mm').calendar()
      return calendar + (userTimezone ? ' (users time)' : ' (your time)')
    }

    const formatProgress = (progress, outboxed, errored) => {
      let color = '#90a9f4'
      let text = (progress * 100).toFixed(2) + '%'
      if (progress === 0) {
        text = outboxed ? 'Processing' : 'Not started'
        color = outboxed ? '#90a9f4' : '#e4e4e4'
      }
      if (progress === 1) {
        text = 'Done'
        color = '#6ee681'
      }
      if (errored) {
        text = 'Error'
        color = '#eb6f6f'
      }
      return (
        <div>
          <div className={style.dot} style={{ backgroundColor: color }} />
          {text}
        </div>
      )
    }

    const renderModificationButton = value => {
      return (
        <Tooltip content="Edit" position={Position.BOTTOM}>
          <Button className={style.smallButton} onClick={() => this.handleOpenModalForm(value, value.id)}>
            <Icon icon="edit" />
          </Button>
        </Tooltip>
      )
    }

    const renderFilteringCondition = filters => {
      if (_.isEmpty(filters)) {
        return 'No filter'
      }

      return <Label bsStyle="primary">{filters.length + ' filters'}</Label>
    }

    return _.mapValues(broadcasts, value => {
      return (
        <tr key={value.id}>
          <td style={{ width: '5%' }}>{value.id}</td>
          <td style={{ width: '22%' }} className={style.scheduledDate}>
            {getDateFormatted(value.time, value.date, value.userTimezone)}
          </td>
          <td style={{ maxWidth: '38%' }}>{value.content}</td>
          <td style={{ width: '7%' }}>{renderFilteringCondition(value.filteringConditions)}</td>
          <td style={{ width: '12%' }} className={style.progress}>
            {formatProgress(value.progress, value.outboxed, value.errored)}
          </td>
          <td style={{ width: '12%' }}>
            {!value.outboxed ? renderModificationButton(value) : null}
            <Tooltip content="Duplicate" position={Position.BOTTOM}>
              <Button className={style.smallButton} onClick={() => this.handleOpenModalForm(value)}>
                <Icon icon="duplicate" />
              </Button>
            </Tooltip>
            <Tooltip content="Delete" position={Position.BOTTOM}>
              <Button className={style.smallButton} onClick={() => this.handleRemoveBroadcast(value.id)}>
                <Icon icon="trash" />
              </Button>
            </Tooltip>
          </td>
        </tr>
      )
    })
  }

  renderTable(broadcasts) {
    return (
      <Table striped bordered condensed hover className={style.scheduledTable}>
        {this.renderTableHeader()}
        <tbody>{_.values(this.renderBroadcasts(broadcasts))}</tbody>
      </Table>
    )
  }

  renderEmptyMessage() {
    return (
      <div className={style.emptyMessage}>
        <h5>You have no broadcasts...</h5>
      </div>
    )
  }

  renderBroadcastsPanel(title, broadcasts) {
    return (
      <Panel>
        <Panel.Heading>{title}</Panel.Heading>
        <Panel.Body>{_.isEmpty(broadcasts) ? this.renderEmptyMessage() : this.renderTable(broadcasts)}</Panel.Body>
      </Panel>
    )
  }

  renderFormContent() {
    const pickContent = () => window.botpress.pickContent({}, this.handleContentChange)

    return (
      <FormGroup label="Content">
        <ControlGroup>
          <Button onClick={pickContent} text="Pick Content" />
          <InputGroup fill={true} id="input-content" readOnly={true} value={this.state.broadcast.content} />
        </ControlGroup>
      </FormGroup>
    )
  }

  renderFormDate() {
    const getDate = date => {
      return new Date(date)
    }

    return (
      <FormGroup label="Date" fill={true}>
        <DateInput
          onChange={this.handleDateChange}
          parseDate={str => new Date(str)}
          placeholder={'YYYY-MM-DD'}
          formatDate={d => moment(d).format('YYYY-MM-DD')}
          value={getDate(this.state.broadcast.date)}
        />
      </FormGroup>
    )
  }

  renderFormTime() {
    return (
      <FormGroup className={style.formTime} label="Time">
        <TimePicker onChange={this.handleTimeChange} value={new Date(this.state.broadcast.time)} />
      </FormGroup>
    )
  }

  renderFormUserTimezone() {
    return (
      <Checkbox
        className={style.formUserTimezone}
        checked={this.state.broadcast.userTimezone}
        onChange={this.handleUserTimezoneChange}
      >
        User time zone
      </Checkbox>
    )
  }

  renderFilteringConditionElement = filter => {
    const removeHandler = () => this.handleRemoveFromFilteringConditions(filter)

    return (
      <ControlGroup>
        <InputGroup fill={true} defaultValue={filter} readOnly />
        <Button className="pull-right" onClick={removeHandler}>
          <Icon icon="remove" />
        </Button>
      </ControlGroup>
    )
  }

  renderFiltering() {
    let filteringConditionElements = <div></div>

    const filters = this.state.broadcast.filteringConditions
    if (filters && !_.isEmpty(filters)) {
      filteringConditionElements = this.state.broadcast.filteringConditions.map(this.renderFilteringConditionElement)
    }

    return (
      <div>
        <FormGroup className={style.addFilters} label="Filters">
          <ControlGroup>
            <InputGroup fill={true} inputRef={input => (this.filterInput = input)} />
            <Button text="Add" onClick={() => this.handleAddToFilteringConditions()} />
          </ControlGroup>
        </FormGroup>
        <div className={style.filters}>{filteringConditionElements}</div>
      </div>
    )
  }

  renderForm() {
    return (
      <form>
        {this.renderFormContent()}
        <ControlGroup>
          {this.renderFormDate()}
          {this.renderFormTime()}
          {this.renderFormUserTimezone()}
        </ControlGroup>
        {this.renderFiltering()}
      </form>
    )
  }

  renderActionButton() {
    const onClickAction = this.state.modifyBroadcast ? this.handleModifyBroadcast : this.handleAddBroadcast
    const buttonName = this.state.modifyBroadcast ? 'Modify' : 'Create'

    return <Button intent={Intent.PRIMARY} text={buttonName} onClick={onClickAction} />
  }

  renderModalForm() {
    return (
      <div className={style.modal}>
        <Dialog.Wrapper
          title={this.state.modifyBroadcast ? 'Modify Broadcast' : 'Create Broadcast'}
          usePortal={false}
          isOpen={this.state.showModalForm}
          onClose={this.closeModal}
        >
          <Dialog.Body>{this.renderForm()}</Dialog.Body>
          <Dialog.Footer>
            <Button text="Cancel" onClick={this.handleCloseModalForm} />
            {this.renderActionButton()}
          </Dialog.Footer>
        </Dialog.Wrapper>
      </div>
    )
  }

  renderNavBar() {
    return (
      <Navbar>
        <Navbar.Group align={Alignment.RIGHT}>
          <Tooltip content="Create" position={Position.BOTTOM}>
            <Button icon="plus" intent={Intent.PRIMARY} onClick={() => this.handleOpenModalForm()} />
          </Tooltip>
        </Navbar.Group>
      </Navbar>
    )
  }

  renderErrorBox() {
    return <DismissableAlert />
  }

  render() {
    if (this.state.loading) {
      return null
    }

    const allBroadcasts = _.assign([], this.state.broadcasts)
    const hasSomeError = _.some(allBroadcasts, ['errored', true])

    const upcomingBroadcasts = _.remove(allBroadcasts, function(value) {
      const datetime = moment(value.date + ' ' + value.time, 'YYYY-MM-DD HH:mm')
      return datetime.isBefore(moment().add(3, 'days')) && datetime.isAfter(moment())
    })

    const pastBroadcasts = _.remove(allBroadcasts, function(value) {
      const datetime = moment(value.date + ' ' + value.time, 'YYYY-MM-DD HH:mm')
      return datetime.isBefore(moment()) && datetime.isAfter(moment().subtract(3, 'days'))
    })

    return (
      <div>
        {this.renderNavBar()}
        <Panel className={style.mainPanel}>
          {hasSomeError ? this.renderErrorBox() : null}
          {this.renderBroadcastsPanel('Upcoming (next 3 days)', upcomingBroadcasts)}
          {this.renderBroadcastsPanel('Past (last 3 days)', pastBroadcasts)}
          {this.renderBroadcastsPanel('Other broadcasts', allBroadcasts)}
        </Panel>
        {this.renderModalForm()}
      </div>
    )
  }
}
