import style from './style.scss'
import { Glyphicon, Button } from 'react-bootstrap'

export class VariationsCollapse extends React.Component {
  state = {
    isOpen: false,
    input: ''
  }

  toggleOpen = () => {
    this.setState({ isOpen: !this.state.isOpen })
  }

  renderElement = (element, index) => {
    return (
      <div key={`${index}_element`}>
        <textarea defaultValue={element} onChange={event => this.props.onInputChange(event, index)} />
        <Button onClick={() => this.props.onDelete(index)}>
          <Glyphicon glyph="trash" />
        </Button>
      </div>
    )
  }

  renderElements = () => {
    const elements = this.props.elements
    return (
      <div>
        <Button onClick={this.props.onAdd}>{this.props.addTitle || 'Add a variation'}</Button>
        <div>
          {elements &&
            elements.map((element, index) => {
              return this.renderElement(element, index)
            })}
        </div>
      </div>
    )
  }

  render() {
    return (
      <div>
        <div onClick={this.toggleOpen}>
          {this.props.title || 'Variations'}
          &nbsp;
          {this.state.isOpen ? <Glyphicon glyph="triangle-top" /> : <Glyphicon glyph="triangle-bottom" />}
        </div>
        <div hidden={!this.state.isOpen}>{this.renderElements()}</div>
      </div>
    )
  }
}
