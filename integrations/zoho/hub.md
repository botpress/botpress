# Botpress Integration: Zoho CRM

## **Zoho CRM Integration Guide**

For further details, refer to the [**Zoho CRM API documentation**](https://www.zoho.com/crm/developer/docs/api/v7/).

## **Overview**
This Botpress integration allows seamless interaction with **Zoho CRM**. It enables users to manage contacts, deals, appointments, and files directly through their chatbot.

## **Features**
- **Record Management:** Create, retrieve, update, delete, and search records.
- **Appointments Management:** Create, update, retrieve, and delete appointments.
- **File Management:** Upload and retrieve files.
- **Emails:** Send emails and associate them with records.
- **Organization & User Management:** Retrieve organization details and user information.

## Register Your Application

Before making any API calls using the Zoho Botpress Integration, you must register your application with **Zoho CRM**.

### **[Loom video walk through setting up the OAuth configuration.](https://www.loom.com/share/41c2811c047a48cbb08a2d1b0dc98f69?sid=8cb4d496-2cca-415d-be1d-536a87c73a3a)** ###


### Steps to Register

1. **Go to the [Zoho Developer Console](https://accounts.zoho.com/developerconsole).**
2. Click **Add Client**.
3. Choose the client type: **Self Client**.
4. Click the **Generate Code** tab and enter the following scopes:

   ```
   ZohoCRM.modules.ALL,ZohoCRM.org.ALL,ZohoCRM.users.ALL,ZohoCRM.settings.ALL,ZohoCRM.send_mail.all.CREATE,ZohoCRM.files.CREATE,ZohoCRM.files.READ
   ```

5. Set the **time duration** to **10 minutes**.
6. Provide a scope description (This is not vital to the registration).
7. Click **Create**, select your CRM, and click **Create** again.
8. Download your **credentials file**.

### Generate Access Token

Now, execute the following **cURL** command to obtain an access token. Ensure you use the **correct region URL** for OAuth authentication.

#### **Zoho Accounts Domains:**
| Region         | Accounts URL                       |
|---------------|----------------------------------|
| US           | `https://accounts.zoho.com`     |
| AU           | `https://accounts.zoho.com.au`  |
| EU           | `https://accounts.zoho.eu`      |
| IN           | `https://accounts.zoho.in`      |
| CN           | `https://accounts.zoho.com.cn`  |
| JP           | `https://accounts.zoho.jp`      |
| SA (Saudi Arabia) | `https://accounts.zoho.sa` |
| CA (Canada)  | `https://accounts.zohocloud.ca` |

### Execute cURL Request
Replace the placeholders (`CLIENT_ID`, `CLIENT_SECRET`, and `AUTHORIZATION_CODE`) with your actual values before executing the request.

```sh
curl --request POST \
  --url 'https://YOUR_REGION_ACCOUNT_URL/oauth/v2/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data 'grant_type=authorization_code' \
  --data 'client_id=YOUR_CLIENT_ID' \
  --data 'client_secret=YOUR_CLIENT_SECRET' \
  --data 'redirect_uri=YOUR_REDIRECT_URI' \
  --data 'code=AUTHORIZATION_CODE'
```

### Expected Response
If the request is successful, you should receive a response similar to the following:

```json
{
    "access_token": "{access_token}",
    "refresh_token": "{refresh_token}",
    "api_domain": "https://www.zohoapis.com",
    "token_type": "Bearer",
    "expires_in": 3600
}
```

## Configure Zoho Botpress Integration
Once you have the necessary credentials, navigate to the **Zoho Botpress Integration** configuration page and enter the following details:

- **Client ID**
- **Client Secret**
- **Access Token**
- **Refresh Token**
- **Region**

This completes the registration and integration process for **Zoho Botpress**. You are now ready to start making authorized API calls.

---

For more details, refer to the [Zoho API Documentation](https://www.zoho.com/crm/developer/docs/).

---
## API Functions & Usage
Below are the available actions in this integration:

### 1️⃣ **Record Management**
#### **Insert Record**
- **Method:** `POST /crm/v7/{module}`
- **Input:**
  ```json
  {
    "module": "Leads",
    "data": [{"Last_Name":"Daly","First_name":"Paul","Email": "p.daly@zylker.com"}]
  }
  ```
- **Output:**
  ```json
    {
    "success": true,
    "message": "Request successful",
    "data": {
        "code": "SUCCESS",
        "message": "Record added",
        "status": "success",
        "details": {
        "id": "27234000000176001",
        "Created_By": "Matea Vasileski",
        "Modified_By": "Matea Vasileski",
        "Created_Time": "2025-02-26T18:39:39-05:00",
        "Modified_Time": "2025-02-26T18:39:39-05:00"
        }
    }
    }
  ```

#### **Get Records**
- **Method:** `GET /crm/v7/{module}`
- **Input:**
  ```json
  {
    "module": "Leads",
    "params": {"fields": "Email"}
  }
  ```
- **Output:**
  ```json
    {
    "success": true,
    "message": "Request successful",
    "data": {
        "id": "27234000000157008",
        "Full_Name": "Jim Mulani",
        "First_Name": "Jim",
        "Last_Name": "Mulani",
        "Email": "updated@email.com",
        "Company": "envy",
        "Owner": {
        "name": "Matea Vasileski",
        "id": "27234000000095001",
        "email": "matea@envyro.io"
        },
        "Created_By": {
        "name": "Matea Vasileski",
        "id": "27234000000095001",
        "email": "matea@envyro.io"
        },
        "Modified_By": {
        "name": "Matea Vasileski",
        "id": "27234000000095001",
        "email": "matea@envyro.io"
        },
        "Created_Time": "2025-02-23T21:51:21-05:00",
        "Modified_Time": "2025-02-26T18:19:10-05:00",
        "Lead_Status": null,
        "Lead_Source": null,
        "Record_Status": "Available"
    }
    }
  ```

#### **Get Record By ID**
- **Method:** `GET /crm/v7/{module}/{recordId}`
- **Input:**
  ```json
  {
    "module": "Leads",
    "recordId": "27234000000157008"
  }
  ```
- **Output:**
  ```json
    {
    "success": true,
    "message": "Request successful",
    "data": {
        "id": "27234000000157008",
        "Full_Name": "Jim Mulani",
        "First_Name": "Jim",
        "Last_Name": "Mulani",
        "Email": "updated@email.com",
        "Company": "envy",
        "Owner": {
        "name": "Matea Vasileski",
        "id": "27234000000095001",
        "email": "matea@envyro.io"
        },
        "Created_By": {
        "name": "Matea Vasileski",
        "id": "27234000000095001",
        "email": "matea@envyro.io"
        },
        "Modified_By": {
        "name": "Matea Vasileski",
        "id": "27234000000095001",
        "email": "matea@envyro.io"
        },
        "Created_Time": "2025-02-23T21:51:21-05:00",
        "Modified_Time": "2025-02-26T18:19:10-05:00",
        "Lead_Status": null,
        "Lead_Source": null,
        "Record_Status": "Available"
    }
    }
  ```

#### **Update Record**
- **Method:** `PUT /crm/v7/{module}/{recordId}`
- **Input:**
  ```json
  {
    "module": "Leads",
    "recordId": "27234000000162001",
    "data": [{"Email":"updated@email.com"}]
  }
  ```
- **Output:** 
```json
    {
    "success": true,
    "message": "Request successful",
    "data": {
        "code": "SUCCESS",
        "message": "Record updated",
        "status": "success",
        "details": {
        "id": "27234000000157008",
        "Created_By": "Matea Vasileski",
        "Modified_By": "Matea Vasileski",
        "Created_Time": "2025-02-23T21:51:21-05:00",
        "Modified_Time": "2025-02-26T18:55:37-05:00"
        }
    }
    }
```

#### **Delete Record**
- **Method:** `DELETE /crm/v7/{module}/{recordId}`
- **Input:**
  ```json
  {
    "module": "Leads",
    "recordId": "27234000000162008"
  }
  ```
- **Output:**
  ```json
    {
    "success": true,
    "message": "Request successful",
    "data": {
        "code": "SUCCESS",
        "message": "Record deleted",
        "status": "success",
        "details": {
        "id": "27234000000157008"
        }
    }
    }
  ```

#### **Search Records**
- **Method:** `GET /crm/v7/{module}/search`
- **Input:**
  ```json
  {
    "module": "Leads",
    "criteria": "(First_Name:equals:John)"
  }
  ```
- **Output:** 
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "records": [
      {
        "id": "27234000000176001",
        "Full_Name": "Daly",
        "Email": "p.daly@zylker.com",
        "Created_Time": "2025-02-26T18:39:39-05:00",
        "Modified_Time": "2025-02-26T18:39:39-05:00",
        "Owner": {
          "name": "Matea Vasileski",
          "email": "matea@envyro.io"
        },
        "Record_Status": "Available"
      },
      {
        "id": "27234000000174002",
        "Full_Name": "Daly",
        "Email": "p.daly@zylker.com",
        "Created_Time": "2025-02-26T18:17:10-05:00",
        "Modified_Time": "2025-02-26T18:17:10-05:00",
        "Owner": {
          "name": "Matea Vasileski",
          "email": "matea@envyro.io"
        },
        "Record_Status": "Available"
      }
    ],
    "pagination": {
      "per_page": 200,
      "count": 2,
      "page": 1,
      "sort_by": "id",
      "sort_order": "desc",
      "more_records": false
    }
  }
}

```

---
### 2️⃣ **Appointments Management**
#### **Create Appointment**
- **Method:** `POST /crm/v7/Appointments__s`
- **Input:**
  ```json
    [
        {
            Appointment_Name: 'Matea - Mowing Service',
            Appointment_For: {
            module: {
                api_name: 'Contacts'
            },
            name: 'k m',
            id: '27234000000163029'
            },
            Service_Name: {
            name: 'mow',
            id: '27234000000168178'
            },
            Appointment_Start_Time: '2025-02-24T19:33:00Z',
            Owner: '27234000000095001',
            Location: 'Business Address',
            Address: 'Business Address',
            Additional_Information: '',
            Remind_At: [
            {
                unit: 30,
                period: 'minutes'
            }
            ],
            Price: '$1.00'
        }
    ]
  ```
- **Output:** 
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "code": "SUCCESS",
    "message": "Record added",
    "status": "success",
    "details": {
      "id": "27234000000175008",
      "Created_By": "Matea Vasileski",
      "Modified_By": "Matea Vasileski",
      "Created_Time": "2025-02-26T19:21:59-05:00",
      "Modified_Time": "2025-02-26T19:21:59-05:00"
    }
  }
}
```

#### **Get Appointments**
- **Method:** `GET /crm/v7/Appointments__s`
- **Input:**
  ```json
  {
    "params": {"fields":"Service_Name"}
  }
  ```
- **Output:** 
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "records": [
      {
        "id": "27234000000159008",
        "Service_Name": {
          "name": "mow",
          "id": "27234000000168178"
        }
      }
    ],
    "pagination": {
      "per_page": 200,
      "count": 1,
      "page": 1,
      "sort_by": "id",
      "sort_order": "desc",
      "more_records": false
    }
  }
}
```

#### **Get Appointment By ID**
- **Method:** `GET /crm/v7/Appointments__s/{appointmentId}`
- **Input:**
  ```json
  {
    "appointmentId": "123456"
  }
  ```
- **Output:** 
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "appointment": {
      "id": "27234000000175008",
      "Appointment_Name": "Matea - Mowing Service",
      "Service_Name": {
        "name": "mow",
        "id": "27234000000168178"
      },
      "Appointment_For": {
        "name": "k m",
        "id": "27234000000163029",
        "module": "Contacts"
      },
      "Owner": {
        "name": "Matea Vasileski",
        "email": "matea@envyro.io"
      },
      "Created_By": {
        "name": "Matea Vasileski",
        "email": "matea@envyro.io"
      },
      "Modified_By": {
        "name": "Matea Vasileski",
        "email": "matea@envyro.io"
      },
      "Appointment_Start_Time": "2025-02-24T14:33:00-05:00",
      "Appointment_End_Time": "2025-02-24T15:03:00-05:00",
      "Duration": 30,
      "Status": "Overdue",
      "Location": "Business Address",
      "Remind_At": [
        {
          "unit": 30,
          "period": "minutes"
        }
      ],
      "Created_Time": "2025-02-26T19:21:59-05:00",
      "Modified_Time": "2025-02-26T19:21:59-05:00",
      "Record_Status": "Available"
    }
  }
}
```

