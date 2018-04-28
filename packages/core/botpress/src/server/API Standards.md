## Botpress API Standards

### 200/204 OK

Means that we received the request, the arguments were OK, we processed it and it worked. Returns JSON.

### 400 (Bad Request)

The request is invalid. Additionnal message may or may not be provided.

```js
{
  success: false,
  code: 10002, // error code, if known
  message: null or string // error message
}
```

### 401 (Unauthorized)

You must be authenticated to access this route

### 403 (Forbidden)

You must have the permissions to perform this operation

### 404 (Not found)

API endpoint not found

### 500 (Internal Error)

