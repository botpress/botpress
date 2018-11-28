import React from 'react'
import {
  Badge,
  Button,
  FormGroup,
  FormControl,
  InputGroup,
  Glyphicon,
  ListGroup,
  ListGroupItem,
  Label
} from 'react-bootstrap'

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

  renderCreateEntity = () => {
    return (
      <div>
        <form>
          <FormGroup bsSize="large">
            <InputGroup>
              <FormControl type="text" placeholder="Search" onChange={this.onSearchChange} />
              <InputGroup.Addon>
                <Glyphicon glyph="search" />
              </InputGroup.Addon>
            </InputGroup>
          </FormGroup>
          <ListGroup>
            {this.state.filteredEntities.map((el, i) => (
              <ListGroupItem
                key={`nlu_entity_${el.name}`}
                className={style.entity}
                onClick={e => this.onEntitySelected(e, el.name)}
              >
                {el.name}
                <Glyphicon glyph="trash" className={style.deleteEntity} />
              </ListGroupItem>
            ))}
          </ListGroup>
        </form>
      </div>
    )
  }

  renderOccurences = entity => {
    return (
      entity.occurences &&
      entity.occurences.map((oc, i) => (
        <ListGroupItem className={style.entity}>
          {oc.name}
          <FormControl type="text" placeholder="Enter a synonym" className={style.synonym} />
          <Glyphicon glyph="trash" className={style.deleteEntity} />
        </ListGroupItem>
      ))
    )
  }

  renderSynonyms = () => {
    const selectedEntityName = this.state.selectedEntity
    const entity = this.state.entities.filter(e => e.name === selectedEntityName)
    if (!entity) {
      return null
    }

    return (
      <div>
        <h3>Occurences of "{entity}"</h3>
        <form>
          <FormGroup bsSize="large">
            <InputGroup>
              <FormControl type="text" placeholder="Search" onChange={this.onSearchChange} />
              <InputGroup.Addon>
                <Glyphicon glyph="search" />
              </InputGroup.Addon>
            </InputGroup>
          </FormGroup>
          <ListGroup>{this.renderOccurences(entity)}</ListGroup>
        </form>
      </div>
    )
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

  renderTag = value => {
    return (
      <Label>
        {value}
        <Glyphicon glyph="remove" />
      </Label>
    )
  }

  onEntitySelected = (event, name) => {
    event.stopPropagation()
    debugger
    this.setState({ selectedEntity: name })
  }

  renderSyn = occ => {
    return (
      oc.synonyms &&
      oc.synonyms.map((synonym, i) => (
        <Label>
          {synonym}
          <Glyphicon glyph="remove" />
        </Label>
      ))
    )
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
                      onClick={e => this.onEntitySelected(e, el.name)}
                    >
                      {el.name}
                      <Glyphicon glyph="trash" className={style.deleteEntity} />
                    </ListGroupItem>
                  ))}
                </ListGroup>
              </div>
              <div className={style.childContent}>
                <EntityEditor />
              </div>
            </nav>
          </div>
        </div>
      </div>
    )
  }
}