#### **Update Appointment**
- **Method:** `PUT /crm/v7/Appointments__s/{appointmentId}`
- **Input:**
  ```json
  {
    "appointmentId": "27234000000159008",
    "data": {
        "appointments": [
            {
            "Appointment_Name": "Update appt",
            "Appointment_For": {
                "module": "Contacts",
                "name": "k m",
                "id": "27234000000163029"
            },
            "Service_Name": {
                "name": "mow",
                "id": "27234000000168178"
            },
            "Appointment_Start_Time": "2025-02-24T19:33:00Z",
            "Owner": "27234000000095001",
            "Location": "Business Address",
            "Address": "Business Address",
            "Additional_Information": "",
            "Remind_At": [
                {
                "unit": 30,
                "period": "minutes"
                }
            ],
            "Price": "$1.00"
            }
        ]
    }
  }
  ```
- **Output:** 
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "code": "SUCCESS",
    "message": "Record updated",
    "status": "success",
    "details": {
      "id": "27234000000159008",
      "Created_By": "Matea Vasileski",
      "Modified_By": "Matea Vasileski",
      "Created_Time": "2025-02-24T19:44:23-05:00",
      "Modified_Time": "2025-02-26T19:48:20-05:00"
    }
  }
}
```

#### **Delete Appointment**
- **Method:** `DELETE /crm/v7/Appointments__s/{appointmentId}`
- **Input:**
  ```json
  {
    "appointmentId": "123456"
  }
  ```
- **Output:** 
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "code": "SUCCESS",
    "message": "Record deleted",
    "status": "success",
    "details": {
      "id": "27234000000159008"
    }
  }
}
```

