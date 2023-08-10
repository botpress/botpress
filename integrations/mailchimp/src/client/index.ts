import mailchimp from '@mailchimp/mailchimp_marketing'
import type { MailchimpClient, Customer, Operation, AddCustomerFullOutputType } from 'src/misc/custom-types'

import { addCustomerFullOutputSchema } from '../misc/custom-schemas'

export class MailchimpApi {
  private client: MailchimpClient

  constructor(apiKey: string, serverPrefix: string) {
    this.client = mailchimp
    this.client.setConfig({
      apiKey,
      server: serverPrefix,
    })
  }

  public addCustomerToList = async (listId: string, customer: Customer): Promise<AddCustomerFullOutputType> => {
    const listResponse = await this.client.lists.addListMember(
      listId,
      {
        email_address: customer.email,
        status: 'subscribed',
        language: customer.language || '',
        merge_fields: {
          FNAME: customer.firstName || '',
          LNAME: customer.lastName || '',
          BIRTHDAY: customer.birthday || '',
          ADDRESS: {
            addr1: customer.address1 || '',
            addr2: customer.address2 || '',
            city: customer.city || '',
            state: customer.state || '',
            zip: customer.zip || '',
            country: customer.country || '',
          },
          PHONE: customer.phone || '',
        },
      },
      { skipMergeValidation: true }
    )
    return addCustomerFullOutputSchema.parse(listResponse)
  }

  public addCustomerToCampaignList = async (
    campaignId: string,
    customer: Customer
  ): Promise<AddCustomerFullOutputType> => {
    const listId = await this.getListFromCampaign(campaignId)
    return this.addCustomerToList(listId, customer)
  }

  public checkIfCustomerInList = async (listId: string, customerEmail: string): Promise<boolean> => {
    try {
      await this.client.lists.getListMember(listId, customerEmail)
      return true
    } catch (error) {
      if ((error as mailchimp.ErrorResponse).status === 404) {
        return false
      } else {
        throw error
      }
    }
  }

  public checkIfCustomerInCampaignList = async (campaignId: string, customerEmail: string): Promise<boolean> => {
    const listId = await this.getListFromCampaign(campaignId)
    return this.checkIfCustomerInList(listId, customerEmail)
  }

  public sendMassEmailCampaign = async (campaignIds: string | string[]) => {
    let campaignIdsArray = typeof campaignIds === 'string' ? campaignIds.split(',') : campaignIds
    campaignIdsArray = campaignIdsArray.map((campaignId) => campaignId.trim())

    const operations: Operation[] = campaignIdsArray.map((campaignId) => ({
      method: 'POST',
      path: `/campaigns/${campaignId}/actions/send`,
    }))

    const response = await this.client.batches?.start({
      operations,
    })

    return response
  }

  private getListFromCampaign = async (campaignId: string): Promise<string> => {
    const campaignResponse = await this.client.campaigns?.get(campaignId)
    return campaignResponse?.recipients.list_id || ''
  }
}
