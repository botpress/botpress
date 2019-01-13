import React from 'react'
import { Modal, ModalHeader, ModalBody, Col, Button } from 'reactstrap'
import _ from 'lodash'
import CustomizeLicenseForm from './CustomizeLicenseForm'
import CreditCardPicker from './CreditCardPicker'
import PromoCodePicker from './PromoCodePicker'
import api from '../../../api'
import { getSession } from '../../../Auth/licensing'

export default class BuyPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      success: false,
      error: false,
      currentStep: 'input',
      promoCode: '',
      isPromoCodeValid: undefined,
      isLoading: false
    }
  }

  componentDidMount() {
    const session = getSession()
    this.setState({
      user: _.pick(session, ['email', 'name'])
    })
  }

  toggle = () => {
    this.props.toggle()
  }

  confirmPurchase = async () => {
    this.setState({ isLoading: true })
    try {
      const subscription = {
        source: this.state.card,
        promoCode: this.state.promoCode,
        support: this.state.order.quantities.isGoldSupport ? 'gold' : 'standard',
        nodes: Number(this.state.order.limits.nodes),
        label: this.state.order.label,
        partTime: this.state.order.isPartTimeEnabled
      }

      await api.getLicensing().post(`/me/keys`, subscription)
      this.setState({ isLoading: false, currentStep: 'success' })

      window.setTimeout(() => {
        this.props.refreshLicenses()
        this.toggle()
      }, 1250)
    } catch (error) {
      console.error('cannot buy license', error)
      this.setState({ isLoading: false, error: true })
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
      <Col>
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
          disabled={!this.state.card || this.state.isPromoCodeValid === false || this.state.isLoading}
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
      <Col>
        <CustomizeLicenseForm license={this.state.order} onUpdate={this.handleOrderUpdated} />

        <div className="checkout">
          <div className="checkout__buy">
            <Button size="sm" color="primary" onClick={() => this.setState({ currentStep: 'validation' })}>
              Next
            </Button>
          </div>
        </div>
      </Col>
    )
  }

  render() {
    let page
    if (this.state.currentStep === 'input') {
      page = this.renderForm()
    } else if (this.state.currentStep === 'validation') {
      page = this.renderValidation()
    } else {
      page = this.renderSuccess()
    }

    const { isOpen } = this.props
    return (
      <Modal isOpen={isOpen} toggle={this.toggle} size="lg">
        <ModalHeader toggle={this.toggle}>Buy new license</ModalHeader>
        <ModalBody>{page}</ModalBody>
      </Modal>
    )
  }
}
