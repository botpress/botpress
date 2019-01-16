import React, { Fragment, Component } from 'react'
import { Tooltip } from 'reactstrap'

export default class IconTooltip extends Component {
  id = `tooltip-${Math.floor(Math.random() * 100)}`
  state = {
    isOpen: false
  }

  toggle = () => this.setState({ isOpen: !this.state.isOpen })

  render() {
    return (
      <Fragment>
        <svg
          href="#"
          id={this.id}
          className="form-fieldset__icon"
          width="15"
          height="15"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 16h2v-2H9v2zm1-16C4.477 0 0 4.477 0 10A10 10 0 1 0 10 0zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14a4 4 0 0 0-4 4h2a2 2 0 1 1 4 0c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5a4 4 0 0 0-4-4z"
            fill="#4A4A4A"
            fillRule="nonzero"
          />
        </svg>
        <Tooltip
          autohide={false}
          className={this.props.className}
          delay={{ show: 100, hide: 30 }}
          isOpen={this.state.isOpen}
          placement="right"
          target={this.id}
          toggle={this.toggle}
        >
          {this.props.children}
        </Tooltip>
      </Fragment>
    )
  }
}
