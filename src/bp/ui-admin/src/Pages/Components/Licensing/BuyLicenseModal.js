import React from 'react'
import { StripeProvider, Elements } from 'react-stripe-elements'
import { Modal, ModalHeader, ModalBody, Button } from 'reactstrap'
import Iframe from 'react-iframe'
import api from '../../../api'

const DEFAULT_STATE = {
  promoCodeVisible: false,
  promoCode: '',
  success: false,
  loading: false,
  error: false,
  stripe: null
}

export default class BuyLicenseModal extends React.Component {
  state = { ...DEFAULT_STATE }
  promoCodeInput = React.createRef()

  toggle = () => {
    this.setState({ ...DEFAULT_STATE })
    this.props.toggle()
  }

  setLoading = () => {
    this.setState({ loading: true })
  }

  buySuccess = () => {
    const { onSuccess } = this.props
    this.setState({ success: true })
    window.setTimeout(onSuccess, 1250)
  }

  togglePromoCode = () => {
    this.setState({ promoCodeVisible: !this.state.promoCodeVisible }, () => {
      if (this.promoCodeInput.current) {
        this.promoCodeInput.current.focus()
      }
    })
  }

  subscribeUser = source => {
    const { userInfo, seats } = this.props
    api
      .getLicensing()
      .post(`/me/keys`, {
        promoCode: this.state.promoCode,
        user: userInfo,
        source,
        seats
      })
      .then(this.buySuccess)
      .catch(err => {
        console.error('cannot buy license', err)
        this.setState({ loading: false, error: true })
      })
  }

  render() {
    const { opened, userInfo } = this.props
    return (
      <StripeProvider stripe={this.state.stripe}>
        <Modal isOpen={opened} toggle={this.toggle}>
          <ModalHeader toggle={this.toggle}>Confirm your payment</ModalHeader>
          <ModalBody>
            <Iframe url="https://botpress.io/" width="450px" height="150px" display="initial" position="relative" />
          </ModalBody>
        </Modal>
      </StripeProvider>
    )
  }
}
