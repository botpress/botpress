export enum SalesforceObject {
  Contact = 'Contact',
  Case = 'Case',
  Lead = 'Lead',
}
export type QueryOutput =
  | {
      success: true
      records: any[]
    }
  | { success: false; error: string }
