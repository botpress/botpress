import _ from 'lodash'
import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { MdErrorOutline } from 'react-icons/md'

import style from './style.scss'

interface Props {
  formData: any
  formContext: any
  name: string
  onChange: (text: string) => void
}

interface State {
  placeholder: string
}

export default class I18nManager extends React.Component<Props, State> {
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

    const isDefaultLangSet = this.isPropertySet(this.props.name + '$' + defaultLang)
    const isActiveLangSet = this.isPropertySet(this.props.name + '$' + activeLang)
    const isEmpty = !this.props.formData || !this.props.formData.length

    return isDefaultLangSet && (!isActiveLangSet || isEmpty)
  }

  isPropertySet(propName) {
    const value = this.props.formContext[propName]
    if (value === undefined || (_.isArray(value) && value.length === 1 && _.every(_.values(value[0]), _.isEmpty))) {
      return false
    }

    return true
  }

  handleOnChange = value => {
    this.props.onChange(value)
  }

  useDefaultLangText = () => {
    const original = this.props.formContext[this.props.name + '$' + this.props.formContext.defaultLang]
    original && this.handleOnChange(original)
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
              <MdErrorOutline onClick={this.useDefaultLangText} />
            </OverlayTrigger>
          )}
        </div>
      </div>
    )
  }
}
