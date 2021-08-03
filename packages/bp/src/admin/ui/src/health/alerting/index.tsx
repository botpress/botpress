import { Callout, Checkbox } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import moment from 'moment'
import ms from 'ms'
import React, { Component } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import Select from 'react-select'

import CheckRequirements from '~/app/common/CheckRequirements'
import LoadingSection from '~/app/common/LoadingSection'
import PageContainer from '~/app/common/PageContainer'
import SplitPage from '~/app/common/SplitPage'
import { AppState } from '~/app/rootReducer'
import IncidentsTable from './IncidentsTable'
import { fetchIncidents } from './reducer'

type Props = ConnectedProps<typeof connector>

interface State {
  intervalId: any
  timeFrame: any
  autoRefresh: boolean
  timeFrameOptions: any
  error?: string
}

class Alerts extends Component<Props, State> {
  timeFrameOptions = [
    { value: '1h', label: lang.tr('admin.alerting.timespanHour') },
    { value: '2h', label: lang.tr('admin.alerting.timespanHours', { nb: 2 }) },
    { value: '5h', label: lang.tr('admin.alerting.timespanHours', { nb: 5 }) },
    { value: '15h', label: lang.tr('admin.alerting.timespanHours', { nb: 15 }) },
    { value: '24h', label: lang.tr('admin.alerting.timespanHours', { nb: 24 }) }
  ]

  state: State = {
    intervalId: undefined,
    timeFrame: undefined,
    timeFrameOptions: this.timeFrameOptions,
    autoRefresh: false,
    error: undefined
  }

  componentDidMount() {
    this.setState({ timeFrame: this.timeFrameOptions[0] }, this.queryData)
  }

  componentWillUnmount() {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId)
    }
  }

  async queryData() {
    if (!this.state.timeFrame) {
      return
    }

    try {
      const fromTime = moment()
        .subtract(ms(this.state.timeFrame.value))
        .toDate()
        .getTime()

      const toTime = moment()
        .toDate()
        .getTime()

      this.props.fetchIncidents(fromTime, toTime)
    } catch (error) {
      this.setState({ error: error.message })
    }
  }

  handleTimeFrameChanged = timeFrame => this.setState({ timeFrame }, this.queryData)
  handleAutoRefreshChanged = autoRefresh => {
    let intervalId

    if (autoRefresh && !this.state.intervalId) {
      intervalId = setInterval(() => this.queryData(), 10000)
    } else if (!autoRefresh && this.state.intervalId) {
      clearInterval(this.state.intervalId)
    }
    this.setState({ autoRefresh, intervalId })
  }

  renderTables() {
    if (!this.props.incidents) {
      return null
    }

    return (
      <div>
        <h4>{lang.tr('admin.alerting.activeIncidents')}</h4>
        <IncidentsTable data={this.props.incidents.active} />

        <h4>{lang.tr('admin.alerting.resolvedIncidents')}</h4>
        <IncidentsTable data={this.props.incidents.resolved} />
      </div>
    )
  }

  renderNoData() {
    return (
      <Callout title="No incidents to display">
        <p>{lang.tr('admin.alerting.notEnabled')}</p>
        <p>{lang.tr('admin.alerting.makeSureEnabled')}</p>
      </Callout>
    )
  }

  renderChild() {
    if (!this.props.incidents) {
      return this.renderNoData()
    }

    if (this.props.loading) {
      return <LoadingSection />
    }

    return <SplitPage sideMenu={this.renderSideMenu()}>{this.renderTables()}</SplitPage>
  }

  renderSideMenu() {
    const reactSelectStyle = {
      control: base => ({ ...base, minHeight: 30 }),
      dropdownIndicator: base => ({ ...base, padding: 4 }),
      clearIndicator: base => ({ ...base, padding: 4 }),
      valueContainer: base => ({ ...base, padding: '0px 6px' }),
      input: base => ({ ...base, margin: 0, padding: 0 })
    }

    return (
      <div style={{ fontSize: '80%' }}>
        <strong>{lang.tr('admin.alerting.timeFrame')}</strong>
        <Select
          styles={reactSelectStyle}
          options={this.timeFrameOptions}
          value={this.state.timeFrame}
          onChange={this.handleTimeFrameChanged}
          isSearchable={false}
        />
        <strong>{lang.tr('admin.alerting.autoRefresh')}</strong>
        <br />
        <Checkbox
          label={lang.tr('enabled')}
          style={{ marginTop: 8 }}
          name="autoRefresh"
          checked={this.state.autoRefresh}
          onChange={e => this.handleAutoRefreshChanged(e.currentTarget.checked)}
        ></Checkbox>
      </div>
    )
  }

  render() {
    return (
      <PageContainer title={lang.tr('admin.alerting.alertingAndIncidents')} fullWidth={true} superAdmin={true}>
        <CheckRequirements requirements={['redis', 'pro', 'monitoring']} feature="alerting">
          {this.renderChild()}
        </CheckRequirements>
      </PageContainer>
    )
  }
}

const mapStateToProps = (state: AppState) => ({
  incidents: state.alerting.incidents,
  loading: state.alerting.loading
})

const connector = connect(mapStateToProps, { fetchIncidents })
export default connector(Alerts)
