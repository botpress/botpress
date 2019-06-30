import React, { Fragment } from 'react'
import { Dropdown, Glyphicon } from 'react-bootstrap'
import _ from 'lodash'

import withLanguage from '../../Util/withLanguage'
import ActionItem from './ActionItem'
import { keyMap } from '~/keyboardShortcuts'
import style from './StatusBar.styl'
import Flag from 'react-world-flags'

const STORAGE_KEY = `bp::${window.BOT_ID}::cmsLanguage`
const langFlagsMap = {
  fr: 'fr',
  en: 'gb',
  ja: 'jp',
  ru: 'rus',
  ar: 'eh',
  pt: 'prt',
  sp: 'esp',
  ko: 'kor'
}

class LangSwitcher extends React.Component {
  elems = {}

  componentDidMount() {
    this.restoreLastLanguage()
  }

  componentDidUpdate(prevProps) {
    let idx = this.props.languages.findIndex(l => l == this.props.contentLang)
    if (idx != -1 && !_.isEmpty(this.elems)) {
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
    if (e.key == 'Enter') {
      this.switchLang(l)
    }
  }

  switchLang = lang => {
    this.props.changeContentLanguage(lang)
    this.props.toggleLangSwitcher()

    localStorage.setItem(STORAGE_KEY, lang)
  }

  //react-bootstrap warning otherwise
  onToggle() {}

  render() {
    if (this.props.languages.length <= 1) {
      return null
    }

    return (
      <Fragment>
        <ActionItem
          shortcut={keyMap['lang-switcher']}
          title="Content Language"
          description={`Change the bot content language. Currently editing: ${this.props.contentLang.toUpperCase()}`}
          onClick={this.props.toggleLangSwitcher}
        >
          <span>
            <Flag code={langFlagsMap[this.props.contentLang] || ''} height={10} />
            &nbsp;
            {this.props.contentLang.toUpperCase()}
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
                tabIndex="-1"
                ref={el => (this.elems[idx] = el)}
                key={l}
                className={style.langItem}
                onClick={this.switchLang.bind(this, l)}
                onKeyDown={this.handleKeyDown.bind(this, l)}
              >
                <Flag code={langFlagsMap[l] || ''} height={14} />
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
