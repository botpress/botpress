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
      <div key={`${index}_element`} className={style.elementBody}>
        <textarea
          autoFocus
          className="form-control"
          defaultValue={element}
          onChange={event => this.props.onInputChange(event, index)}
        />
        <Button className={style.elementRemove} onClick={() => this.props.onDelete(index)}>
          <Glyphicon glyph="trash" />
        </Button>
      </div>
    )
  }

  renderElements = () => {
    const elements = this.props.elements
    return (
      <React.Fragment>
        <Button bsStyle="primary" onClick={this.props.onAdd} className={style.addVariationBtn}>
          {this.props.addTitle || 'New'}
        </Button>
        <div>
          {elements &&
            elements.map((element, index) => {
              return this.renderElement(element, index)
            })}
        </div>
      </React.Fragment>
    )
  }

  render() {
    return (
      <div>
        <div onClick={this.toggleOpen} className={style.elementTitle}>
          {this.state.isOpen ? 'Hide Variations' : 'Show Variations'}
          &nbsp;
          {this.state.isOpen ? <Glyphicon glyph="triangle-top" /> : <Glyphicon glyph="triangle-bottom" />}
        </div>
        <div hidden={!this.state.isOpen}>{this.renderElements()}</div>
      </div>
    )
  }
}
