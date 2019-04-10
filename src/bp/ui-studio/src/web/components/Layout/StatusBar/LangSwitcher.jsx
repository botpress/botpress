import React, { Fragment } from 'react'
import { Dropdown, Glyphicon } from 'react-bootstrap'
import _ from 'lodash'

import withLanguage from '../../Util/withLanguage'
import ActionItem from './ActionItem'
import { keyMap } from '~/keyboardShortcuts'
import style from './StatusBar.styl'

class LangSwitcher extends React.Component {
  elems = {}

  componentDidUpdate() {
    let idx = this.props.languages.findIndex(l => l == this.props.contentLang)
    if (idx != -1 && !_.isEmpty(this.elems)) {
      this.elems[idx].focus()
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

  switchLang = l => {
    this.props.changeContentLanguage(l)
    this.props.toggleLangSwitcher()
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
          className={style.right}
          title="Content Language"
          description={`Change the bot content language. Currently editing: ${this.props.contentLang.toUpperCase()}`}
          onClick={this.props.toggleLangSwitcher}
        >
          <span>
            <Glyphicon glyph="globe" />
            &nbsp;
            {this.props.contentLang.toUpperCase()}
          </span>
        </ActionItem>
        <Dropdown
          className={style.right}
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
                {l.toUpperCase()}
              </li>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </Fragment>
    )
  }
}

export default withLanguage(LangSwitcher)
