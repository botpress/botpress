import React from 'react'
import { Tooltip, OverlayTrigger } from 'react-bootstrap'
import { MdErrorOutline } from 'react-icons/md'
import style from './style.scss'

export default class I18nManager extends React.Component {
  state = {
    placeholder: '',
    isMissing: false
  }

  componentDidMount() {
    const { defaultLang, activeLang } = this.props.formContext

    const isDefaultLang = defaultLang === activeLang
    const isMissing = this.props.formContext[this.props.name + '$' + activeLang] === undefined

    this.setState({
      isMissing: !isDefaultLang && isMissing && this.props.required,
      placeholder: this.props.formContext[this.props.name + '$' + defaultLang] || ''
    })
  }

  handleOnChange = value => {
    this.props.onChange(value)
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
