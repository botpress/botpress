import { RuntimeError } from '@botpress/sdk'
import mailchimp, { lists } from '@mailchimp/mailchimp_marketing'
import type {
  MailchimpClient,
  Customer,
  Operation,
  addCustomerFullOutputType,
  getAllListsOutputType,
  getAllListsInputType,
  getAllCampaignsOutputType,
  getAllCampaignsInputType,
} from 'src/misc/custom-types'
import { Logger as IntegrationLogger } from 'src/misc/types'
import { isMailchimpError } from 'src/utils'
import {
  addCustomerFullOutputSchema,
  getAllCampaignsOutputSchema,
  getAllListsOutputSchema,
} from '../misc/custom-schemas'

export class MailchimpApi {
  private client: MailchimpClient
  private logger?: IntegrationLogger
  constructor(apiKey: string, serverPrefix: string, logger?: IntegrationLogger) {
    this.client = mailchimp
    this.client.setConfig({
      apiKey,
      server: serverPrefix,
    })
    this.logger = logger
  }

  public getAllCampaigns = async (input: getAllCampaignsInputType): Promise<getAllCampaignsOutputType> => {
    const response = await this.client.campaigns?.list(input)

    return getAllCampaignsOutputSchema.parse(response)
  }

  public getAllLists = async (input: getAllListsInputType): Promise<getAllListsOutputType> => {
    const response = await this.client.lists.getAllLists(input)

    return getAllListsOutputSchema.parse(response)
  }

  public addCustomerToList = async (listId: string, customer: Customer): Promise<addCustomerFullOutputType> => {
    this.logger?.forBot().debug('Adding customer to list', { listId, customer })

    const existing = await this.getListCustomer(listId, customer.email)

    if (existing) {
      this.logger?.forBot().debug('Customer already exists in list', { existing })
      return addCustomerFullOutputSchema.parse(existing)
    }

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
  ): Promise<addCustomerFullOutputType> => {
    this.logger?.forBot().debug('Adding customer to campaign list', { campaignId, customer })
    const listId = await this.getCampaignListID(campaignId)
    this.logger?.forBot().debug('Found Campaign list ID', { listId })

    if (!listId) {
      throw new RuntimeError(`Campaign ${campaignId} does not have an associated list`)
    }

    const existing = await this.getListCustomer(listId, customer.email)

    if (existing) {
      this.logger?.forBot().debug('Customer already exists in list', { existing })
      return addCustomerFullOutputSchema.parse(existing)
    }
    this.logger?.forBot().debug('Customer does not exist in list, adding', { customer })
    return this.addCustomerToList(listId, customer)
  }

  public getListCustomer = async (
    listId: string,
    customerEmail: string
  ): Promise<lists.MembersSuccessResponse | null> => {
    try {
      const response = await this.client.lists.getListMember(listId, customerEmail)
      this.logger?.forBot().debug('Found customer in list', { response })
      if (isMailchimpError(response)) {
        throw response
      }
      return response as lists.MembersSuccessResponse
    } catch (error) {
      if ((error as mailchimp.ErrorResponse).status === 404) {
        this.logger?.forBot().debug('Customer does not exist in list', { customerEmail })
        return null
      } else {
        throw error
      }
    }
  }

  public getCampaignListCustomer = async (campaignId: string, customerEmail: string) => {
    const listId = await this.getCampaignListID(campaignId)
    if (!listId) {
      throw new RuntimeError(`Campaign ${campaignId} does not have an associated list, is the ID correct? `)
    }
    return this.getListCustomer(listId, customerEmail)
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

  private getCampaignListID = async (campaignId: string): Promise<string | null> => {
    try {
      const campaignResponse = await this.client.campaigns?.get(campaignId)
      return campaignResponse?.recipients.list_id || null
    } catch (error: any) {
      if (isMailchimpError(error)) {
        if (error.status === 404) {
          return null
        }
      }
      throw error
    }
  }
}
