import style from './style.scss'
import { Glyphicon } from 'react-bootstrap'

export class VariationsCollapse extends React.Component {
  DEFAULT_TITLE = 'Variations'

  state = {
    isOpen: false
  }

  toggleOpen = () => {
    this.setState({ isOpen: !this.state.isOpen })
  }

  render() {
    return (
      <div>
        <div className={style.qnaVariationTitle} onClick={this.toggleOpen}>
          {this.props.title || this.DEFAULT_TITLE}
          &nbsp;
          {this.state.isOpen ? <Glyphicon glyph="triangle-top" /> : <Glyphicon glyph="triangle-bottom" />}
        </div>
        <div className={style.qnaVariationBody} hidden={!this.state.isOpen}>
          {this.props.children}
        </div>
      </div>
    )
  }
}
