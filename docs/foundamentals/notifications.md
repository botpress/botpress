# Notifications

{% hint style='working' %}
**IN PROGRESS**: This part of the documentation needs some help from the community.
The Notifications API is well documented in the code (`/src/notifications.js`)
{% endhint %}

Notifications is a feature that allows you (or modules) to alert the user that something has happened. Notifications are persisted to the database and show up in the top right corner of the screen.

### Create a Notification (`bp.notifications.create({ message, level, redirectUrl, enableSound }) -> Promise<null>`)

### Get notifications inbox (`bp.notifications.getInbox() -> Promise<Array<Notification>>`)

### Get archived notifications (`bp.notifications.getArchived() -> Promise<Array<Notification>>`)

### Archive a notification (`bp.notifications.archive(notificationId) -> Promise`)

### Archive all notifications (`bp.notifications.archiveAll() -> Promise`)

### Mark a notification as read (`bp.notifications.markAsRead(notificationId) -> Promise`)

### Mark all notifications as read (`bp.notifications.markAllAsRead() -> Promise`)
