import React from 'react'
import SplitterLayout from 'react-splitter-layout'
import style from './style.scss'

export default class EntityEditor extends React.Component {
  render() {
    return (
      <div className={style.container}>
        <div className={style.header}>
          <div className="pull-left">
            <h1>
              entities/
              <span className={style.intent}>Artist</span>
            </h1>
          </div>
        </div>
        <SplitterLayout secondaryInitialSize={350} secondaryMinSize={200}>
          <div>YO!!!!</div>
          <div>Hey!</div>
        </SplitterLayout>
      </div>
    )
  }
}
