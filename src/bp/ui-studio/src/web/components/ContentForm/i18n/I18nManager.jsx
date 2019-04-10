import React from 'react'
import { Tooltip, OverlayTrigger } from 'react-bootstrap'
import { MdErrorOutline } from 'react-icons/md'
import style from './style.scss'

export default class I18nManager extends React.Component {
  state = {
    placeholder: ''
  }

  componentDidMount() {
    this.setState({
      placeholder: this.props.formContext[this.props.name + '$' + this.props.formContext.defaultLang] || ''
    })
  }

  showMissingIcon = () => {
    const { defaultLang, activeLang } = this.props.formContext
    if (defaultLang === activeLang) {
      return false
    }

    const isDefaultLangSet = this.props.formContext[this.props.name + '$' + defaultLang] !== undefined
    const isActiveLangSet = this.props.formContext[this.props.name + '$' + activeLang] !== undefined
    const isEmpty = !this.props.formData || !this.props.formData.length

    return isDefaultLangSet && (!isActiveLangSet || isEmpty)
  }

  handleOnChange = value => {
    this.props.onChange(value)
  }

  useDefaultLangText = () => {
    this.props.onChange(this.state.placeholder)
  }

  renderWrapped(component) {
    const isMissing = this.showMissingIcon()

    return (
      <div className={style.flexContainer}>
        <div style={{ width: '100%' }}>{component}</div>
        <div className={style.missingIcon}>
          {isMissing && (
            <OverlayTrigger
              placement="bottom"
              overlay={
                <Tooltip id="tooltip">
                  Translation missing for current language ({this.props.formContext.activeLang}
                  ). Click here to copy the default language text
                </Tooltip>
              }
            >
              <MdErrorOutline onClick={() => this.props.onChange(this.state.placeholder)} />
            </OverlayTrigger>
          )}
        </div>
      </div>
    )
  }
}
