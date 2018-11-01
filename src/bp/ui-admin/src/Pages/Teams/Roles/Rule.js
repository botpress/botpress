import React, { Component } from 'react'

import { Row, Col, Button, ButtonGroup, FormGroup, Label, Input } from 'reactstrap'
import { MdArrowDropUp, MdArrowDropDown, MdDelete } from 'react-icons/lib/md'

const parseOp = op => {
  const res = {
    r: null,
    w: null
  }
  if (op.length < 2 || op.length > 4) {
    // invalid or empty rule
    return res
  }

  let parts = []
  if (op.length === 2) {
    parts = [{ op: op[1], allowed: op[0] }]
  } else if (op.length === 3) {
    parts = [{ op: op[1], allowed: op[0] }, { op: op[2], allowed: op[0] }]
  } else if (op.length === 4) {
    parts = [{ op: op[1], allowed: op[0] }, { op: op[3], allowed: op[2] }]
  }

  parts.forEach(({ op, allowed }) => {
    res[op] = allowed === '+'
  })

  return res
}

const serializeAllowed = allowed => (allowed ? '+' : '-')

const serializeOp = rule => {
  const parts = [
    rule.r != null ? `${serializeAllowed(rule.r)}r` : null,
    rule.w != null ? `${serializeAllowed(rule.w)}w` : null
  ]
  return parts.filter(Boolean).join('')
}

export default class Rule extends Component {
  state = {}

  static getDerivedStateFromProps(props, state) {
    if (!props.rule || props.rule === state.rule) {
      return null
    }
    return { rule: props.rule, op: parseOp(props.rule.op) }
  }

  onChange = key => event => {
    this.setState(
      {
        op: {
          ...this.state.op,
          [key]: event.target.checked
        }
      },
      () => {
        this.props.onChange && this.props.onChange(serializeOp(this.state.op))
      }
    )
  }

  render() {
    const { op } = this.state
    const { index, total, ruleInfo, rule, readOnly } = this.props

    return (
      <Row className="actions-table-row">
        <Col sm="5">
          <abbr data-title={ruleInfo.description || ''}>
            <code>{rule.res}</code>
          </abbr>
        </Col>
        <Col sm="2">
          {op.r != null && (
            <FormGroup check>
              <Label check>
                <Input type="checkbox" checked={op.r} onChange={this.onChange('r')} disabled={readOnly} /> read
              </Label>
            </FormGroup>
          )}
        </Col>
        <Col sm="2">
          {op.w != null && (
            <FormGroup check>
              <Label check>
                <Input type="checkbox" checked={op.w} onChange={this.onChange('w')} disabled={readOnly} /> write
              </Label>
            </FormGroup>
          )}
        </Col>
        {!readOnly && (
          <div className="actions-table-row__buttons ml-auto">
            <ButtonGroup>
              <Button onClick={this.props.onMoveUp} size="sm" outline disabled={index < 1}>
                <MdArrowDropUp className="btn__icon" />
              </Button>
              <Button onClick={this.props.onMoveDown} size="sm" outline disabled={index > total - 2}>
                <MdArrowDropDown className="btn__icon" />
              </Button>
            </ButtonGroup>
            <Button onClick={this.props.onDelete} color="link">
              <MdDelete className="btn__icon" />
            </Button>
          </div>
        )}
      </Row>
    )
  }
}
