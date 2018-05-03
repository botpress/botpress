---
layout: guide
---

Tags are a way to segment or store information about specific users. A user can have an unlimited number of tags. Tags may also have values if specified. You can tag & untag users, check if a user has a specific tag and you can also list the users that have a set of tags.

### Tag a user (`bp.users.tag(userId, tag, [value]) -> Promise<null>`) <a class="toc" id="toc-tag-a-user-bp-users-tag-userid-tag-value-promise" href="#toc-tag-a-user-bp-users-tag-userid-tag-value-promise"></a>

### Untag a user (`bp.users.untag(userId, tag) -> Promise<null>`) <a class="toc" id="toc-untag-a-user-bp-users-untag-userid-tag-promise" href="#toc-untag-a-user-bp-users-untag-userid-tag-promise"></a>


### Check if user has tag (`bp.users.hasTag(userId, tag) -> Promise<bool>`) <a class="toc" id="toc-check-if-user-has-tag-bp-users-hastag-userid-tag-promise" href="#toc-check-if-user-has-tag-bp-users-hastag-userid-tag-promise"></a>


### Get the value of a user tag (`bp.users.getTag(userId, tag) -> Promise<string>`) <a class="toc" id="toc-get-the-value-of-a-user-tag-bp-users-gettag-userid-tag-promise" href="#toc-get-the-value-of-a-user-tag-bp-users-gettag-userid-tag-promise"></a>


### Get all the tags of a user (`bp.users.getTags(userId) -> Promise<array<{ key, value }>>`) <a class="toc" id="toc-get-all-the-tags-of-a-user-bp-users-gettags-userid-promise" href="#toc-get-all-the-tags-of-a-user-bp-users-gettags-userid-promise"></a>


### List all users with all tags (`bp.users.listWithTags(array<tags>, [limit=50], [from=0]) -> Promise<array<User>>`) <a class="toc" id="toc-list-all-users-with-all-tags-bp-users-listwithtags-array-limit-50-from-0-promise" href="#toc-list-all-users-with-all-tags-bp-users-listwithtags-array-limit-50-from-0-promise"></a>