---
### 3️⃣ **File Management**
#### **Upload File**
- **Method:** `POST /crm/v7/files`
- **Input:**
```json
{
"fileUrl": "https://example.com/file.pdf"
}
```
- **Output:**
```json
{
"success": true,
"message": "File uploaded successfully",
"data": {
    "code": "SUCCESS",
    "message": "File uploaded successfully",
    "status": "success",
    "details": {
    "name": "20250226050635-LO9N1PT0.webp",
    "id": "36c38a1979b316686084c58303b1b6cb654eb04f0f1038ed0a8fdf8a6ff28598dceae7f8711509bfd80b56bf8cd4dbba"
    }
}
}
```

#### **Get File**
- **Method:** `GET /crm/v7/files/{fileId}`
- **Input:**
```json
{
"fileId": "dcc53e79cfef0810414e8335b0e11d8882a51116f390194f400828673ca4a59492a22be84db32aa8425d0859862491f9"
}
```
- **Output:**
```json
{
    "success":true,
    "message":"Request successful",
    "data": BinaryFileData
}
```

---
### 4️⃣ **Organization & User Management**
#### **Get Organization Details**
- **Method:** `GET /crm/v7/org`
- **Input:**
No input is required.

- **Output:** 
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "organization": {
      "id": "27234000000000684",
      "company_name": "Envyro",
      "domain_name": "org110000680144",
      "primary_email": "matea@envyro.io",
      "currency": "Canadian Dollar - CAD",
      "currency_symbol": "$",
      "time_zone": "America/Toronto",
      "country_code": "US",
      "license_details": {
        "paid": true,
        "paid_type": "professional",
        "paid_expiry": "2025-03-23T20:00:00-04:00",
        "users_license_purchased": 1
      },
      "created_time": "2024-09-11T11:04:19-04:00"
    }
  }
}

