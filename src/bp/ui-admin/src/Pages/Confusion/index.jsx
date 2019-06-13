import React, { Component } from 'react'

import SectionLayout from '../Layouts/Section'
import Details from './details'
import moment from 'moment'

import _ from 'lodash'

import api from '../../api'

const allFilterFields = ['lang', 'nluVersion']

class Confusion extends Component {
  state = {
    confusions: [],
    botIds: [],
    select: ['', ''],
    isComputing: false
  }

  componentDidMount = async () => {
    this.addConfusionToState(await this.getAllConfusions())
    this.initLabels()
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

  fetchConfusionForBot = async botId => (await api.getSecured().get(`/bots/${botId}/mod/nlu/confusion`)).data

  triggerComputeConfusionForBot = async botId =>
    (await api.getSecured({ timeout: 999999999 }).post(`/bots/${botId}/mod/nlu/confusion`)).data

  getAllConfusions = async () => await Promise.all((await this.getAllBotIds()).map(await this.fetchConfusionForBot))

  triggerCompute = async () => {
    this.setState({ isComputing: true })

    await Promise.all((await this.getAllBotIds()).map(await this.triggerComputeConfusionForBot))
    this.addConfusionToState(await this.getAllConfusions())
    this.initLabels()

    this.setState({ isComputing: false })
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
  nluSelectValues = () => this.getAttributesFromAllConfusions(['nluVersion'])[0] || []

  renderConfusions = () => (
    <div className="bp_table bot_views compact_view">
      <button onClick={this.triggerCompute}>
        {this.state.isComputing ? 'Computing...' : 'Compute matrices for current build'}
      </button>

      <br />

      <select key={'select-lang'} value={this.state.select[0]} onChange={this.selectChangeFromFrontEnd(0)}>
        {this.langSelectValues().map(val => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </select>

      <select key={'select-version'} value={this.state.select[1]} onChange={this.selectChangeFromFrontEnd(1)}>
        {this.nluSelectValues().map(val => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </select>

      {(this.state.confusions || []).map(confusion => (
        <div key={`conf-${confusion.botId}`}>
          <h3>{confusion.botId}</h3>
          {confusion.confusions
            .filter(data =>
              _.isEmpty(_.difference(this.getValueForAttributes(allFilterFields)(data), this.state.select))
            )
            .map((data, i) => (
              <div key={data.hash + i}>
                <span>
                  {data.lang} - {data.nluVersion} - {data.matrix.intents.all.f1.toFixed(2)}
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
