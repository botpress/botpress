import { Dialog, lang } from 'botpress/shared'
import classnames from 'classnames'
import _ from 'lodash'
import React from 'react'
import { Button } from 'react-bootstrap'
import ContentForm from '~/components/ContentForm'

import { getFormData } from '../../util/NodeFormData'
import { isMissingCurlyBraceClosure } from '../Util/form.util'
import withLanguage from '../Util/withLanguage'

import style from './style.scss'

interface Props {
  handleEdit: any
  handleCreateOrUpdate: any
  changeContentLanguage: any
  defaultLanguage: any
  contentLang: any
  isEditing: any
  formData: any
  handleClose: any
  schema: any
  uiSchema: any
  show: boolean
}

interface State {
  mustChangeLang: boolean
}

class CreateOrEditModal extends React.Component<Props, State> {
  state = {
    mustChangeLang: false
  }

  handleEdit = event => {
    this.props.handleEdit(event.formData)
  }

  handleSave = event => {
    this.props.handleCreateOrUpdate(event.formData)
  }

  useDefaultLang = () => {
    this.props.changeContentLanguage(this.props.defaultLanguage)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.formData !== this.props.formData || this.props.contentLang !== prevProps.contentLang) {
      this.setState({ mustChangeLang: !this.props.isEditing && this.props.contentLang !== this.props.defaultLanguage })
    }
  }

  renderSwitchLang() {
    return (
      <div>
        <div style={{ height: 100 }}>
          <h4>{lang.tr('actionRequired')}</h4>
          {lang.tr('studio.content.mustBeDefaultLang')}
        </div>
        <p>
          <Button onClick={this.useDefaultLang} bsStyle="primary">
            {lang.tr('studio.content.switchToDefaultLang', {
              defaultLang: this.props.defaultLanguage.toUpperCase()
            })}
          </Button>
          &nbsp;
          <Button bsStyle="danger" onClick={this.props.handleClose}>
            {lang.tr('cancel')}
          </Button>
        </p>
      </div>
    )
  }

  renderForm() {
    const formData = getFormData(
      { formData: this.props.formData },
      this.props.contentLang,
      this.props.defaultLanguage,
      {}
    )

    return (
      <div>
        <ContentForm
          schema={this.props.schema}
          uiSchema={this.props.uiSchema}
          formData={this.props.formData}
          isEditing={this.props.isEditing}
          onChange={this.handleEdit}
          onSubmit={this.handleSave}
        >
          <div className={style.formBtns}>
            <button
              className={classnames('bp-button', 'bp-button-danger')}
              onClick={this.props.handleClose}
              type="button"
            >
              {lang.tr('cancel')}
            </button>
            <button
              className={classnames('bp-button')}
              type="submit"
              disabled={isMissingCurlyBraceClosure(formData?.text)}
            >
              {lang.tr('submit')}
            </button>
          </div>
        </ContentForm>
      </div>
    )
  }

  render() {
    return (
      <Dialog.Wrapper isOpen={this.props.show} onClose={this.props.handleClose}>
        <Dialog.Body>{this.state.mustChangeLang ? this.renderSwitchLang() : this.renderForm()}</Dialog.Body>
      </Dialog.Wrapper>
    )
  }
}

export default withLanguage(CreateOrEditModal)
