---
id: basic-authentication
title: Basic Authentication
---

---

Basic Authentication allows a user to log in with a simple username/password. The password is salted for added security.

To create more accounts, visit the `Collaborators` tab on the Admin UI. Choose the role and enter the email of your collaborator, then you will receive a random password. The user will change this password after the first login.

Super Admins can reset the password of any user from the Action menu in the collaborators' interface.
![RBAC](/assets/password-change.png)

## Configuration Example

In your `botpress.config.json` file:

```js
{
 "pro": {
    "collaboratorsAuthStrategies": ["default"],
  },
  "authStrategies": {
    "default": {
      "type": "basic",
      "label": "Default Auth",
      "options": {}
    }
  }
}
```

### Additional Security

You can configure additional options when using this authentication strategy. Please refer to the [configuration file for more information](https://github.com/botpress/v12/blob/master/packages/bp/src/core/config/botpress.config.ts#L350) :

- `maxLoginAttempt`: Maximum number of tries allowed before locking out the user.
- `lockoutDuration`: Account will be disabled for this amount of time when a user reaches the `maxLoginAttempt`.
- `passwordExpiryDelay`: Password will expire after this time lapses.
- `passwordMinLength`: Minimum length for the user's password.
- `requireComplexPassword`: Requires at least one character of 3 categories of characters.

### Forgot your password?

Only the first user is allowed to register a new account. If you forgot your password and can't access your account, you will need to clear the list of users, and then you will be able to re-create your account. However, if you have already created other users with an administrator role, they can reset your password for you.

You can clear the list of users by emptying (or deleting) the table `strategy_default` (if you are using the default strategy)
