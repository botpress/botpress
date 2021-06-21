import React from 'react'
import ReactDOM from 'react-dom'
import '@blueprintjs/datetime/lib/css/blueprint-datetime.css'

import {
  AnchorButton,
  Tag,
  Button,
  FormGroup,
  InputGroup,
  ControlGroup,
  Checkbox,
  Intent,
  Tooltip,
  Position,
  Card,
  Icon
} from '@blueprintjs/core'
import { DateInput, TimePicker } from '@blueprintjs/datetime'
import { Dialog, lang, toast } from 'botpress/shared'
import cx from 'classnames'

import moment from 'moment'

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
    return this.getAxios()
      .get('/mod/broadcast/')
      .then(res => {
        this.setState({
          broadcasts: _.orderBy(res.data, ['date', 'time'])
        })
      })
      .catch(err => {
        console.error(err)
        toast.failure(lang.tr('module.broadcast.cantFetchFromServer'))
      })
  }

  extractBroadcastFromModal() {
    const { content, date, userTimezone, time, filteringConditions } = this.state.broadcast

    if (!content) {
      toast.failure(lang.tr('module.broadcast.contentFieldRequired'))

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
        error: err.response.data.message
      })
    }

    this.setState({
      error: err ? err.message : lang.tr('module.broadcast.unknownErrorOccurred')
    })
  }

  handleAddBroadcast = () => {
    const broadcast = this.extractBroadcastFromModal()

    if (!broadcast) {
      return
    }

    this.getAxios()
      .post(`/mod/broadcast/create`, broadcast)
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
      .post('/mod/broadcast/update', { id, ...broadcast })
      .then(this.fetchAllBroadcasts)
      .then(this.closeModal)
      .catch(this.handleRequestError)
  }

  handleRemoveBroadcast = id => {
    this.getAxios()
      .post('/mod/broadcast/delete/' + id)
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
        date: moment(broadcast.date).toDate(),
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
          <th>{lang.tr('module.broadcast.table.date')}</th>
          <th>{lang.tr('module.broadcast.table.content')}</th>
          <th>{lang.tr('module.broadcast.table.filters')}</th>
          <th>{lang.tr('module.broadcast.table.progress')}</th>
          <th>{lang.tr('module.broadcast.table.action')}</th>
        </tr>
      </thead>
    )
  }

  renderBroadcasts(broadcasts) {
    const getDateFormatted = (time, date, userTimezone) => {
      const calendar = moment(date + ' ' + time, 'YYYY-MM-DD HH:mm').calendar()
      return (
        calendar + ` (${userTimezone ? lang.tr('module.broadcast.usersTime') : lang.tr('module.broadcast.yourTime')})`
      )
    }

    const formatProgress = (progress, outboxed, errored) => {
      let color = '#90a9f4'
      let text = (progress * 100).toFixed(2) + '%'
      if (progress === 0) {
        text = outboxed ? lang.tr('module.broadcast.processing') : lang.tr('module.broadcast.notStarted')
        color = outboxed ? '#90a9f4' : '#e4e4e4'
      }
      if (progress === 1) {
        text = lang.tr('module.broadcast.done')
        color = '#6ee681'
      }
      if (errored) {
        text = lang.tr('error')
        color = '#eb6f6f'
      }
      return (
        <div>
          <div className={style.dot} style={{ backgroundColor: color }} />
          {text}
        </div>
      )
    }

    const renderFilteringCondition = filters => {
      if (_.isEmpty(filters)) {
        return lang.tr('module.broadcast.noFilter')
      }

      return <Tag>{filters.length + ' ' + lang.tr('module.broadcast.filters')}</Tag>
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
            <div className={style.actions}>
              <Tooltip content={lang.tr('edit')} position={Position.BOTTOM}>
                <AnchorButton
                  icon="edit"
                  disabled={value.outboxed}
                  className={style.smallButton}
                  onClick={() => this.handleOpenModalForm(value, value.id)}
                />
              </Tooltip>
              <Tooltip content={lang.tr('duplicate')} position={Position.BOTTOM}>
                <AnchorButton
                  icon="duplicate"
                  className={style.smallButton}
                  onClick={() => this.handleOpenModalForm(value)}
                />
              </Tooltip>
              <Tooltip content={lang.tr('delete')} position={Position.BOTTOM}>
                <AnchorButton
                  icon="trash"
                  className={style.smallButton}
                  onClick={() => this.handleRemoveBroadcast(value.id)}
                />
              </Tooltip>
            </div>
          </td>
        </tr>
      )
    })
  }

  renderTable(broadcasts) {
    return (
      <table className={cx(style.table, 'bp3-html-table bp3-html-table-striped bp3-html-table-bordered')}>
        {this.renderTableHeader()}
        <tbody>{_.values(this.renderBroadcasts(broadcasts))}</tbody>
      </table>
    )
  }

  renderEmptyMessage() {
    return (
      <div className={style.emptyMessage}>
        <h5>{lang.tr('module.broadcast.youHaveNoBroadcasts')}</h5>
      </div>
    )
  }

  renderBroadcastsPanel(title, broadcasts) {
    return (
      <Card className={style.card} elevation={1}>
        <h5>{title}</h5>
        {_.isEmpty(broadcasts) ? this.renderEmptyMessage() : this.renderTable(broadcasts)}
      </Card>
    )
  }

  renderFormContent() {
    const pickContent = () => window.botpress.pickContent({}, this.handleContentChange)

    return (
      <FormGroup label={lang.tr('module.broadcast.form.content')}>
        <ControlGroup>
          <Button onClick={pickContent} text={lang.tr('module.broadcast.form.pickContent')} />
          <InputGroup fill={true} id="input-content" readOnly={true} value={this.state.broadcast.content} />
        </ControlGroup>
      </FormGroup>
    )
  }

  renderFormDate() {
    return (
      <FormGroup label={lang.tr('module.broadcast.form.date')} fill={true}>
        <DateInput
          onChange={this.handleDateChange}
          parseDate={str => new Date(str)}
          placeholder={'YYYY-MM-DD'}
          formatDate={d => moment(d).format('YYYY-MM-DD')}
          minDate={new Date()}
          value={this.state.broadcast.date}
        />
      </FormGroup>
    )
  }

  renderFormTime() {
    return (
      <FormGroup className={style.formTime} label={lang.tr('module.broadcast.form.time')}>
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
        {lang.tr('module.broadcast.form.userTimeZone')}
      </Checkbox>
    )
  }

  renderFilteringConditionElement = filter => {
    const removeHandler = () => this.handleRemoveFromFilteringConditions(filter)

    return (
      <ControlGroup>
        <InputGroup fill={true} defaultValue={filter} readOnly />
        <Button icon="remove" onClick={removeHandler} />
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
        <FormGroup
          className={style.addFilters}
          label={
            <div>
              {lang.tr('module.broadcast.form.filters')}{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/botpress/botpress/blob/master/modules/broadcast/README.md#filtering"
              >
                <Icon icon="help" />
              </a>
            </div>
          }
        >
          <ControlGroup>
            <InputGroup fill={true} inputRef={input => (this.filterInput = input)} />
            <Button text={lang.tr('add')} onClick={() => this.handleAddToFilteringConditions()} />
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
          {/*this.renderFormUserTimezone()*/}
        </ControlGroup>
        {this.renderFiltering()}
      </form>
    )
  }

  renderActionButton() {
    const onClickAction = this.state.modifyBroadcast ? this.handleModifyBroadcast : this.handleAddBroadcast
    const buttonName = this.state.modifyBroadcast
      ? lang.tr('module.broadcast.form.modify')
      : lang.tr('module.broadcast.form.create')

    return <Button intent={Intent.PRIMARY} text={buttonName} onClick={onClickAction} />
  }

  renderModalForm() {
    return (
      <div className={style.modal}>
        <Dialog.Wrapper
          title={
            this.state.modifyBroadcast
              ? lang.tr('module.broadcast.form.modifyBroadcast')
              : lang.tr('module.broadcast.form.createBroadcast')
          }
          usePortal={false}
          isOpen={this.state.showModalForm}
          onClose={this.closeModal}
        >
          <Dialog.Body>{this.renderForm()}</Dialog.Body>
          <Dialog.Footer>
            <Button text={lang.tr('cancel')} onClick={this.handleCloseModalForm} />
            {this.renderActionButton()}
          </Dialog.Footer>
        </Dialog.Wrapper>
      </div>
    )
  }

  renderNewButton() {
    return (
      <div className={style.newButton}>
        <Button
          text={lang.tr('module.broadcast.newBroadcast')}
          icon="plus"
          intent={Intent.PRIMARY}
          onClick={() => this.handleOpenModalForm()}
        />
      </div>
    )
  }

  renderErrorBox() {
    return <DismissableAlert />
  }

  render() {
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
        <h3 className={style.title}>{lang.tr('module.broadcast.title')}</h3>
        {this.renderNewButton()}
        {hasSomeError ? this.renderErrorBox() : null}
        <div className={style.mainPanel}>
          {this.renderBroadcastsPanel(lang.tr('module.broadcast.section.upcoming'), upcomingBroadcasts)}
          {this.renderBroadcastsPanel(lang.tr('module.broadcast.section.past'), pastBroadcasts)}
          {this.renderBroadcastsPanel(lang.tr('module.broadcast.section.other'), allBroadcasts)}
        </div>
        {this.renderModalForm()}
      </div>
    )
  }
}
