import style from './style.scss'
import { Glyphicon, Button, FormControl } from 'react-bootstrap'

export class AnswersComponent extends React.Component {
  state = {
    invalidAnswer: false,
    isOpen: false,
    input: '',
    answers: []
  }

  static getDerivedStateFromProps(props, state) {
    return { answers: props.answers }
  }

  toggleOpen = () => {
    this.setState({ isOpen: !this.state.isOpen })
  }

  handleMainAnswerChange = event => {
    let answers = this.state.answers
    const value = event.target.value
    answers[0] = value

    this.setState({ answers, invalidAnswer: value === '' }, () => {
      !this.state.invalidAnswer && this.props.onChange(this.state.answers)
    })
  }

  handleVariationChange = (event, index) => {
    const answers = this.state.answers
    answers[index] = event.target.value

    this.setState({ answers }, () => this.props.onChange(this.state.answers))
  }

  addAnswer = () => {
    let answers = this.state.answers
    answers.push('')
    this.setState({ answers })
  }

  deleteAnswer = index => {
    let answers = this.state.answers
    answers.splice(index, 1)
    this.setState({ answers })
  }

  renderAnswer = (answer, index) => {
    return (
      <div key={`${index}_answer`} className={style.elementBody}>
        <textarea
          autoFocus
          className="form-control"
          defaultValue={answer}
          onChange={event => this.handleVariationChange(event, index)}
        />
        <Button className={style.elementRemove} onClick={() => this.deleteAnswer(index)}>
          <Glyphicon glyph="trash" />
        </Button>
      </div>
    )
  }

  renderAnswers = () => {
    return (
      <React.Fragment>
        <Button bsStyle="primary" onClick={this.addAnswer} className={style.addVariationBtn}>
          New
        </Button>
        <div>
          {this.state.answers &&
            this.state.answers.map((element, index) => {
              // Do not render the first answer as it is contained into the main textarea
              if (index > 0) {
                return this.renderAnswer(element, index)
              }
            })}
        </div>
      </React.Fragment>
    )
  }

  render() {
    return (
      <React.Fragment>
        <FormControl
          className={(this.state.invalidAnswer && style.qnaInvalidAnswer) || ''}
          value={this.state.answers[0]}
          onChange={this.handleMainAnswerChange}
          componentClass="textarea"
        />

        <div>
          <div onClick={this.toggleOpen} className={style.elementTitle}>
            {this.state.isOpen ? 'Hide Variations' : 'Show Variations'}
            &nbsp;
            {this.state.isOpen ? <Glyphicon glyph="triangle-top" /> : <Glyphicon glyph="triangle-bottom" />}
          </div>
          <div hidden={!this.state.isOpen}>{this.renderAnswers()}</div>
        </div>
      </React.Fragment>
    )
  }
}
