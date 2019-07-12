import React, { Component } from 'react'
import { connect } from 'react-redux'

import TabLayout from '../Layouts/Tabs'
import Details from './details'
import { fetchBots } from '../../reducers/bots'
import _ from 'lodash'

import api from '../../api'
import { Icon, FormGroup, InputGroup, Button, ControlGroup } from '@blueprintjs/core'

const allFilterFields = ['lang', 'version']

class Confusion extends Component {
  state = {
    confusions: [],
    botIds: [],
    select: ['', ''],
    isComputing: false,
    version: ''
  }

  componentDidMount = async () => {
    this.loadBots()
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.bots !== this.props.bots) {
      this.loadBots()
    }
  }

  async loadBots() {
    if (!this.props.bots) {
      return this.props.fetchBots()
    }

    const botIds = this.props.bots.filter(b => !b.disabled).map(bot => bot.id)

    this.setState({ botIds }, async () => {
      this.addConfusionToState(await this.getAllConfusions())
      this.initLabels()
    })
  }

  versionChange = event => this.setState({ version: event.target.value })

  setSelect = (value, index) =>
    this.setState({ select: [...this.state.select.slice(0, index), value, ...this.state.select.slice(index + 1)] })

  selectChangeFromFrontEnd = index => event => this.setSelect(event.target.value, index)

  fetchConfusionForBot = async botId => {
    try {
      const { data } = await api.getSecured().get(`/bots/${botId}/mod/nlu/confusion`)
      return data
    } catch (err) {
      console.error(`Could not fetch confusion for bot ${botId}`, err)
    }
  }

  handleVersionChanged = event => {
    this.setState({ version: event.target.value })
    this.setSelect(event.target.value, 1)
  }

  triggerComputeConfusionForBot = async botId =>
    (await api
      .getSecured({ timeout: 999999999 })
      .post(`/bots/${botId}/mod/nlu/confusion`, { version: this.state.version })).data

  getAllConfusions = async () => await Promise.all(this.state.botIds.map(await this.fetchConfusionForBot))

  triggerCompute = async () => {
    this.setState({ isComputing: true })

    await Promise.all(this.state.botIds.map(await this.triggerComputeConfusionForBot))
    this.addConfusionToState(await this.getAllConfusions())
    this.initLabels()

    this.setState({ isComputing: false, select: [this.state.select[0], this.state.version] })
  }

  addConfusionToState = confusions => this.setState({ confusions })

  initLabels = () =>
    this.getAttributesFromAllConfusions(allFilterFields)
      .map(uniqProp => uniqProp[0])
      .forEach(this.setSelect)

  getValueForAttributes = attributes => obj => Object.values(_.pick(obj, attributes))

  getAttributesFromAllConfusions = attributes =>
    _.chain(this.state.confusions || [])
      .map(conf => conf.confusions.map(this.getValueForAttributes(attributes)))
      .flatten()
      .unzip()
      .map(_.uniq)
      .value()

  langSelectValues = () => this.getAttributesFromAllConfusions(['lang'])[0] || []
  versionSelectValues = () => this.getAttributesFromAllConfusions(['version'])[0] || []

  renderToolbar() {
    return (
      <div style={{ display: 'flex' }}>
        <div>
          <h5>View existing Confusion</h5>
          <div style={{ display: 'flex' }}>
            <FormGroup label="Language" style={{ width: 120 }}>
              <select key={'select-lang'} value={this.state.select[0]} onChange={this.selectChangeFromFrontEnd(0)}>
                {this.langSelectValues().map(val => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </FormGroup>
            <FormGroup label="Version" style={{ width: 150 }}>
              <select key={'select-version'} value={this.state.select[1]} onChange={this.handleVersionChanged}>
                {this.versionSelectValues().map(val => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </FormGroup>
          </div>
        </div>
        <div>
          <h5>Recompute Confusion</h5>
          <div style={{ display: 'flex' }}>
            {this.state.isComputing ? (
              <span>Please wait, computing confusion... (version: {this.state.version})</span>
            ) : (
              <FormGroup label="Assign results to version...">
                <ControlGroup>
                  <InputGroup
                    placeholder="Version (optional)"
                    value={this.state.version}
                    onChange={this.versionChange}
                  />
                  <Button onClick={this.triggerCompute} text="Go" />
                </ControlGroup>
              </FormGroup>
            )}
          </div>
        </div>
      </div>
    )
  }

  renderConfusions = () => (
    <div style={{ padding: 10 }}>
      {this.renderToolbar()}

      {(this.state.confusions || []).map(confusion => (
        <div key={`conf-${confusion.botId}`}>
          <h3>{confusion.botId}</h3>
          {confusion.confusions
            .filter(x => _.get(x, 'matrix.all.f1'))
            .filter(data =>
              _.isEmpty(_.difference(this.getValueForAttributes(allFilterFields)(data), this.state.select))
            )
            .map((data, i) => (
              <div key={data.hash + i}>
                <h6>
                  [{data.lang.toUpperCase()}] -{' '}
                  {['f1', 'recall', 'precision']
                    .map(field => <strong>{field.toString() + ': ' + data.matrix.all[field].toFixed(2)}</strong>)
                    .reduce((acc, field) => [acc, ', ', field])}
                </h6>

                <Details
                  data={_.chain(data.matrix)
                    .pickBy((val, key) => key !== 'all')
                    .value()}
                />
              </div>
            ))}
        </div>
      ))}
    </div>
  )

  render() {
    const tabs = [
      {
        name: 'Confusions',
        route: '/confusion',
        icon: <Icon icon="cube" />,
        component: this.renderConfusions,
        useFullWidth: true
      }
    ]
    return <TabLayout title="Confusion Matrix" {...{ tabs, ...this.props, showHome: true }} />
  }
}

const mapStateToProps = state => ({ bots: state.bots.bots })
const mapDispatchToProps = { fetchBots }

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Confusion)
