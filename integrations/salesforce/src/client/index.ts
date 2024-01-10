import jsforce from 'jsforce'

export class SalesforceApi {
  private conn: jsforce.Connection
  private username: string
  private password: string
  private securityToken: string

  constructor(username: string, password: string, securityToken: string, SFLoginURL?: string, apiVersion?: string) {
    const opts = apiVersion ? { version: apiVersion } : null
    this.username = username
    this.password = password
    this.securityToken = securityToken
    this.conn = new jsforce.Connection({
      loginUrl: SFLoginURL || 'https://login.salesforce.com',
      ...opts,
    })
  }

  async login() {
    await this.conn.login(this.username, this.password + this.securityToken)
  }

  async createCase(caseData: {
    Subject: string
    SuppliedName: string
    Description?: string
    Priority?: string
    Origin: string
  }) {
    return this.conn.sobject('Case').create(caseData)
  }

  async createLead(leadData: { FirstName: string; LastName: string; Company: string; Email?: string; Phone?: string }) {
    return this.conn.sobject('Lead').create(leadData)
  }

  async createContact(contactData: {
    FirstName: string
    LastName: string
    AccountId: string
    Email?: string
    Phone?: string
  }) {
    const result = await this.conn.sobject('Contact').create(contactData)
    return result
  }

  async updateCase(
    caseId: string,
    caseData: {
      Subject?: string
      SuppliedName?: string
      Description?: string
      Priority?: string
      Origin?: string
    }
  ) {
    const result = await this.conn.sobject('Case').update({
      Id: caseId,
      ...caseData,
    })
    return result
  }

  async updateContact(
    contactId: string,
    contactData: {
      FirstName?: string
      LastName?: string
      AccountId?: string
      Email?: string
      Phone?: string
    }
  ) {
    const result = await this.conn.sobject('Contact').update({
      Id: contactId,
      ...contactData,
    })
    return result
  }

  async updateLead(
    leadId: string,
    leadData: {
      FirstName?: string
      LastName?: string
      Company?: string
      Email?: string
      Phone?: string
      Status?: string
    }
  ) {
    const result = await this.conn.sobject('Lead').update({
      Id: leadId,
      ...leadData,
    })
    return result
  }

  async findCase(caseNumber: string) {
    const result = await this.conn.sobject('Case').findOne({
      CaseNumber: caseNumber,
    })
    return result ?? { Id: '', message: 'Case not found' }
  }

  async findLead(email: string) {
    const result = await this.conn.sobject('Lead').findOne({
      Email: email,
    })
    return result ?? { Id: '', message: 'Lead not found' }
  }

  async findContact(email: string) {
    const result = await this.conn.sobject('Contact').findOne({
      Email: email,
    })
    return result ?? { Id: '', message: 'Contact not found' }
  }
}
