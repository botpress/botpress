import React, { Component } from 'react'
import style from './style.scss'

class FormElement extends Component {
  constructor(props) {
    super(props)
    this.state = { hide: false }
  }

  changeState(field) {
    return e => {
      this.props.parent.setState({ [field]: e.target.value })
    }
  }

  render() {
    switch (this.props.type) {
      case 'input':
        return (
          <div className={style.formGroup}>
            <label>{this.props.label}</label>
            <input
              className={style.formInput}
              type={this.props.subtype}
              placeholder={this.props.placeholder}
              name={this.props.name}
              onChange={::this.changeState(this.props.name)}
              maxLength={this.props.maxlength}
              minLength={this.props.minlength}
              required={this.props.required}
            />
          </div>
        )
        break
      case 'textarea':
        return (
          <div className={style.formGroup}>
            <label>{this.props.label}</label>
            <textarea
              type={this.props.subtype}
              className={style.formTextarea}
              placeholder={this.props.placeholder}
              name={this.props.name}
              onChange={::this.changeState(this.props.name)}
              maxLength={this.props.maxlength}
              minLength={this.props.minlength}
              required={this.props.required}
            />
          </div>
        )
        break
      case 'select':
        const options = this.props.options.map(se => <option value={se.option.value}>{se.option.label}</option>)
        let placeholder = ''
        if (this.props.placeholder) {
          placeholder = <option value="">{this.props.placeholder}</option>
        }
        return (
          <div className={style.formGroup}>
            <label>{this.props.label}</label>
            <select
              className={style.formInput}
              value={this.state.value}
              onChange={::this.changeState(this.props.name)}
              name={this.props.name}
              required={this.props.required}
            >
              {placeholder}
              {options}
            </select>
          </div>
        )
        break
    }
  }
}

export default class Form extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  handleSubmit(event) {
    event.preventDefault()
    if (this.props.onFormSend) {
      let representation = ''
      for (let key in this.state) representation += `${key}: ${this.state[key]}\n`
      this.props.onFormSend(this.state, this.props.formId, representation)
    }
  }

  handleClose(event) {
    this.setState({ hide: true })
  }

  render() {
    if (this.state.hide) return null
    if (!this.props.elements) return null
    const elements = this.props.elements.map(fe => <FormElement parent={this} {...this.props} {...fe} />)
    return (
      <div className={style.formOverlay}>
        <form className={style.formContainer} onSubmit={this.handleSubmit.bind(this)}>
          <div onClick={this.handleClose.bind(this)} className={style.formClose}>
            <svg version="1.1" width="15" height="15" xmlns="http://www.w3.org/2000/svg">
              <line x1="1" y1="15" x2="15" y2="1" stroke="grey" stroke-width="2" />
              <line x1="1" y1="1" x2="15" y2="15" stroke="grey" stroke-width="2" />
            </svg>
          </div>
          <div className={style.formTitle}>{this.props.title}</div>
          {elements}
          <div className={style.buttonLayer}>
            <input className={style.formSubmit} type="submit" value="Submit" />
          </div>
        </form>
      </div>
    )
  }
}
