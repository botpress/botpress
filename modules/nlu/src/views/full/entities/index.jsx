import React from 'react'

import style from '../style.scss'
import EntityEditor from './EntityEditor'
import SidePanel from './SidePanel'
import CreateEntityModal from './CreateEntityModal'

export class EntitiesComponent extends React.Component {
  state = {
    entities: [],
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
        selectedEntity: customEntities[0]
      })
    })
  }

  selectEntity = entity => {
    this.setState({ selectedEntity: entity })
  }

  onEntityUpdate = entity => {
    return this.props.bp.axios.put(`/mod/nlu/entities/${entity.id}`, entity).then(() => {
      const i = this.state.entities.findIndex(ent => ent.id == entity.id)
      this.setState({
        entities: [...this.state.entities.slice(0, i), entity, ...this.state.entities.slice(i + 1)]
      })
    })
  }

  toggleCreateModal = () => {
    this.setState({ createModalVisible: !this.state.createModalVisible })
  }

  deleteEntity = entity => {
    const confirm = window.confirm(`Are you sure you want to delete the entity "${entity.name}"?`)
    if (!confirm) {
      return
    }

    return this.props.bp.axios.delete(`/mod/nlu/entities/${entity.id}`).then(this.fetchEntities)
  }

  handleEntityCreated = entity => {
    this.setState({
      entities: [...this.state.entities, entity],
      selectedEntity: entity
    })
  }

  render() {
    return (
      <div className={style.workspace}>
        <div>
          <div className={style.main}>
            <SidePanel
              entities={this.state.entities}
              selectedEntity={this.state.selectedEntity}
              onCreateClick={this.toggleCreateModal}
              onDeleteClick={this.deleteEntity}
              onEntityClick={this.selectEntity}
            />
            <div className={style.childContent}>
              <EntityEditor entity={this.state.selectedEntity} onUpdate={this.onEntityUpdate} />
            </div>
          </div>
        </div>
        <CreateEntityModal
          visible={this.state.createModalVisible}
          hide={this.toggleCreateModal}
          axios={this.props.bp.axios}
          onEntityCreated={this.handleEntityCreated}
        />
      </div>
    )
  }
}
