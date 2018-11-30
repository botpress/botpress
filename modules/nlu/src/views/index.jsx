import React from 'react'
import classnames from 'classnames'
import { Collapse, Button, Glyphicon } from 'react-bootstrap'
import _ from 'lodash'

import EntitiesComponent from './entities'

import IntentEditor from './intents'
import style from './style.scss'

// Exports SubViews
export const entities = props => new EntitiesComponent(props)

export default class Module extends React.Component {
  state = {
    showNavIntents: true,
    intents: [],
    currentIntent: null,
    filterValue: '',
    isSyncing: false
  }

  componentDidMount() {
    this.fetchIntents()
    this.checkSync()
  }

  sync = () => {
    return this.props.bp.axios
      .get('/mod/nlu/sync')
      .catch(err => this.setState({ syncFailedError: err.response.data }))
      .then(() => {
        // Set animation timeout
        setTimeout(() => this.setState({ isSyncing: false }), 2000)
      })
  }

  checkSync = _.throttle(() => {
    this.props.bp.axios.get('/mod/nlu/sync/check').then(res => {
      if (res.data) {
        this.setState({ isSyncing: true }, this.sync)
      } else {
        this.setState({ isSyncing: false })
      }
    })
  }, 1000)

  fetchIntents = () => {
    return this.props.bp.axios.get('/mod/nlu/intents').then(res => {
      const dataToSet = { intents: res.data }

      if (!this.state.currentIntent) {
        dataToSet.currentIntent = _.get(_.first(res.data), 'name')
      }

      this.setState(dataToSet)
    })
  }

  toggleProp = prop => () => {
    this.setState({ [prop]: !this.state[prop] })
  }

  getIntents = () => this.state.intents || []

  getCurrentIntent = () => _.find(this.getIntents(), { name: this.state.currentIntent })

  onFilterChanged = event => this.setState({ filterValue: event.target.value })

  setCurrentIntent = name => {
    if (this.state.currentIntent !== name) {
      if (this.intentEditor && this.intentEditor.onBeforeLeave) {
        if (this.intentEditor.onBeforeLeave() !== true) {
          return
        }
      }

      this.setState({ currentIntent: name })
    }
  }

  createNewIntent = () => {
    const name = prompt('Enter the name of the new intent')

    if (!name || !name.length) {
      return
    }

    if (/[^a-z0-9-_.]/i.test(name)) {
      alert('Invalid name, only alphanumerical characters, underscores and hypens are accepted')
      return this.createNewIntent()
    }

    return this.props.bp.axios
      .post(`/mod/nlu/intents/${name}`, {
        utterances: [],
        slots: []
      })
      .then(this.fetchIntents)
      .then(() => this.setCurrentIntent(name))
  }

  getFilteredIntents() {
    return this.getIntents().filter(i => {
      if (this.state.filterValue.length && !i.name.toLowerCase().includes(this.state.filterValue.toLowerCase())) {
        return false
      }
      return true
    })
  }

  deleteIntent = intent => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the intent "${intent}" ?`)
    if (confirmDelete) {
      return this.props.bp.axios.delete(`/mod/nlu/intents/${intent}`).then(this.fetchIntents)
    }
  }

  renderCategory() {
    const intents = this.getFilteredIntents()

    const caret = classnames(style.caret, {
      [style.inverted]: !this.state.showNavIntents
    })

    const getClassName = el =>
      classnames({
        [style.active]: this.getCurrentIntent() === el
      })

    return (
      <div className={style.intentsContainer}>
        <div>
          <span>Intents ({intents.length})</span>
          <span className={caret} onClick={this.toggleProp('showNavIntents')}>
            <span className="caret" />
          </span>
        </div>
        <Collapse in={this.state.showNavIntents}>
          <ul className={style.intentsList}>
            {intents.map((el, i) => (
              <li key={i} className={getClassName(el)} onClick={() => this.setCurrentIntent(el.name)}>
                <span>
                  {el.name}
                  &nbsp;(
                  {_.get(el, 'utterances.length') || 0})
                </span>
                <Glyphicon className={style.deleteIntent} glyph="trash" onClick={() => this.deleteIntent(el.name)} />
              </li>
            ))}
          </ul>
        </Collapse>
      </div>
    )
  }

  onUtterancesChange = () => {
    this.checkSync()
  }

  render() {
    return (
      <div className={style.workspace}>
        <div>
          <div className={style.main}>
            <nav className={style.navigationBar}>
              <div className={style.create}>
                <Button bsStyle="primary" block onClick={this.createNewIntent}>
                  Create new intent
                </Button>
              </div>
              <div className={style.sync}>
                {this.state.isSyncing ? (
                  <div className={style.out}>
                    <Glyphicon glyph="refresh" />
                    &nbsp;Syncing Model
                  </div>
                ) : (
                  <div className={style.in}>
                    <Glyphicon glyph="ok" />
                    &nbsp;Model is up to date
                  </div>
                )}
              </div>

              <div className={style.filter}>
                <p>
                  <input
                    type="text"
                    value={this.state.filterValue}
                    placeholder="filter..."
                    onChange={this.onFilterChanged}
                  />
                </p>
              </div>
              <div className={style.list}>{this.renderCategory()}</div>
            </nav>
            <div className={style.childContent}>
              <IntentEditor
                ref={el => (this.intentEditor = el)}
                intent={this.getCurrentIntent()}
                router={this.props.router}
                axios={this.props.bp.axios}
                reloadIntents={this.fetchIntents}
                onUtterancesChange={this.onUtterancesChange}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
