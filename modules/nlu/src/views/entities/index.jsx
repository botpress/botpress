import React from 'react'

import style from '../style.scss'
import EntityEditor from './editor'
import SidePanel from './SidePanel'

export default class EntitiesComponent extends React.Component {
  state = {
    entities: [],
    filteredEntities: [],
    selectedEntity: undefined
  }

  componentDidMount() {
    this.fetchEntities()
  }

  fetchEntities = () => {
    this.props.bp.axios.get('/mod/nlu/entities').then(res => {
      const customEntities = res.data.filter(r => r.type !== 'system')
      this.setState({
        entities: customEntities,
        filteredEntities: customEntities,
        selectedEntity: customEntities[0]
      })
    })
  }

  onSearchChange = event => {
    if (event.target.value !== '') {
      const searchValue = event.target.value.toLowerCase()
      const filteredEntities = this.state.entities.filter(e => e.name.toLowerCase().includes(searchValue))
      this.setState({ filteredEntities })
    } else {
      this.setState({ filteredEntities: this.state.entities })
    }
  }

  selectEntity = entity => {
    this.setState({ selectedEntity: entity })
  }

  onEntityUpdate = entity => {
    return this.props.bp.axios.put(`/mod/nlu/entities/${entity.name}`, entity)
  }

  createEntityPrompt = () => {
    const name = prompt('Enter the name of the new entity')

    if (!name || !name.length) {
      return
    }

    if (/[^a-z0-9-_.]/i.test(name)) {
      alert('Invalid name, only alphanumerical characters, underscores and hypens are accepted')
      return null
    }

    return this.props.bp.axios
      .post(`/mod/nlu/entities/`, {
        name,
        type: 'list', // TODO: We need a ui option for that.
        occurences: []
      })
      .then(this.fetchEntities)
  }

  deleteEntity = entity => {
    const confirm = window.confirm(`Are you sure you want to delete the entity "${entity.name}"?`)
    if (!confirm) {
      return
    }

    return this.props.bp.axios.delete(`/mod/nlu/entities/${entity.name}`).then(this.fetchEntities)
  }

  render() {
    return (
      <div className={style.workspace}>
        <div>
          <div className={style.main}>
            <SidePanel
              entities={this.state.entities}
              selectedEntity={this.state.selectedEntity}
              onCreateClick={this.createEntityPrompt}
              onDeleteClick={this.deleteEntity}
              onEntityClick={this.selectEntity}
            />
            <div className={style.childContent}>
              <EntityEditor entity={this.state.selectedEntity} onUpdate={this.onEntityUpdate} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
