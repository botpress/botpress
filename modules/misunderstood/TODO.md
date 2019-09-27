- [x] table for misunderstood phrases status
- [x] auto-flag with NLU none
- [ ] action for flow flagging
- [x] get languages from the API
- [x] language selection
- [ ] sidebar with the list view
- [ ] main screen with actions
- [ ] archive view

---

---

- how do I get this list of misunderstood phrases –––– there's no list, we need to mark messages as misunderstood; you got to create two ways: one hook and one action (see slides). Basically we want the "hook" to automatically flag messages that are obviously misunderstood by the NLU (intent equals none). The "action" is for developers to mark a message as misunderstood themselves
  you can re-use the existing backend of the "history" module and simply use the "flagged" feature. it already does store all messages / conversations . all we got to do is flag them
  the logic for the hook is: if (event.nlu.intent.name === 'none') { flag message }
  for the action; nothing to do here (it will be called manually by developers in their flows); just expose a convenience shortcut to flag the current message

---

- how do I update their status as handled/ignored/deleted ––– this you have to add on the backend. you'll probably need a new DB table to keep track of that (their status + how they were amended)

---

- for a given phrase how do I get the conversation context (the one for the preview) –––– the "history" module already has this built-in (see /modules/.history/src/backend/db.ts)

---

Hope that helps and answers your questions

1. In the archive view there's an action "move back to new" I understand what's expected to be done with it when the phrase was
   You're right that's not trivial – I was actually thinking you can only remove it from the "Pending" list, before it's actually "Applied"
   once applied it's not reversible
   Eugene Mirotin
2. On the main screen there are 3 buttons, Amend, Skip, Delete. Skip is the same as Ignore as I understand it. Delete looks like
   Skip means go to the next, but leave it in the list
   Ignore === Delete, which means we decided not to amend it. It goes to "Pending" nonetheless and dissapears from "new".
   Amend === Save yes
