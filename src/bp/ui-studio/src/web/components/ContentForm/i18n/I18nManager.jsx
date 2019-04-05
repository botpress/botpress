import React from 'react'
import { FormControl, Tooltip, OverlayTrigger } from 'react-bootstrap'
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
    const context = this.props.formContext
    const fieldName = `${this.props.name}$${context.activeLang}`
    const isMissing = context[fieldName] === undefined

    this.setState({
      isMissing,
      fieldName,
      value: isMissing ? context[this.props.name] : context[fieldName]
    })
  }

  handleOnChange = value => {
    this.setState({ value })
    const { defaultLang, activeLang, updateProp } = this.props.formContext

    const fieldName = defaultLang === activeLang ? this.props.name : this.state.fieldName
    updateProp(fieldName, value)
    this.props.onChange('test')
  }

  renderWrapped(component) {
    return (
      <div className={style.flexContainer}>
        <div style={{ width: '100%' }}>{component}</div>
        <div className={style.missingIcon}>
          {this.state.isMissing && (
            <OverlayTrigger
              placement="bottom"
              overlay={<Tooltip id="tooltip">Translation missing for current language</Tooltip>}
            >
              <MdErrorOutline />
            </OverlayTrigger>
          )}
        </div>
      </div>
    )
  }
}
