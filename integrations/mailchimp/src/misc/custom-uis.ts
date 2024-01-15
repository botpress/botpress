export const customerUi = {
  email: {
    title: 'The email address of the customer (e.g. example@example.com)',
  },
  firstName: {
    title: 'The first name of the customer (e.g. John) (Optional)',
  },
  lastName: {
    title: 'The last name of the customer (e.g. Doe) (Optional)',
  },
  company: {
    title: 'The company of the customer (e.g. Acme Inc.) (Optional)',
  },
  birthday: {
    title: 'The birthday of the customer (e.g. 01/01/2000) (Optional)',
  },
  language: {
    title: 'The language of the customer (e.g. en) (Optional)',
  },
  address1: {
    title: 'The first line of the address of the customer (e.g. 123 St Marie.) (Optional)',
  },
  address2: {
    title: 'The second line of the address of the customer (e.g. Apt. 4B) (Optional)',
  },
  city: {
    title: 'The city of the customer (e.g. Anytown) (Optional)',
  },
  state: {
    title: 'The state or province of the customer (e.g. CA) (Optional)',
  },
  zip: {
    title: 'The zip or postal code of the customer (e.g. 12345) (Optional)',
  },
  country: {
    title: 'The country of the customer (e.g. USA) (Optional)',
  },
  phone: {
    title: 'The phone number of the customer (e.g. 555-1234) (Optional)',
  },
}

export const addCustomerToCampaignUi = {
  campaignId: {
    title: 'The ID of the Mailchimp campaign (e.g. f6g7h8i9j0)',
  },
  ...customerUi,
}

export const addCustomerToListUi = {
  listId: {
    title: 'The ID of the Mailchimp list or audience (e.g. a1b2c3d4e5)',
  },
  ...customerUi,
}

export const sendMassEmailCampaignUi = {
  campaignIds: {
    title: 'The Campaign IDs (Can be either a string with comma-separated IDs)',
  },
}
