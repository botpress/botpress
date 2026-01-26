
// -----LEADS------

export type KommoLead = {
  id: number
  name: string
  price: number
  responsible_user_id: number
  group_id: number
  status_id: number
  pipeline_id: number
  loss_reason_id: number | null
  created_by: number
  updated_by: number
  created_at: number 
  updated_at: number  
  closed_at: number | null
  closest_task_at: number | null
  is_deleted: boolean
  score: number | null
  account_id: number
  labor_cost: number | null
  is_price_computed: boolean

  custom_fields_values?: Array<{
    field_id: number
    field_name: string
    field_code?: string | null     
    field_type: string              
    values: Array<{
      value: string | number
      enum_id?: number              
    }>
  }>

  // Embedded relationships (contacts, companies, tags)
  _embedded?: {
    tags?: Array<{
      id: number
      name: string
    }>
    companies?: Array<{
      id: number
      _links: {
        self: {
          href: string
        }
      }
    }>
    contacts?: Array<{
      id: number
      is_main: boolean
      _links: {
        self: {
          href: string
        }
      }
    }>
  }
  _links?: {
    self: {
      href: string
    }
  }
}


export type CreateLeadRequest = {
  name: string  // REQUIRED - only required field!
  price?: number
  responsible_user_id?: number
  pipeline_id?: number
  status_id?: number
  created_by?: number
  updated_by?: number
  created_at?: number
  updated_at?: number
  closed_at?: number

  // Custom fields
  custom_fields_values?: Array<{
    field_id: number
    values: Array<{
      value: string | number
    }>
  }>

  // Embedded data (tags, contacts, companies)
  _embedded?: {
    tags?: Array<{
      id?: number  
      name?: string  
    }>
    contacts?: Array<{
      id: number
      is_main?: boolean
    }>
    companies?: Array<{
      id: number
    }>
  }
}


export type UpdateLeadRequest = {
  id?: number 
  name?: string
  price?: number
  responsible_user_id?: number
  status_id?: number
  pipeline_id?: number
  custom_fields_values?: Array<{
    field_id: number
    values: Array<{
      value: string | number
    }>
  }>
}


export type KommoCreateResponse = {
  _links: {
    self: {
      href: string
    }
  }
  _embedded: {
    leads: Array<{
      id: number
      request_id: string  
      _links: {
        self: {
          href: string
        }
      }
    }>
  }
}


export type KommoUpdateResponse = {
  _links: {
    self: {
      href: string
    }
  }
  _embedded: {
    leads: KommoLead[]
  }
}

export type KommoSearchLeadResponse = {
  _page: number
  _links: {
    self: {
      href: string
    }
  }
  _embedded: {
    leads: KommoLead[]
  }
}


// -------------CONTACTS-------------

// full contact with all details
export type KommoContact = {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  responsible_user_id: number;
  group_id: number;
  updated_by: number;
  created_at: number;
  updated_at: number;
  closest_task_at: number | null;
  is_deleted: boolean;
  account_id: number;

};


// sends data to kommo
export type CreateContactRequest = {
  name?: string;
  first_name?: string
  last_name?: string;
  responsible_user_id: number;
  created_by: number;
  updated_by?: number;
};

// what kommo returns after creating contats
export type KommoCreateContactResponse = {
  _links:{
    self:{
      href:string;
    };
  };
  _embedded:{
    contacts: Array<{
      id:number;
      request_id: string;
      _links:{
        self:{
        href:string;
       };
      };
    }>;
  };
}

// for searching contacts by phone number
export type KommoSearchContactsResponse = {
  _page: number;
  _links: {
    self: {
      href: string;
    };
    next?: {
      href: string;
    };
  };
  _embedded: {
    contacts: KommoContact[];
  };
}

//----General-----
export type KommoErrorResponse = {
  title: string
  type: string
  status: number
  detail: string
  validation_errors?: Array<{
    request_id: string
    errors: Array<{
      code: string
      path: string
      detail: string
    }>
  }>
}