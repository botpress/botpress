import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { Col, Button } from 'reactstrap'
import _ from 'lodash'
import SectionLayout from '../Layouts/Section'
import CustomizeLicenseForm from '../Components/Licensing/CustomizeLicenseForm'
import api from '../../api'

const DEFAULT_SEATS = 1
let childWindow

class BuyPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      seats: DEFAULT_SEATS,
      price: DEFAULT_SEATS * 100,
      success: false,
      error: false
    }
  }

  componentDidMount() {
    this.setState({
      user: _.omit(this.props.licensingAccount, ['token'])
    })

    window.onmessage = e => {
      if (e.data.action === 'getUserInfo') {
        const message = {
          action: 'updateUserInfo',
          payload: this.state.user
        }

        childWindow.postMessage(message, '*')
      } else if (e.data.action === 'saveUserCard') {
        this.subscribeUser(e.data.payload, e.data.promoCode)
      }
    }
  }

  centerPopup(url, title, w, h) {
    const y = window.outerHeight / 2 + window.screenY - h / 2
    const x = window.outerWidth / 2 + window.screenX - w / 2
    return window.open(url, title, 'toolbar=no, status=no, width=' + w + ', height=' + h + ', top=' + y + ', left=' + x)
  }

  subscribeUser = (source, promoCode) => {
    api
      .getLicensing()
      .post(`/me/keys`, {
        source,
        promoCode,
        user: this.state.user,
        seats: this.state.seats
      })
      .then(this.buySuccess)
      .catch(err => {
        console.error('cannot buy license', err)
        this.setState({ loading: false, error: true })
      })
  }

  buySuccess = () => {
    this.setState({ success: true })

    window.setTimeout(() => {
      this.props.history.push('/licensing/keys')
    }, 1250)
  }

  openBuyPopup = () => {
    childWindow = this.centerPopup(api.getStripePath(), 'Payment Option', 480, 280)
  }

  handleTotalChanged = price => this.setState({ price })
  handleSeatsChanged = seats => this.setState({ seats })

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

  renderForm() {
    return (
      <Fragment>
        <Col md={{ size: 4 }}>
          <CustomizeLicenseForm onSeatsChanged={this.handleSeatsChanged} onTotalChanged={this.handleTotalChanged} />
        </Col>

        <div className="checkout">
          <span className="checkout__total">
            <strong>Total:</strong> {this.state.price}$<sup>/month</sup>
          </span>
          <div className="checkout__buy">
            <Button onClick={this.openBuyPopup}>Buy</Button>
          </div>
        </div>
      </Fragment>
    )
  }

  render() {
    const page = this.state.success ? this.renderSuccess() : this.renderForm()
    return <SectionLayout title="Buy new license" activePage="licensing-buy" mainContent={page} />
  }
}

const mapStateToProps = state => ({
  licensingAccount: state.license.licensingAccount
})

export default connect(
  mapStateToProps,
  null
)(BuyPage)