```

#### **Get Users**
- **Method:** `GET /crm/v7/users`
- **Input:**
  ```json
  {
    "params": {"status":"active"}
  }
  ```
- **Output:** 
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "users": [
      {
        "id": "27234000000095001",
        "full_name": "Matea Vasileski",
        "email": "matea@envyro.io",
        "role": "CEO",
        "profile": "Administrator",
        "status": "active",
        "country": "Canada",
        "state": "Ontario",
        "time_zone": "America/Toronto",
        "created_time": "2024-09-11T11:04:19-04:00",
        "modified_time": "2024-09-11T11:04:19-04:00"
      },
      {
        "id": "27234000000103062",
        "full_name": "Milos Arsik",
        "email": "milos@envyro.io",
        "role": "CEO",
        "profile": "Administrator",
        "status": "closed",
        "time_zone": "America/Toronto",
        "created_time": "2024-09-16T00:36:14-04:00",
        "modified_time": "2024-11-01T12:18:54-04:00"
      }
    ],
    "pagination": {
      "per_page": 200,
      "count": 2,
      "page": 1,
      "more_records": false
    }
  }
}
```

---
### 5️⃣ **Emails**
#### **Send Email**
- **Method:** `POST /crm/v7/emails`
- **Input:**
  ```json
  {
    "module": "Leads",
    "recordId": "123456",
    "data": [
        {
            from: {
            user_name: 'Matea Vasileski',
            email: 'matea@envyro.io'
            },
            to: [
            {
                user_name: 'user1',
                email: 'milos@envyro.io'
            }
            ],
            cc: [],
            bcc: [],
            subject: 'Important Update',
            content: 'Here is an important update for you.',
            mail_format: 'html'
        }
        ]
  }
  ```
- **Output:**
```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "code": "SUCCESS",
    "message": "Your mail has been sent successfully.",
    "status": "success",
    "details": {
      "message_id": "2e660cab6382a85766b68e77778eadf168f923354a69b362ace2e52ce0b934ba"
    }
  }
}
```

---
