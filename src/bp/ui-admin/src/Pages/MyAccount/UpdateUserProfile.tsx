import { Button, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { UserProfile } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

interface Props {
  isOpen: boolean
  profile: UserProfile
  toggle: () => void
  fetchProfile: () => void
}

const UpdateUserProfile: FC<Props> = props => {
  const [firstname, setFirstname] = useState()
  const [lastname, setLastname] = useState()

  useEffect(() => {
    setFirstname(props.profile.firstname)
    setLastname(props.profile.lastname)
  }, [props.isOpen])

  const submit = async event => {
    event.preventDefault()

    try {
      await api.getSecured().post('/auth/me/profile', { firstname, lastname })

      props.fetchProfile()
      props.toggle()

      toastSuccess('Profile updated successfully')
    } catch (err) {
      toastFailure(`Error while updating profile: ${err.message}`)
    }
  }

  return (
    <Dialog
      title="Update your profile"
      icon="user"
      isOpen={props.isOpen}
      onClose={props.toggle}
      transitionDuration={0}
      canOutsideClickClose={false}
    >
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label="First Name">
            <InputGroup
              id="input-firstname"
              value={firstname}
              onChange={e => setFirstname(e.target.value)}
              tabIndex={1}
              autoFocus={true}
            />
          </FormGroup>

          <FormGroup label="Last Name">
            <InputGroup id="input-lastname" value={lastname} onChange={e => setLastname(e.target.value)} tabIndex={2} />
          </FormGroup>
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button id="btn-submit" type="submit" text="Save" tabIndex={3} intent={Intent.PRIMARY} />
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default UpdateUserProfile
