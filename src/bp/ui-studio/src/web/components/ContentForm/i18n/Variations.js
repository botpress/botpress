import React from 'react'
import ArrayField from 'react-jsonschema-form/lib/components/fields/ArrayField'
import classnames from 'classnames'
import style from './style.scss'

export default class Variations extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      activeLang: null,
      fieldName: null,
      variations: []
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
      variations: isMissing ? context[this.props.name] : context[fieldName]
    })
  }

  handleOnChange = value => {
    this.setState({ variations: value })
    this.props.formContext.updateProp(this.state.fieldName, value)
    this.props.onChange('test')
  }

  render() {
    return (
      <div className={classnames({ [style.missingLang]: this.state.isMissing })}>
        lang: {this.state.activeLang} | missing: {this.state.isMissing ? 'yes' : 'no'}
        <ArrayField {...this.props} formData={this.state.variations} onChange={this.handleOnChange} />
      </div>
    )
  }
}
