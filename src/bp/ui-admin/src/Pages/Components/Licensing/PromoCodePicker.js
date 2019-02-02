import React from 'react'
import { MdCheck, MdClose } from 'react-icons/lib/md'
import api from '../../../api'
import _ from 'lodash'

export default class PromoCodePicker extends React.Component {
  promoCodeInput = React.createRef()

  state = {
    promoCode: '',
    isCodeValid: undefined
  }

  componentDidMount() {
    this.debounceHandleValidate = _.debounce(() => this.validateCode(), 500)
  }

  validateCode = async () => {
    if (!this.state.promoCode.length) {
      return
    }

    try {
      const licensing = await api.getLicensing()
      await licensing.post(`/promo/check`, { promoCode: this.state.promoCode })
      this.setState({ isCodeValid: true })
      this.props.onUpdate({ promoCode: this.state.promoCode, isPromoCodeValid: true })
    } catch (error) {
      this.setState({ isCodeValid: false })
    }
  }

  handlePromoCodeChanged = e => {
    const promoCode = e.target.value
    const isCodeEmpty = promoCode.length === 0

    this.props.onUpdate({ promoCode, isPromoCodeValid: isCodeEmpty })
    this.setState({ promoCode })
    this.debounceHandleValidate()
  }

  render() {
    return (
      <div>
        <b>Promo Code</b>
        {this.state.isCodeValid !== undefined &&
          (this.state.isCodeValid ? <MdCheck color="green" /> : <MdClose color="red" />)}
        <br />
        <small>If you have a promo code, please enter it below:</small>
        <input
          placeholder="bp-promo123"
          className="form-control"
          type="text"
          size="sm"
          ref={this.promoCodeInput}
          value={this.state.promoCode}
          onChange={this.handlePromoCodeChanged}
        />
      </div>
    )
  }
}
