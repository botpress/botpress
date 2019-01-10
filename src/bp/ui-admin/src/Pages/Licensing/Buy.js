import React, { Fragment } from 'react'
import { Redirect } from 'react-router-dom'
import { Col, Button } from 'reactstrap'
import _ from 'lodash'
import SectionLayout from '../Layouts/Section'
import CustomizeLicenseForm from '../Components/Licensing/CustomizeLicenseForm'
import api from '../../api'
import { getSession, isAuthenticated } from '../../Auth/licensing'

const DEFAULT_SEATS = 1
let childWindow

export default class BuyPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      seats: DEFAULT_SEATS,
      total: DEFAULT_SEATS * 100,
      success: false,
      error: false
    }
  }

  componentDidMount() {
    const session = getSession()
    this.setState({
      user: _.pick(session, ['email', 'name'])
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
        seats: this.state.seats,
        label: this.state.label
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

  handleDetailsUpdated = details => this.setState({ ...details })

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
          <CustomizeLicenseForm onUpdate={this.handleDetailsUpdated} />

          <div className="checkout">
            <span className="checkout__total">
              <strong>Total:</strong> {this.state.total}$<sup>/month</sup>
            </span>
            <div className="checkout__buy">
              <Button size="sm" color="primary" onClick={this.openBuyPopup}>
                Buy
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

    const page = this.state.success ? this.renderSuccess() : this.renderForm()
    return <SectionLayout title="Buy new license" activePage="licensing-buy" mainContent={page} />
  }
}
