import style from './StatusBar.styl'
import React from 'react'

export default class StatusBar extends React.Component {
  render() {
    return (
      <footer className={style.statusBar}>
        <span className={style.statusBar__version}>Botpress v.2029</span>
        <span className={style.statusBar__botName}>Hello-bot</span>
        <span className={style.statusBar__separator} />
        <div className={style.statusBarTabs}>
          <button className="window-trigger">
            <span className="window-trigger__shortcut">L</span>
            Console Log
            <span className="window-trigger__badge">4</span>
          </button>
        </div>
      </footer>
    )
  }
}
