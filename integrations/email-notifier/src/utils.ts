import { CreateContactCommand } from '@aws-sdk/client-sesv2'
import { getSesClient } from './misc/client'
import { CONTACT_LIST } from './misc/constants'
import { getErrorMessage } from './misc/error-handler'

const SESClient = getSesClient()

export async function addContactToList(email: string) {
  try {
    await SESClient.send(
      new CreateContactCommand({
        ContactListName: CONTACT_LIST,
        EmailAddress: email,
      })
    )
  } catch (error) {
    console.log(`Failed to add ${email} to contact list: ${getErrorMessage(error)}`)
  }
}
