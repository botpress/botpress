export const getBaseTablesUi = {}

export const getTableRecordsUi = {
  tableIdOrName: {
    title: 'The ID or Name of the table (e.g. tblFnqcm4zLVKn85A or articles)',
  },
}

export const createTableUi = {
  name: { title: 'Name of the Table (e.g. MyTable)' },
  fields: {
    title:
      'The Table\'s fields, separated by commas. Each field should be in the format "type_name" (e.g. "phoneNumber_Customer Phone, singleLineText_Address").',
  },
  description: {
    title: 'Description of the Table (e.g. This is my table) (Optional)',
  },
}

export const updateTableUi = {
  tableIdOrName: {
    title: 'The ID or Name of the table (e.g. tblFnqcm4zLVKn85A or articles)',
  },
  name: {
    title: 'Name of the Table (e.g. MyTable) (Optional)',
  },
  description: {
    title: 'Description of the Table (e.g. This is my table) (Optional)',
  },
}

export const createRecordUi = {
  tableIdOrName: {
    title: 'The ID or Name of the table (e.g. tblFnqcm4zLVKn85A or articles)',
  },
  fields: {
    title:
      'The fields and their values for the new record, in a JSON format (e.g. {"Name":"John Doe","City":"In the moon","Verify":true})',
  },
}

export const updateRecordUi = {
  tableIdOrName: {
    title: 'The ID or Name of the table (e.g. tblFnqcm4zLVKn85A or articles)',
  },
  recordId: {
    title: 'The ID of the Record to be updated',
  },
  fields: {
    title: 'The fields and their values for the new record, in a JSON format (e.g. {"Name":"John Doe","Verify":true})',
  },
}
