import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Input } from 'reactstrap'
import PriceItem from './PriceItem'
import { fetchProducts } from '../../../reducers/license'

class CustomizeLicenseForm extends Component {
  state = {
    label: '',
    nodes: 0,
    isGoldSupport: false,
    isPartTimeEnabled: false,
    totalNodes: 0,
    totalGoldSupport: 0,
    totalPrice: 0
  }

  componentDidMount() {
    if (!this.props.products) {
      this.props.fetchProducts()
    }

    if (this.props.license) {
      const { limits, quantities, label } = this.props.license

      this.setState(
        {
          label,
          nodes: limits.nodes,
          isGoldSupport: quantities.isGoldSupport
        },
        this.calculatePrice
      )
    }
    this.calculatePrice()
  }

  getPrice(productName) {
    if (!this.props.products) {
      return
    }

    const product = this.props.products.find(p => p.product === productName)
    return product && product.price
  }

  updateParent = () => {
    this.props.onUpdate({
      label: this.state.label,
      limits: {
        nodes: this.state.nodes
      },
      quantities: {
        isGoldSupport: this.state.isGoldSupport
      },
      isPartTimeEnabled: this.state.isPartTimeEnabled,
      totalPrice: this.state.totalPrice
    })
  }

  calculatePrice() {
    const pro = this.getPrice('pro')
    const totalNodes = this.state.nodes * this.getPrice('full-time-node')
    const totalGoldSupport = this.state.isGoldSupport ? this.getPrice('gold-support') : 0
    const totalPrice = pro + totalNodes + totalGoldSupport

    this.setState({ totalNodes, totalGoldSupport, totalPrice }, this.updateParent)
  }

  handleLabelChanged = e => this.setState({ label: e.target.value }, () => this.updateParent())
  handleCheckboxChanged = e => this.setState({ [e.target.name]: e.target.checked }, this.calculatePrice)
  handleNumberInputChanged = e => this.setState({ [e.target.name]: e.target.valueAsNumber }, this.calculatePrice)

  render() {
    if (!this.props.products) {
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
            bsSize="sm"
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
              title="Botpress License"
              description="This is the basic license, it allows you to add unlimited collaborators, unlimited bots and run botpress on a single node."
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
              total={this.state.totalNodes || 0}
            >
              <Input
                type="number"
                name="nodes"
                bsSize="sm"
                size="2"
                maxLength="3"
                min="0"
                max="100"
                value={this.state.nodes}
                onChange={this.handleNumberInputChanged}
              />
            </PriceItem>
            <PriceItem
              title="Gold Support"
              description="Technical questions by email. Engineer to engineer. Priority bug fixes. Same-day reply (9AM - 4PM EST). Maximum of 8 tickets per month."
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
              title="Part-Time Nodes (available soon)"
              description="Allows you to enable on-demand additional nodes, billed by the hour"
              price={this.getPrice('part-time-node') + '$ per hour'}
            >
              <Input
                type="checkbox"
                name="isPartTimeEnabled"
                disabled={true}
                checked={this.state.isPartTimeEnabled}
                onChange={this.handleCheckboxChanged}
              />
            </PriceItem>
            <tr>
              <td>&nbsp;</td>
              <td align="right">
                <b>Total: </b>
              </td>
              <td>{this.state.totalPrice || 0}$ / month</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  products: state.license.products
})

const mapDispatchToProps = { fetchProducts }
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomizeLicenseForm)
