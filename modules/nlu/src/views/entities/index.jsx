import React from 'react'
import { Button, FormGroup, FormControl, InputGroup, Glyphicon, ListGroup, ListGroupItem, Label } from 'react-bootstrap'

import style from '../style.scss'
import EntityEditor from './editor'

export default class EntitiesComponent extends React.Component {
  state = {
    entities: [
      { name: '@Artist', occurences: [{ name: 'JayZ', synonyms: ['JZ', 'Jay'] }] },
      { name: '@Airport', occurences: [{ name: 'YQB', synonyms: ['A/roport de Qu/bec'] }] },
      { name: '@Bus' }
    ],
    filteredEntities: [],
    selectedEntity: undefined
  }

  componentDidMount() {
    this.setState({ filteredEntities: this.state.entities })
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

  onEntityChange = () => {
    console.log('changed')
  }

  render() {
    return (
      <div className={style.workspace}>
        <div>
          <div className={style.main}>
            <nav className={style.navigationBar}>
              <div className={style.create}>
                <Button bsStyle="primary" block>
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
                      <Glyphicon glyph="trash" className={style.deleteEntity} />
                    </ListGroupItem>
                  ))}
                </ListGroup>
              </div>
            </nav>
            <div className={style.childContent}>
              <EntityEditor entity={this.state.selectedEntity} onChange={this.onEntityChange} />
            </div>
          </div>
        </div>
      </div>
    )
  }
}
