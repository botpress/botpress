export const createCaseUi = {
  subject: {
    title: 'The subject of the case (e.g. My Subject)',
  },
  suppliedName: {
    title: 'The supplied name for the case (e.g. ExampleName)',
  },
  description: {
    title: 'The description of the case',
  },
  priority: {
    title: 'The priority of the case (e.g. Medium)',
  },
  botId: {
    title: 'The bot ID (e.g. user-1)',
  },
}

export const createContactUi = {
  firstName: {
    title: 'The first name of the contact (e.g. John)',
  },
  lastName: {
    title: 'The last name of the contact (e.g. Doe)',
  },
  accountId: {
    title: 'The ID of the account associated with the contact',
  },
  email: {
    title: 'The email address of the contact (e.g. john.doe@example.com)',
  },
  phone: {
    title: 'The phone number of the contact (Optional) (e.g. +1-555-1234)',
  },
}

export const createLeadUi = {
  firstName: {
    title: 'The first name of the contact (e.g. John)',
  },
  lastName: {
    title: 'The last name of the lead (e.g. Doe)',
  },
  company: {
    title: 'The company of the lead (e.g. Acme Inc.)',
  },
  email: {
    title: 'The email address of the lead (e.g. john.doe@example.com)',
  },
  phone: {
    title: 'The phone number of the lead (Optional) (e.g. +1-555-1234)',
  },
}

export const updateCaseUi = {
  caseId: {
    title: 'The ID of the case to update',
  },
  subject: {
    title:
      'The updated subject of the case (Optional) (e.g. My Updated Subject)',
  },
  suppliedName: {
    title:
      'The updated supplied name for the case (Optional) (e.g. UpdatedExampleName)',
  },
  description: {
    title: 'The updated description of the case (Optional)',
  },
  priority: {
    title: 'The updated priority of the case (Optional) (e.g. High)',
  },
  origin: {
    title:
      'The updated origin of the case (Optional) (e.g. Botpress: bot user-1)',
  },
}

export const findContactUi = {
  email: {
    title: 'Contact email (e.g. example@example.com)',
  },
}

export const findLeadUi = {
  email: {
    title: 'Contact email (e.g. example@example.com)',
  },
}
