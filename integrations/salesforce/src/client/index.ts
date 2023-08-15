import jsforce from 'jsforce'

export class SalesforceApi {
  private conn: jsforce.Connection

  constructor(
    username: string,
    password: string,
    securityToken: string,
    SFLoginURL?: string,
    apiVersion?: string
  ) {
    const opts = apiVersion ? { version: apiVersion } : null
    this.conn = new jsforce.Connection({
      loginUrl: SFLoginURL || 'https://login.salesforce.com',
      ...opts,
    })
    this.conn.login(username, password + securityToken)
  }

  async createCase(caseData: {
    Subject: string
    SuppliedName: string
    Description?: string
    Priority?: string
    Origin: string
  }) {
    const result = await this.conn.sobject('Case').create(caseData)
    return result
  }

  async createLead(leadData: {
    FirstName: string
    LastName: string
    Company: string
    Email?: string
    Phone?: string
  }) {
    const result = await this.conn.sobject('Lead').create(leadData)
    return result
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

  async findLead(email: string) {
    const result = await this.conn.sobject('Lead').find({
      Email: email,
    })
    return result[0]
  }

  async findContact(email: string) {
    const result = await this.conn.sobject('Contact').find({
      Email: email,
    })
    return result[0]
  }
}
