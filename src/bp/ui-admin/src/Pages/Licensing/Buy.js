import React, { Fragment } from 'react'
import { Redirect } from 'react-router-dom'
import { Col, Button } from 'reactstrap'
import _ from 'lodash'
import SectionLayout from '../Layouts/Section'
import CustomizeLicenseForm from '../Components/Licensing/CustomizeLicenseForm'
import CreditCardPicker from '../Components/Licensing/CreditCardPicker'
import PromoCodePicker from '../Components/Licensing/PromoCodePicker'
import api from '../../api'
import { getSession, isAuthenticated } from '../../Auth/licensing'

export default class BuyPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      success: false,
      error: false,
      currentStep: 'input',
      promoCode: '',
      isPromoCodeValid: undefined
    }
  }

  componentDidMount() {
    const session = getSession()
    this.setState({
      user: _.pick(session, ['email', 'name'])
    })
  }

  confirmPurchase = async () => {
    try {
      const subscription = {
        source: this.state.card,
        promoCode: this.state.promoCode,
        support: this.state.order.isGoldSupport ? 'gold' : 'standard',
        nodes: Number(this.state.order.nodes),
        label: this.state.order.label,
        partTime: this.state.order.isPartTimeEnabled
      }

      await api.getLicensing().post(`/me/keys`, subscription)
      this.setState({ success: true })

      window.setTimeout(() => {
        this.props.history.push('/licensing/keys')
      }, 1250)
    } catch (error) {
      console.error('cannot buy license', error)
      this.setState({ loading: false, error: true })
    }
  }

  handleOrderUpdated = details => this.setState({ order: details })
  handleCardChanged = card => this.setState({ card })
  handlePromoCodeUpdated = ({ promoCode, isPromoCodeValid }) => this.setState({ promoCode, isPromoCodeValid })

  renderSuccess() {
    return (
      <div className="confirmation">
        <div class="checkmark">
          <div class="checkmark-icon">
            <span class="checkmark-icon__line checkmark-icon__line--short" />
            <span class="checkmark-icon__line checkmark-icon__line--long" />
          </div>
        </div>
        <span>Thank you</span>
      </div>
    )
  }

  renderValidation() {
    return (
      <Col md="4">
        <CreditCardPicker userInfo={this.state.user} onCardChanged={this.handleCardChanged} />
        <br />
        <PromoCodePicker onUpdate={this.handlePromoCodeUpdated} />
        <br />
        <b>Total:</b> {this.state.order && this.state.order.totalPrice}$ per month
        <br />
        <br />
        <Button
          size="sm"
          color="primary"
          style={{ float: 'right' }}
          onClick={this.confirmPurchase}
          disabled={!this.state.card || this.state.isPromoCodeValid === false}
        >
          Confirm my purchase
        </Button>
        <Button size="sm" style={{ float: 'left' }} onClick={() => this.setState({ currentStep: 'input' })}>
          Edit my order
        </Button>
      </Col>
    )
  }

  renderForm() {
    return (
      <Fragment>
        <Col md={{ size: 6 }}>
          <CustomizeLicenseForm onUpdate={this.handleOrderUpdated} />

          <div className="checkout">
            <div className="checkout__buy">
              <Button size="sm" color="primary" onClick={() => this.setState({ currentStep: 'validation' })}>
                Next
              </Button>
            </div>
          </div>
        </Col>
      </Fragment>
    )
  }

  render() {
    if (!isAuthenticated()) {
      return <Redirect to="/licensing/login" />
    }

    let page
    if (this.state.currentStep === 'input') {
      page = this.renderForm()
    } else if (this.state.currentStep === 'validation') {
      page = this.renderValidation()
    } else {
      page = this.renderSuccess()
    }

    return <SectionLayout title="Buy new license" activePage="licensing-buy" mainContent={page} />
  }
}
