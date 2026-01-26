import axios, { AxiosInstance } from 'axios'
import * as sdk from '@botpress/sdk'
import * as bp from '../../.botpress'
import {
  CreateLeadRequest,
  KommoLead,
  KommoCreateResponse,
  UpdateLeadRequest,
  CreateContactRequest,
  KommoContact,
  KommoCreateContactResponse,
  KommoSearchContactsResponse,
  KommoSearchLeadResponse,
} from './types'
import { getErrorMessage } from './error-handler'

export class KommoClient {
  private _axios: AxiosInstance
  private _logger: bp.Logger

  constructor(accessToken: string, baseDomain: string, logger: bp.Logger) {
    this._logger = logger

    // Ensure basedomain doesn't have protocol prefix or trailing slash
    const cleanDomain = baseDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')

    // Create axios instance with Kommo API configuration
    this._axios = axios.create({
      baseURL: `https://${cleanDomain}/api/v4`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    this._logger.forBot().debug('KommoClient initialized', {
      baseURL: `https://${cleanDomain}/api/v4`,
    })
  }

  // -----LEADS------
  async createLead(data: CreateLeadRequest): Promise<KommoLead> {
    try {
      this._logger.forBot().debug('Creating lead in Kommo', { name: data.name })
      const response = await this._axios.post<KommoCreateResponse>('/leads', [data])
      const createdLeadId = response.data._embedded.leads[0]?.id

      if (!createdLeadId) {
        throw new sdk.RuntimeError('No lead ID returned from Kommo')
      }

      const lead = await this.getLead(createdLeadId)

      if (!lead) {
        throw new sdk.RuntimeError('Failed to fetch created lead')
      }

      this._logger.forBot().info('Lead created successfully', { leadId: lead.id })
      return lead
    } catch (error) {
      this._logger.forBot().error('Failed to create lead', { error })
      throw new sdk.RuntimeError(getErrorMessage(error))
    }
  }

  // gets a lead by id
  async getLead(leadId: number): Promise<KommoLead | undefined> {
    try {
      this._logger.forBot().debug('Fetching lead from Kommo', { leadId })

      const response = await this._axios.get<KommoLead>(`/leads/${leadId}`)
      const lead = response.data

      return lead
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this._logger.forBot().info('Lead not found', { leadId })
        return undefined
      }

      this._logger.forBot().error('Failed to fetch lead', { leadId, error })
      throw new sdk.RuntimeError(getErrorMessage(error))
    }
  }

  // update a single lead
  async updateLead(leadId: number, data: UpdateLeadRequest): Promise<KommoLead> {
    try {
      this._logger.forBot().debug('Updating lead in Kommo', { leadId, data })
      await this._axios.patch(`/leads/${leadId}`, data)
      const lead = await this.getLead(leadId)

      if (!lead) {
        throw new sdk.RuntimeError('Failed to fetch updated lead')
      }

      this._logger.forBot().info('Lead updated successfully', { leadId: lead.id })
      return lead
    } catch (error) {
      this._logger.forBot().error('Failed to update lead', { leadId, error })
      throw new sdk.RuntimeError(getErrorMessage(error))
    }
  }

  // search leads by query
  async searchLeads(query: string): Promise<KommoLead[]> {
    try {
      this._logger.forBot().debug('Searching for leads', { query })
      const response = await this._axios.get<KommoSearchLeadResponse>('/leads', {
        params: { query },
      })

      const leads = response.data._embedded?.leads || []

      this._logger.forBot().info('Leads found:', { count: leads.length })
      return leads
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this._logger.forBot().info('No leads found', { query })
        return []
      }
      this._logger.forBot().error('Failed to search leads', { query, error })
      throw new sdk.RuntimeError(getErrorMessage(error))
    }
  }
  // -----Contacts-----
  async createContact(data: CreateContactRequest): Promise<KommoContact> {
    try {
      this._logger.forBot().debug('Creating contact in Kommo', { name: data.name })
      // contacts sent to kommo as an array
      const response = await this._axios.post<KommoCreateContactResponse>('/contacts', [data])

      // get the ID from the response
      const createdContactId = response.data._embedded.contacts[0]?.id
      if (!createdContactId) {
        throw new sdk.RuntimeError('No contact ID returned from Kommo')
      }
      // fetch full contact details to return to user
      const contact = await this.getContact(createdContactId)
      if (!contact) {
        throw new sdk.RuntimeError('Failed to fetch created contact')
      }
      this._logger.forBot().info('Contact created successfully', { contactId: contact.id })

      return contact
    } catch (error) {
      this._logger.forBot().error('Failed to create contact', { error })
      throw new sdk.RuntimeError(getErrorMessage(error))
    }
  }

  // internal method for create contact
  async getContact(contactId: number): Promise<KommoContact | undefined> {
    try {
      this._logger.forBot().debug('Fetching contact from Kommo', { contactId })

      const response = await this._axios.get<KommoContact>(`/contacts/${contactId}`)
      const contact = response.data
      return contact
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this._logger.forBot().info('Contact not found', { contactId })
        return undefined
      }

      this._logger.forBot().error('Failed to fetch contact', { contactId, error })
      throw new sdk.RuntimeError(getErrorMessage(error))
    }
  }

  // method to search contacts by phone number, name or email
  async searchContacts(query: string): Promise<KommoContact[]> {
    try {
      this._logger.forBot().debug('Searching contacts in Kommo', { query })

      const response = await this._axios.get<KommoSearchContactsResponse>('/contacts', {
        params: { query },
      })

      const contacts = response.data._embedded?.contacts || []

      this._logger.forBot().info('Contacts found:', { count: contacts.length })
      return contacts
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        this._logger.forBot().info('No contacts found', { query })
        return []
      }

      this._logger.forBot().error('Failed to search contacts', { query, error })
      throw new sdk.RuntimeError(getErrorMessage(error))
    }
  }
}
