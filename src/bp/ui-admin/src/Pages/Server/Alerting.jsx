import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IoIosBoxOutline } from 'react-icons/lib/io'
import { Label, Row, Col, Jumbotron } from 'reactstrap'
import Select from 'react-select'
import moment from 'moment'
import ms from 'ms'

import SectionLayout from '../Layouts/Section'
import IncidentsTable from '../Components/Monitoring/IncidentsTable'
import LoadingSection from '../Components/LoadingSection'
import { fetchIncidents } from '../../reducers/monitoring'

const timeFrameOptions = [
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '5h', label: '5 hours' },
  { value: '15h', label: '15 hours' },
  { value: '24h', label: '24 hours' }
]

class Alerts extends Component {
  state = {
    intervalId: null,
    timeFrame: null,
    timeFrameOptions
  }

  componentDidMount() {
    this.setState({ timeFrame: timeFrameOptions[0] }, this.queryData)
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
  handleAutoRefreshChanged = event => {
    const autoRefresh = event.target.checked
    let intervalId = undefined

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
        <h4>Active Incidents</h4>
        <IncidentsTable data={this.props.incidents.active} />

        <h4>Resolved Incidents</h4>
        <IncidentsTable data={this.props.incidents.resolved} />
      </div>
    )
  }

  renderNoData() {
    return (
      <Jumbotron>
        <Row>
          <Col style={{ textAlign: 'center' }} sm="12" md={{ size: 8, offset: 2 }}>
            <h1>
              <IoIosBoxOutline />
              &nbsp; Alerting is not enabled or there is no statistics.
            </h1>
            <p>Make sure that alerting is enabled in your Botpress Config.</p>
          </Col>
        </Row>
      </Jumbotron>
    )
  }

  render() {
    if (!this.props.incidents) {
      return this.renderNoData()
    }

    if (this.props.loadingIncidents) {
      return <LoadingSection />
    }

    return (
      <SectionLayout title={null} helpText={null} mainContent={this.renderTables()} sideMenu={this.renderSideMenu()} />
    )
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
        <strong>Time Frame</strong>
        <Select
          styles={reactSelectStyle}
          options={timeFrameOptions}
          value={this.state.timeFrame}
          onChange={this.handleTimeFrameChanged}
          isSearchable={false}
        />
        <strong>Auto-Refresh</strong>
        <br />
        <Label>
          <input
            style={{ marginTop: 8 }}
            name="autoRefresh"
            type="checkbox"
            value={this.state.autoRefresh}
            onChange={this.handleAutoRefreshChanged}
          />{' '}
          <strong>Enabled</strong>
        </Label>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  incidents: state.monitoring.incidents
})

const mapDispatchToProps = { fetchIncidents }

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Alerts)
