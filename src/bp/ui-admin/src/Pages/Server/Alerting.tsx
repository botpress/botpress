import moment from 'moment'
import ms from 'ms'
import React, { Component } from 'react'
import { IoIosArchive } from 'react-icons/io'
import { connect } from 'react-redux'
import Select from 'react-select'
import { Col, Jumbotron, Label, Row } from 'reactstrap'
import { fetchIncidents } from '~/reducers/monitoring'
import PageContainer from '~/App/PageContainer'
import SplitPage from '~/App/SplitPage'
import CheckRequirements from '~/Pages/Components/CheckRequirements'
import LoadingSection from '~/Pages/Components/LoadingSection'
import IncidentsTable from '~/Pages/Components/Monitoring/IncidentsTable'

const timeFrameOptions = [
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '5h', label: '5 hours' },
  { value: '15h', label: '15 hours' },
  { value: '24h', label: '24 hours' }
]

interface Props {
  incidents: any
  loadingIncidents: boolean
  fetchIncidents: (from, to) => void
}

interface State {
  intervalId: any
  timeFrame: any
  autoRefresh: boolean
  timeFrameOptions: any
  error?: string
}

class Alerts extends Component<Props, State> {
  state: State = {
    intervalId: undefined,
    timeFrame: undefined,
    timeFrameOptions,
    autoRefresh: false,
    error: undefined
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
        <h4>Active Incidents</h4>
        <IncidentsTable data={this.props.incidents.active} />

        <h4>Resolved Incidents</h4>
        <IncidentsTable data={this.props.incidents.resolved} />
      </div>
    )
  }

  renderNoData() {
    return (
      <PageContainer title="Alerting & Incidents">
        <Jumbotron>
          <Row>
            <Col style={{ textAlign: 'center' }} sm="12" md={{ size: 8, offset: 2 }}>
              <h1>
                <IoIosArchive />
                &nbsp; Alerting is not enabled or there is no statistics.
              </h1>
              <p>
                Make sure that alerting is enabled in your Botpress Config (and that you have restarted the server if
                you just made the change).
              </p>
            </Col>
          </Row>
        </Jumbotron>
      </PageContainer>
    )
  }

  renderChild() {
    if (!this.props.incidents) {
      return this.renderNoData()
    }

    if (this.props.loadingIncidents) {
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
            checked={this.state.autoRefresh}
            onChange={this.handleAutoRefreshChanged}
          />{' '}
          <strong>Enabled</strong>
        </Label>
      </div>
    )
  }

  render() {
    return (
      <PageContainer title="Alerting & Incidents" fullWidth={true} superAdmin={true}>
        <CheckRequirements requirements={['redis', 'pro', 'monitoring']} feature="alerting">
          {this.renderChild()}
        </CheckRequirements>
      </PageContainer>
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
