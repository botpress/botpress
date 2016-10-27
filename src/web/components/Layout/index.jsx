import React from 'react'

import Header from './Header'
import Sidebar from './Sidebar'

import style from './style.scss'

class Layout extends React.Component {

  render() {
    return (
      <div className="wrapper">
        <Sidebar>
          <Header />
          <section className={style.container}>{this.props.children}</section>
        </Sidebar>
      </div>
    )
  }
}

export default Layout
