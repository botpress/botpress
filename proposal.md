Proposal for Error Codes

There is no standard actually for error codes, we basically just throw an error and gives little details on the issue.
Every errors should have a code assigned to it so we can document them and more easily find answers on how to solve the problem.

Suggestion for codes:

- 000 - 030: Critical errors (prevents normal functions)
- 031 - 474: Any other error (first come, first served)
- 475 - 499: Dev errors (gulp, build, module builder, etc)
- 500+: Modules

What are your thoughts on the implementation in errors.ts?
