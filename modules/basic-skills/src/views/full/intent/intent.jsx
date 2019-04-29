import React from 'react'
import Select from 'react-select'
import { Row, Col, Table } from 'react-bootstrap'
import style from './style.scss'
import { BotpressTooltip } from 'botpress/tooltip'

export class Intent extends React.Component {
  state = {
    intentsOptions: [],
    selectedIntents: [],
    flows: [],
    flowsOptions: [],
    selectedFlows: [],
    selectedNodes: []
  }

  setSelectedIntents() {
    if (!_.get(this.props, 'initialData.intents')) {
      return this.state.selectedIntents
    }

    return this.props.initialData.intents.map(x => ({ label: x.intent, value: x.intent }))
  }

  setSelectedFlows() {
    debugger
    const selectedFlows = this.props.initialData.intents.map(x => {
      return { [x.intent]: x.flow }
    })

    return _.keyBy(selectedFlows, x => x.intent)
  }

  setSelectedNodes() {}

  componentDidMount() {
    this.setState({
      selectedIntents: this.setSelectedIntents(),
      selectedFlows: this.setSelectedFlows(),
      selectedNodes: this.setSelectedNodes()
    })

    this.fetchIntents()
    this.fetchFlows()
  }

  componentDidUpdate() {
    if (Object.keys(this.state.selectedFlows).length !== this.state.selectedIntents.length) {
      this.props.onValidChanged && this.props.onValidChanged(false)
      return
    }

    const intentsNames = Object.keys(this.state.selectedFlows)
    const intents = intentsNames.map(key => ({
      intent: key,
      flow: this.state.selectedFlows[key].value,
      node: this.state.selectedNodes[key] && this.state.selectedNodes[key].value // Can be undefined
    }))
    const data = { intents }

    this.props.onDataChanged && this.props.onDataChanged(data)
    this.props.onValidChanged && this.props.onValidChanged(true)
  }

  fetchIntents = () => {
    return this.props.bp.axios.get('/mod/nlu/intents').then(({ data }) => {
      const intentsOptions = data
        .filter(x => !x.name.startsWith('__qna'))
        .map(({ name }) => ({ label: name, value: name }))
      this.setState({ intentsOptions })
    })
  }

  fetchFlows() {
    this.props.bp.axios.get('/flows').then(({ data }) => {
      const flowsOptions = data
        .filter(flow => !flow.name.startsWith('skills/'))
        .map(({ name }) => ({ label: name, value: name }))

      this.setState({ flows: data, flowsOptions })
    })
  }

  handleIntentsChange = selectedIntents => {
    this.setState({ selectedIntents })
  }

  handleFlowsChange = (selectedFlow, key) => {
    this.setState({ selectedFlows: { ...this.state.selectedFlows, [key]: selectedFlow } })
  }

  handleNodeChange = (selectedNode, key) => {
    this.setState({ selectedNodes: { ...this.state.selectedNodes, [key]: selectedNode } })
  }

  renderNodeOptions = key => {
    const flowName = this.state.selectedFlows[key].value
    const flow = this.state.flows.find(x => x.name === flowName)
    if (!flow) {
      return []
    }

    return flow.nodes.map(n => ({ label: n.name, value: n.name }))
  }

  render() {
    return (
      <div>
        <Row>
          <Col md={12}>
            <label for="intentsSelect">Select the intents to match</label>
            &nbsp;
            <BotpressTooltip message="You can choose to redirect to a node or flow when the intents are matched. You can set a node or a flow for each intent." />
            <Select
              id="intentsSelect"
              name="intentsSelect"
              isSearchable
              isMulti
              options={this.state.intentsOptions}
              value={this.state.selectedIntents}
              onChange={this.handleIntentsChange}
            />
            {this.state.selectedIntents.length > 0 && (
              <Table striped bordered hover className={style.section}>
                <thead>
                  <tr>
                    <th>Matched intent</th>
                    <th>
                      Redirect Flow&nbsp;
                      <BotpressTooltip message="(required) The flow to redirect to." />
                    </th>
                    <th>
                      Redirect Node&nbsp;
                      <BotpressTooltip message="(optional) The node to redirect to. If none is selected, the starting node will be chosen." />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.selectedIntents.map((intent, index) => {
                    const key = intent.value
                    return (
                      <tr key={`intent-${index}`}>
                        <td>{intent.label}</td>
                        <td>
                          <Select
                            placeholder="Select a flow"
                            options={this.state.flowsOptions}
                            value={this.state.selectedFlows[key]}
                            onChange={e => this.handleFlowsChange(e, key)}
                          />
                        </td>
                        <td>
                          <Select
                            placeholder="Select a node"
                            options={this.state.selectedFlows[key] && this.renderNodeOptions(key)}
                            value={this.state.selectedNodes[key]}
                            onChange={e => this.handleNodeChange(e, key)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </Col>
        </Row>
      </div>
    )
  }
}
