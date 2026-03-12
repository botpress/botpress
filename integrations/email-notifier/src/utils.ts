import { CreateContactCommand, SESv2Client } from '@aws-sdk/client-sesv2'
import { getErrorMessage } from './misc/error-handler'
import * as bp from '.botpress'

export async function addContactToList(
  sesClient: SESv2Client,
  email: string,
  contactListName: string,
  logger: bp.Logger
) {
  try {
    await sesClient.send(
      new CreateContactCommand({
        ContactListName: contactListName,
        EmailAddress: email,
      })
    )
  } catch (error) {
    logger.forBot().warn(`Failed to add ${email} to contact list: ${getErrorMessage(error)}`)
  }
}
