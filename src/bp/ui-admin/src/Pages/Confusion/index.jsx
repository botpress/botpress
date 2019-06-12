import React, { Component } from 'react'

import SectionLayout from '../Layouts/Section'
import Details from './details'
import moment from 'moment'

import _ from 'lodash'

import api from '../../api'

class Confusion extends Component {
  state = {
    confusions: [],
    botIds: [],
    select: [],
    isComputing: false
  }

  getDateFromTimestamp = timestamp => moment(parseInt(timestamp, 10)).format('LLL')

  setSelect = (value, index) =>
    this.setState({ select: [...this.state.select.slice(0, index), value, ...this.state.select.slice(index + 1)] })

  selectChangeFromFrontEnd = index => event => this.setSelect(event.target.value, index)

  getAllBotIds = async () => {
    if (_.isEmpty(this.state.botIds)) {
      this.setState({ botIds: (await api.getSecured().get('/admin/bots')).data.payload.bots.map(bot => bot.id) })
    }

    return this.state.botIds
  }

  fetchConfusionHashForBot = async botId => (await api.getSecured().get(`/bots/${botId}/mod/nlu/confusion`)).data

  triggerComputeConfusionForBot = async botId =>
    (await api.getSecured({ timeout: 999999999 }).post(`/bots/${botId}/mod/nlu/confusion`)).data

  getAllConfusions = async () => await Promise.all((await this.getAllBotIds()).map(await this.fetchConfusionHashForBot))

  triggerCompute = async () => {
    this.setState({ isComputing: true })

    await Promise.all((await this.getAllBotIds()).map(await this.triggerComputeConfusionForBot))
    this.addConfusionToState(await this.getAllConfusions())
    this.initLabels()

    this.setState({ isComputing: false })
  }

  addConfusionToState = confusions => this.setState({ confusions })

  initLabels = () => {
    this.setState({ select: Array(this.getAllPropertiesFromConfusions().length).fill('') })

    this.getAllPropertiesFromConfusions()
      .map(uniqProp => uniqProp[0])
      .forEach(this.setSelect)
  }

  componentDidMount = async () => {
    this.addConfusionToState(await this.getAllConfusions())
    this.initLabels()
  }

  pickGroupingAttributes = obj => Object.values(_.pick(obj, ['lang', 'version', 'date']))

  getAllPropertiesFromConfusions = () =>
    _.chain(this.state.confusions || [])
      .map(conf => conf.confusions.map(this.pickGroupingAttributes))
      .reduce((a, b) => a.concat(b), [])
      .unzip()
      .map(_.uniq)
      .value()

  renderConfusions = () => (
    <div className="bp_table bot_views compact_view">
      <button onClick={this.triggerCompute}>
        {this.state.isComputing ? 'Computing...' : 'Click here to fetch all'}
      </button>

      {this.getAllPropertiesFromConfusions().map((field, i) => (
        <select key={'select' + i} value={this.state.select[i]} onChange={this.selectChangeFromFrontEnd(i)}>
          {field.map(val => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      ))}

      {(this.state.confusions || []).map(confusion => (
        <div key={`conf-${confusion.botId}`}>
          <h3>{confusion.botId}</h3>
          {confusion.confusions
            .filter(data => _.isEmpty(_.difference(this.pickGroupingAttributes(data), this.state.select)))
            .map((data, i) => (
              <div key={data.hash + i}>
                <span>
                  {data.lang} - {data.version} - {this.getDateFromTimestamp(data.date)} -
                  {data.matrix.intents.all.f1.toFixed(2)}
                </span>

                <Details data={data.matrix.intents} />
              </div>
            ))}
        </div>
      ))}
    </div>
  )

  render() {
    return (
      <SectionLayout
        title={`Confusions matrix for bots`}
        helpText="This page lists all the computed confusions matrix for each bots."
        activePage="confusion"
        mainContent={this.renderConfusions()}
      />
    )
  }
}

export default Confusion
