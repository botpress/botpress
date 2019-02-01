import React from 'react'
import { Modal, ModalHeader, ModalBody, Col, Button } from 'reactstrap'
import CustomizeLicenseForm from './CustomizeLicenseForm'
import CreditCardPicker from './CreditCardPicker'
import PromoCodePicker from './PromoCodePicker'
import api from '../../../api'
import { getCurrentUser } from '../../../Auth/licensing'

const DEFAULT_STATE = {
  currentStep: 'input',
  promoCode: '',
  isPromoCodeValid: undefined,
  isLoading: false
}

export default class BuyLicenseModal extends React.Component {
  state = { ...DEFAULT_STATE }

  componentDidMount() {
    const user = getCurrentUser()
    this.setState({
      user: {
        name: user.displayName,
        email: user.email
      }
    })
  }

  toggle = () => {
    this.setState({ ...DEFAULT_STATE })
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

      const licensing = await api.getLicensing()
      await licensing.post(`/me/keys`, subscription)
      this.setState({ isLoading: false, currentStep: 'success' })

      window.setTimeout(() => {
        this.props.refreshLicenses()
        this.toggle()
      }, 1250)
    } catch (error) {
      console.error('cannot buy license', error)
      this.setState({ isLoading: false, error: error.message })
    }
  }

  handleOrderUpdated = details => this.setState({ order: details })
  handleCardChanged = card => this.setState({ card })
  handlePromoCodeUpdated = ({ promoCode, isPromoCodeValid }) => this.setState({ promoCode, isPromoCodeValid })

  renderSuccess() {
    return (
      <div>
        <span>Thank you for your purchase!</span>
      </div>
    )
  }

  renderValidation() {
    return (
      <Col>
        <CreditCardPicker userInfo={this.state.user} onCardChanged={this.handleCardChanged} />
        <br />
        <PromoCodePicker onUpdate={this.handlePromoCodeUpdated} />
        <p>
          <br />
          <b>Total:</b> {this.state.order && this.state.order.totalPrice}$ per month
        </p>
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
          &lt; Edit my order
        </Button>
      </Col>
    )
  }

  renderForm() {
    return (
      <Col>
        <CustomizeLicenseForm license={this.state.order} onUpdate={this.handleOrderUpdated} />
        <Button
          size="sm"
          color="primary"
          style={{ float: 'right' }}
          onClick={() => this.setState({ currentStep: 'validation' })}
        >
          Continue to checkout
        </Button>
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

    return (
      <Modal isOpen={this.props.isOpen} toggle={this.toggle} size="lg">
        <ModalHeader toggle={this.toggle}>Buy new license</ModalHeader>
        <ModalBody>{page}</ModalBody>
      </Modal>
    )
  }
}
