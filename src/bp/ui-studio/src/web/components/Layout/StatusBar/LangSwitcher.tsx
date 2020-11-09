import { lang, utils } from 'botpress/shared'
import _ from 'lodash'
import React, { Fragment } from 'react'
import { Dropdown } from 'react-bootstrap'

import withLanguage from '../../Util/withLanguage'

import style from './style.scss'
import ActionItem from './ActionItem'

const requireFlag = code => {
  try {
    return require(`../../../img/flags/${code}.svg`)
  } catch (err) {
    return requireFlag('missing')
  }
}

interface Props {
  contentLang: string
  languages: any
  changeContentLanguage: any
  toggleLangSwitcher: any
  langSwitcherOpen: boolean
}

const STORAGE_KEY = `bp::${window.BOT_ID}::cmsLanguage`

class LangSwitcher extends React.Component<Props> {
  elems = {}

  componentDidMount() {
    this.restoreLastLanguage()
  }

  componentDidUpdate(prevProps) {
    const idx = this.props.languages.findIndex(l => l === this.props.contentLang)
    if (idx !== -1 && !_.isEmpty(this.elems)) {
      this.elems[idx].focus()
    }

    if (prevProps.languages !== this.props.languages) {
      this.restoreLastLanguage()
    }
  }

  restoreLastLanguage() {
    const lastLang = localStorage.getItem(STORAGE_KEY)
    if (!this.props.languages || !this.props.languages.length || !lastLang) {
      return
    }

    if (this.props.languages.includes(lastLang)) {
      this.props.changeContentLanguage(lastLang)
    }
  }

  componentWillUnmount() {
    this.elems = null
  }

  handleKeyDown = (l, e) => {
    if (e.key === 'Enter') {
      this.switchLang(l)
    }
  }

  switchLang = lang => {
    this.props.changeContentLanguage(lang)
    this.props.toggleLangSwitcher()

    localStorage.setItem(STORAGE_KEY, lang)
  }

  // react-bootstrap warning otherwise
  onToggle() {}

  render() {
    if (this.props.languages.length <= 1) {
      return null
    }

    return (
      <Fragment>
        <ActionItem
          shortcut={utils.keyMap['lang-switcher']}
          title={lang.tr('statusBar.contentLanguage')}
          description={lang.tr('statusBar.switchLang', { currentLang: this.props.contentLang.toUpperCase() })}
          onClick={this.props.toggleLangSwitcher}
        >
          <span className={style.flagWrapper}>
            <img src={requireFlag(this.props.contentLang)} alt={this.props.contentLang} className={style.flag} />
            <span>{this.props.contentLang.toUpperCase()}</span>
          </span>
        </ActionItem>
        <Dropdown
          pullRight
          dropup={true}
          open={this.props.langSwitcherOpen}
          onToggle={this.onToggle}
          id="lang-switcher"
        >
          {/* react-bootstrap warning otherwise */}
          <Dropdown.Toggle style={{ display: 'none' }} />
          <Dropdown.Menu pullRight onClose={this.props.toggleLangSwitcher} className={style.langSwitherMenu}>
            {this.props.languages.map((l, idx) => (
              <li
                tabIndex={-1}
                ref={el => (this.elems[idx] = el)}
                key={l}
                className={style.langItem}
                onClick={this.switchLang.bind(this, l)}
                onKeyDown={this.handleKeyDown.bind(this, l)}
              >
                <img src={requireFlag(l)} alt={l} className={style.flag} />
                <span>{l.toUpperCase()}</span>
              </li>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </Fragment>
    )
  }
}

export default withLanguage(LangSwitcher)
