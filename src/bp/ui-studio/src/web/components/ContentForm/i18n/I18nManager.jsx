import React from 'react'
import { Tooltip, OverlayTrigger } from 'react-bootstrap'
import { MdErrorOutline } from 'react-icons/md'
import style from './style.scss'

export default class Translate extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      fieldName: null,
      value: undefined
    }
  }

  componentDidMount() {
    const { defaultLang, activeLang } = this.props.formContext
    if (defaultLang === activeLang) {
      return this.setState({ fieldName: this.props.name, value: this.props.formContext[this.props.name] })
    }

    const fieldName = `${this.props.name}$${activeLang}`
    const isMissing = this.props.formContext[fieldName] === undefined

    this.setState({
      fieldName,
      isMissing,
      value: this.props.formContext[fieldName] || '',
      placeholder: this.props.formContext[this.props.name] || ''
    })
  }

  handleOnChange = value => {
    this.setState({ value })

    this.props.formContext.updateProp(this.state.fieldName, value)
    this.props.onChange('update')
  }

  renderWrapped(component) {
    const { activeLang } = this.props.formContext

    return (
      <div className={style.flexContainer}>
        <div style={{ width: '100%' }}>{component}</div>
        <div className={style.missingIcon}>
          {this.state.isMissing && (
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="tooltip">Translation missing for current language ({activeLang})</Tooltip>}
            >
              <MdErrorOutline />
            </OverlayTrigger>
          )}
        </div>
      </div>
    )
  }
}
