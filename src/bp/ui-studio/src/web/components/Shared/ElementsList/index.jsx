import React from 'react'
import { ListGroupItem, Glyphicon } from 'react-bootstrap'
import { InputElement } from './InputElement'
import style from './style.scss'

export default class ElementsList extends React.Component {
  elementInputRef = React.createRef()
  state = {
    inputValue: '',
    error: undefined,
    editElementIndex: undefined
  }

  toggleEditMode = index => {
    this.setState({ editElementIndex: index })
  }

  handleEditEnter = (element, index) => {
    this.setState({ editElementIndex: undefined })
    this.props.update(element, index)
  }

  renderElement = (element, index) => {
    if (this.props.renderElement) {
      return this.props.renderElement(element)
    }

    if (this.state.editElementIndex === index) {
      return (
        <InputElement
          key={`elements_edit_element_${index}`}
          defaultValue={element}
          elements={this.props.elements}
          onEnter={element => this.handleEditEnter(element, index)}
        />
      )
    } else {
      return (
        <ListGroupItem key={`elements_create_element_${index}`} className={style.listElement}>
          <a className={style.listElementValue} onClick={() => this.toggleEditMode(index)}>
            {element}
          </a>
          <Glyphicon glyph="trash" onClick={() => this.props.delete(index)} className={style.listElementIcon} />
        </ListGroupItem>
      )
    }
  }

  render() {
    return (
      <div>
        <InputElement
          placeholder={this.props.placeholder || 'Type and press enter to create an element'}
          eraseValue={true}
          elements={this.props.elements}
          onEnter={this.props.create}
        />
        {this.props.elements && this.props.elements.map((element, index) => this.renderElement(element, index))}
      </div>
    )
  }
}
