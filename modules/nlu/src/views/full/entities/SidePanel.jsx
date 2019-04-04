import React from 'react'
import { Button, FormGroup, FormControl, InputGroup, Glyphicon, ListGroup, ListGroupItem, Label } from 'react-bootstrap'
import nluSyles from '../style.scss'
import entityStyles from './style.scss'
import classnames from 'classnames'

export default class SidePanel extends React.Component {
  state = {
    filter: undefined,
    selectedID: undefined
  }

  handleCreateClick = e => {
    e.preventDefault()
    this.props.onCreateClick()
  }

  handleFilterChange = e => {
    e.preventDefault()
    this.setState({ filter: e.target.value })
  }

  handleDeleteClick = (entity, e) => {
    e.preventDefault()
    this.props.onDeleteClick(entity)
  }

  handleEntityClick = (entity, e) => {
    e.preventDefault()
    this.props.onEntityClick(entity)
    this.setState({ activeId: entity.id })
  }

  entityFilter = entity => {
    if (this.state.filter === undefined || !entity.name) {
      return true
    }

    return entity.name.toLowerCase().includes(this.state.filter.toLowerCase())
  }

  render() {
    const entities = this.props.entities || []
    return (
      <nav className={nluSyles.navigationBar}>
        <div className={nluSyles.create}>
          <Button bsStyle="primary" block onClick={this.handleCreateClick}>
            Create new entity
          </Button>
        </div>

        {entities.length > 0 && (
          <div className={nluSyles.filter}>
            <FormGroup bsSize="small">
              <InputGroup>
                <FormControl
                  tabIndex="1"
                  type="text"
                  placeholder="Search"
                  value={this.state.filter}
                  onChange={this.handleFilterChange}
                />
                <InputGroup.Addon>
                  <Glyphicon glyph="search" />
                </InputGroup.Addon>
              </InputGroup>
            </FormGroup>
          </div>
        )}

        <div className={nluSyles.list}>
          <ListGroup>
            {entities.filter(this.entityFilter).map(ent => {
              const selected = this.props.selectedEntity && ent.id === this.props.selectedEntity.id
              return (
                <ListGroupItem
                  key={ent.id}
                  className={classnames(entityStyles.entity, { [entityStyles.selectedentity]: selected })}
                >
                  <div onClick={this.handleEntityClick.bind(null, ent)}>
                    {ent.name}
                    &nbsp;
                    <Label bsStyle={selected ? 'primary' : 'default'} className={entityStyles.badge}>
                      {ent.type}
                    </Label>
                  </div>
                  <Glyphicon
                    glyph="trash"
                    className={entityStyles.deleteEntity}
                    onClick={this.handleDeleteClick.bind(null, ent)}
                  />
                </ListGroupItem>
              )
            })}
          </ListGroup>
        </div>
      </nav>
    )
  }
}
