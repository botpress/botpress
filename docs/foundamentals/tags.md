# User Tags

{% hint style='info' %}
**New!** in Botpress **1.1**
{% endhint %}

Tags are a way to segment or store information about specific users. A user can have an unlimited number of tags. Tags may also have values if specified. You can tag & untag users, check if a user has a specific tag and you can also list the users that have a set of tags.

### Tag a user (`bp.users.tag(userId, tag, [value]) -> Promise<null>`)

### Untag a user (`bp.users.untag(userId, tag) -> Promise<null>`)

### Check if user has tag (`bp.users.hasTag(userId, tag) -> Promise<bool>`)

### Get the value of a user tag (`bp.users.getTag(userId, tag) -> Promise<string>`)

### Get all the tags of a user (`bp.users.getTags(userId) -> Promise<array<{ key, value }>>`)

### List all users with all tags (`bp.users.listWithTags(array<tags>, [limit=50], [from=0]) -> Promise<array<User>>`)
