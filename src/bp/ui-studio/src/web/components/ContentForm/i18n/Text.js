import React from 'react'
import { FormControl } from 'react-bootstrap'
import classnames from 'classnames'
import style from './style.scss'

export default class MultiLang extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      activeLang: null,
      fieldName: null,
      text: ''
    }
  }

  componentDidMount() {
    const context = this.props.formContext
    const activeLang = context.activeLang

    const fieldName = `${this.props.name}$${activeLang}`
    const isMissing = context[fieldName] === undefined

    this.setState({
      activeLang,
      fieldName,
      isMissing,
      text: isMissing ? context[this.props.name] : context[fieldName]
    })
  }

  handleOnChange = event => {
    this.setState({ text: event.target.value })
    this.props.formContext.updateProp(this.state.fieldName, event.target.value)
    this.props.onChange('test')
  }

  render() {
    return (
      <div className={classnames({ [style.missingLang]: this.state.isMissing })}>
        lang: {this.state.activeLang} | missing: {this.state.isMissing ? 'yes' : 'no'}
        <FormControl type="text" value={this.state.text} onChange={this.handleOnChange} placeholder="Type some text " />
        {this.state.missingLanguage && <div>language missing!</div>}
      </div>
    )
  }
}
