import { Button, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { FormFields, lang, toast } from 'botpress/shared'
import { UserProfile } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import api from '~/app/api'

interface Props {
  isOpen: boolean
  profile: UserProfile
  toggle: () => void
  fetchProfile: () => void
}

const UpdateUserProfile: FC<Props> = props => {
  const [firstname, setFirstname] = useState<string>()
  const [lastname, setLastname] = useState<string>()
  const [picture_url, setPictureUrl] = useState<string>()

  useEffect(() => {
    setFirstname(props.profile.firstname)
    setLastname(props.profile.lastname)
    setPictureUrl(props.profile.picture_url)
  }, [props.isOpen])

  const submit = async event => {
    event.preventDefault()

    try {
      await api.getSecured().post('/admin/user/profile', { firstname, lastname, picture_url })

      props.fetchProfile()
      props.toggle()

      toast.success(lang.tr('admin.profileUpdatedSuccessfully'))
    } catch (err) {
      toast.failure(lang.tr('admin.errorUpdatingProfile', { msg: err.message }))
    }
  }

  const uploadFieldChange = (url: string | undefined) => {
    setPictureUrl(url)
  }

  const v1Client = api.getSecured({ useV1: true })

  return (
    <Dialog
      title={lang.tr('admin.updateYourProfile')}
      icon="user"
      isOpen={props.isOpen}
      onClose={props.toggle}
      transitionDuration={0}
      canOutsideClickClose={false}
    >
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label={lang.tr('admin.firstName')} labelFor="input-firstname">
            <InputGroup
              id="input-firstname"
              value={firstname}
              onChange={e => setFirstname(e.target.value)}
              tabIndex={1}
              autoFocus={true}
            />
          </FormGroup>

          <FormGroup label={lang.tr('admin.lastName')} labelFor="input-lastname">
            <InputGroup id="input-lastname" value={lastname} onChange={e => setLastname(e.target.value)} tabIndex={2} />
          </FormGroup>

          <FormGroup label={lang.tr('admin.profilePicture')}>
            <FormFields.Upload axios={v1Client} onChange={uploadFieldChange} value={picture_url} type="image" />
          </FormGroup>
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="btn-submit-update-user"
              type="submit"
              text={lang.tr('save')}
              tabIndex={3}
              intent={Intent.PRIMARY}
            />
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default UpdateUserProfile
