import React, { Component } from 'react'
import RangeSlider from '../RangeSlider'
import IconTooltip from '../IconTooltip'

const PRO_SEAT_PRICE = 95

export default class CustomizeLicenseForm extends Component {
  state = {
    seats: 1,
    total: PRO_SEAT_PRICE,
    support: 'standard',
    type: 'online'
  }

  componentDidMount() {
    if (this.props.license) {
      this.handleSeatsChanged(this.props.license.seats)
    }
  }

  handleSeatsChanged = seats => {
    const total = PRO_SEAT_PRICE * seats
    this.setState({ seats, total })

    this.props.onSeatsChanged(seats)
    this.props.onTotalChanged(total)
  }

  handleChangeSupport = e => this.setState({ support: e.target.value })
  handleChangeType = e => this.setState({ type: e.target.value })

  render() {
    return (
      <form className="form">
        <fieldset className="form-fieldset">
          <label className="form__label">Nodes</label>
          <RangeSlider initialValue={this.state.seats} min={1} max={50} onUpdate={this.handleSeatsChanged} />
          {this.state.seats > 15 && (
            <p>
              Seems like you're special,
              <a href="https://botpress.typeform.com/to/QaznSq" target="_blank" rel="noopener noreferrer">
                Let's talk !
              </a>
            </p>
          )}
        </fieldset>
        <span className="form__label">Support</span>
        <fieldset className="form-fieldset">
          <label htmlFor="standard" className="form__label form__label--radio">
            <input
              name="support"
              type="radio"
              value="standard"
              checked={this.state.support === 'standard'}
              onChange={this.handleChangeSupport}
            />
            <span>Standard (included)</span>
            <IconTooltip className="tooltip--light">
              <span>Technical questions by email or forum. We respond in under 48hrs..</span>
            </IconTooltip>
          </label>
          <label htmlFor="gold" className="form__label form__label--radio">
            <input
              name="support"
              type="radio"
              value="gold"
              disabled
              checked={this.state.support === 'gold'}
              onChange={this.handleChangeSupport}
            />
            <span>Gold (Available soon)</span>
            <IconTooltip className="tooltip--light">
              <span>
                Technical questions by email, support center or phone. Priority bug fixes. Same-day reply (10AM - 4PM
                EST).
              </span>
            </IconTooltip>
          </label>
        </fieldset>
        <span className="form__label">Type</span>
        <fieldset className="form-fieldset">
          <label htmlFor="online" className="form__label form__label--radio">
            <input
              id="online"
              type="radio"
              value="online"
              checked={this.state.type === 'online'}
              onChange={this.handleChangeType}
            />
            <span>Online verification</span>
            <IconTooltip className="tooltip--light">
              <span>Your installation of Botpress will need to contact our licensing server on a daily basis.</span>
            </IconTooltip>
          </label>
          <label htmlFor="offline" className="form__label form__label--radio">
            <input
              id="offline"
              type="radio"
              value="offline"
              disabled
              checked={this.state.type === 'offline'}
              onChange={this.handleChangeType}
            />
            <span>Offline license</span>
            <IconTooltip className="tooltip--light">
              <span>
                <a href="mailto:info@botpress.io">Contact us</a>. Available for contracts over 5000$/month.
              </span>
            </IconTooltip>
          </label>
        </fieldset>
      </form>
    )
  }
}
