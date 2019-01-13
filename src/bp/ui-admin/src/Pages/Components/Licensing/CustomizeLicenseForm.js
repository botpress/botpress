import React, { Component } from 'react'
import { Input } from 'reactstrap'
import PriceItem from './PriceItem'
import api from '../../../api'

export default class CustomizeLicenseForm2 extends Component {
  state = {
    label: '',
    nodes: 0,
    isGoldSupport: false,
    isPartTimeEnabled: false,
    totalNodes: 0,
    totalGoldSupport: 0,
    totalPartTimeEnabled: 0,
    totalPrice: 0
  }

  componentDidMount() {
    this.fetchPrices()

    if (this.props.license) {
      const { limits, quantities, label } = this.props.license

      this.setState({
        label,
        nodes: limits.nodes,
        isGoldSupport: quantities.isGoldSupport
      })
    }
  }

  async fetchPrices() {
    try {
      const { data } = await api.getLicensing().get(`/prices`)
      this.setState({ products: data.products })
      this.calculatePrice()
    } catch (error) {
      this.setState({ error: error.message })
    }
  }

  getPrice(productName) {
    if (!this.state.products) {
      return
    }

    const product = this.state.products.find(p => p.product === productName)
    return product && product.price
  }

  updateParent = () => {
    this.props.onUpdate({
      label: this.state.label,
      nodes: this.state.nodes,
      isGoldSupport: this.state.isGoldSupport,
      isPartTimeEnabled: this.state.isPartTimeEnabled,
      totalPrice: this.state.totalPrice
    })
  }

  calculatePrice() {
    const pro = this.getPrice('pro')
    const totalNodes = this.state.nodes * this.getPrice('full-time-node')
    const totalGoldSupport = this.state.isGoldSupport ? this.getPrice('gold-support') : 0
    const totalPartTimeEnabled = this.state.isPartTimeEnabled ? this.getPrice('part-time-node') : 0
    const totalPrice = pro + totalNodes + totalGoldSupport + totalPartTimeEnabled

    this.setState({ totalNodes, totalGoldSupport, totalPartTimeEnabled, totalPrice }, this.updateParent)
  }

  handleLabelChanged = e => this.setState({ label: e.target.value }, () => this.updateParent())
  handleCheckboxChanged = e => this.setState({ [e.target.name]: e.target.checked }, this.calculatePrice)
  handleInputChanged = e => this.setState({ [e.target.name]: e.target.value }, this.calculatePrice)

  render() {
    if (!this.state.products) {
      return null
    }
    return (
      <div>
        <div className="license_label">
          <label className="form__label">Friendly name</label>
          <Input
            type="text"
            placeholder="My first license"
            style={{ width: '250px' }}
            maxLength={50}
            size="sm"
            value={this.state.label}
            onChange={this.handleLabelChanged}
          />
        </div>
        <hr />

        <table className="licensing_table">
          <thead>
            <tr>
              <th />
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            <PriceItem
              title="Pro License"
              description="This is the basic license, it allows you unlimited admins, unlimited bots, but only on one node."
              price={this.getPrice('pro') + '$'}
              total={this.getPrice('pro')}
            >
              <Input type="checkbox" disabled={true} checked={true} />
            </PriceItem>
            <tr>
              <td colSpan="3" className="addons">
                Unleash Botpress's power by adding these optional add-ons
              </td>
            </tr>
            <PriceItem
              title="Additional Nodes"
              description="Scale your Botpress installation by adding multiple nodes in the same cluster"
              price={this.getPrice('full-time-node') + '$ each'}
              total={this.state.totalNodes}
            >
              <Input
                type="number"
                name="nodes"
                bsSize="sm"
                size="2"
                maxLength="3"
                value={this.state.nodes}
                onChange={this.handleInputChanged}
              />
            </PriceItem>
            <PriceItem
              title="Gold Support"
              description="Technical questions by email, support center or phone. Priority bug fixes. Same-day reply (10AM - 4PM EST)."
              price={this.getPrice('gold-support') + '$'}
              total={this.state.totalGoldSupport}
            >
              <Input
                type="checkbox"
                name="isGoldSupport"
                checked={this.state.isGoldSupport}
                onChange={this.handleCheckboxChanged}
              />
            </PriceItem>
            <PriceItem
              type="checkbox"
              title="Part-Time Nodes"
              description="Allows you to enable on-demand additional nodes, billed by the hour"
              price={this.getPrice('part-time-node') + '$ per hour'}
            >
              <Input
                type="checkbox"
                name="isPartTimeEnabled"
                checked={this.state.isPartTimeEnabled}
                onChange={this.handleCheckboxChanged}
              />
            </PriceItem>
            <tr>
              <td>&nbsp;</td>
              <td align="right">
                <b>Total: </b>
              </td>
              <td>{this.state.totalPrice}$</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}
