import React from 'react'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
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

  componentDidMount() {
    window.onmessage = e => {
      if (e.data.action === 'getUserInfo') {
        const message = {
          action: 'updateUserInfo',
          payload: this.props.userInfo
        }

        document.getElementById('iframe').contentWindow.postMessage(message, '*')
      } else if (e.data.action === 'saveUserCard') {
        this.subscribeUser(e.data.payload)
      }
    }
  }

  toggle = () => {
    this.setState({ ...DEFAULT_STATE })
    this.props.toggle()
  }

  setLoading = () => {
    this.setState({ loading: true })
  }

  buySuccess = () => {
    this.setState({ success: true })
    window.setTimeout(this.props.onSuccess, 1250)
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
    return (
      <Modal isOpen={this.props.opened} toggle={this.toggle}>
        <ModalHeader toggle={this.toggle}>Confirm your payment</ModalHeader>
        <ModalBody>
          <Iframe
            id="iframe"
            url={api.getStripePath()}
            width="470px"
            height="300px"
            display="initial"
            position="relative"
          />
        </ModalBody>
      </Modal>
    )
  }
}
