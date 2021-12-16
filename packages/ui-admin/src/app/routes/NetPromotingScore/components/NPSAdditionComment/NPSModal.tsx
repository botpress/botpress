import { Button, Dialog, FormGroup, TextArea, Classes, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { Component } from 'react'
import { trackEvent } from '../../SegmentHandler'

interface Props {
  modalValue: boolean
  onChange: any
}

interface State {
  isNPSModalOpen: boolean
  comment: string
}

export default class CreateNPSModalComment extends Component<Props, State> {
  private _form: HTMLFormElement | null = null

  state: State = {
    isNPSModalOpen: this.props.modalValue,
    comment: ''
  }
  createComment = async e => {
    void trackEvent('nps_comment', { npsComment: this.state.comment })
    this.toggleDialog(e)
  }

  handleCommentChanged = e => {
    const comment = e.target.value
    this.setState({ comment })
  }

  toggleDialog = e => {
    this.setState({ isNPSModalOpen: !this.state.isNPSModalOpen })
    e.target.value = this.state.isNPSModalOpen
    this.props.onChange(e)
  }

  render() {
    return (
      <Dialog
        title={lang.tr('admin.netPromotingScore.title')}
        icon="add"
        isOpen={this.state.isNPSModalOpen}
        onClose={this.toggleDialog}
        transitionDuration={0}
        canOutsideClickClose={false}
      >
        <form ref={form => (this._form = form)}>
          <div className={Classes.DIALOG_BODY}>
            <FormGroup
              label={lang.tr('admin.netPromotingScore.modalTitle')}
              labelFor="comment"
              labelInfo="*"
              helperText={lang.tr('admin.netPromotingScore.helper')}
            >
              <TextArea
                id="input-comment"
                fill={true}
                growVertically={true}
                intent={Intent.PRIMARY}
                large={true}
                value={this.state.comment}
                onChange={this.handleCommentChanged}
              />
            </FormGroup>
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                text={lang.tr('admin.netPromotingScore.button')}
                type="submit"
                onClick={this.createComment}
                intent={Intent.PRIMARY}
              />
            </div>
          </div>
        </form>
      </Dialog>
    )
  }
}
