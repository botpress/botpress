import React from 'react'
import { Button, FormGroup, FormControl, InputGroup, Glyphicon, ListGroup, ListGroupItem, Label } from 'react-bootstrap'

import style from '../style.scss'
import EntityEditor from './editor'

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

  onEntitySelected = entity => {
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
            <nav className={style.navigationBar}>
              <div className={style.create}>
                <Button bsStyle="primary" block onClick={this.createEntityPrompt}>
                  Create new Entity
                </Button>
              </div>

              <div className={style.filter}>
                <FormGroup bsSize="large">
                  <InputGroup>
                    <FormControl type="text" placeholder="Search" onChange={this.onSearchChange} />
                    <InputGroup.Addon>
                      <Glyphicon glyph="search" />
                    </InputGroup.Addon>
                  </InputGroup>
                </FormGroup>
              </div>
              <div className={style.list}>
                <ListGroup>
                  {this.state.filteredEntities.map((el, i) => (
                    <ListGroupItem
                      key={`nlu_entity_${el.name}`}
                      className={style.entity}
                      onClick={() => this.onEntitySelected(el)}
                    >
                      {el.name}
                      <Glyphicon glyph="trash" className={style.deleteEntity} onClick={() => this.deleteEntity(el)} />
                    </ListGroupItem>
                  ))}
                </ListGroup>
              </div>
            </nav>
            <div className={style.childContent}>
              <EntityEditor entity={this.state.selectedEntity} onUpdate={this.onEntityUpdate} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
