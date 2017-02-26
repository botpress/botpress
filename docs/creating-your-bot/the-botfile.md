## The Botfile

The **botfile.js** is located at the root of a bot project and contains all the configuration required by Botpress to operate.

Here's an overview of the variables and what they do:

- `dataDir`: The data directory where all your bot's data will be saved, including the built-in database file and the modules data.
- `modulesConfigDir`: The modules configuration directory. Configuration is separate from regular data (`dataDir`) because you might want to checkin configuration to source-control.
- `disableFileLogs`: Setting to true will disable persisting logs to file system.
- `notification.file`: The name of the files where notifications are persisted NOTE: _(will be moved to the database in an upcoming version)_
- `notification.maxLength`: The maximum number of notifications to persist
- `log.file`: The name of the log files
- `log.maxSize`: The maximum size of log files
- `login.enabled`: If login is required
- `login.tokenExpiry`: The lifetime of an authentication token, after which clients will need to re-authenticate
- `login.password`: The password required to login. NOTE: the username is always `admin` (at time of writing)
- `login.maxAttempts`: The maximum amount of login attempts in the `login.resetAfter` time
- `login.resetAfter`: Resets login attempts after this time

## Accessing configuration

The configuration can be accessed programmatically directly in the `bp.botfile` object. For example, you may check if login is enabled by looking at `bp.botfile.login.enabled`.

## Customization

Since the botfile is a regular commonjs module, arbitrary code can be run in the botfile in order to compute the required fields. The exported value must always be the final configuration object and should be synchronous. You should never mutate the configuration at run time.
