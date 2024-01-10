# constants

## ports

OPENAPI_GENERATOR_SERVER_PORT = 8081
READINESS_PORT = 8082

## commands

GENERATE_CLIENT_RESSOURCES = ['pnpm-install', 'openapi-generator-server', 'readiness', 'generate-client']
BUILD_PACKAGES_RESSOURCES = GENERATE_CLIENT_RESSOURCES + ['build-client', 'build-sdk', 'build-cli']
BUILD_ALL_RESSOURCES = BUILD_PACKAGES_RESSOURCES + ['build-integrations', 'add-integrations', 'build-bots']

COMMAND_RESSOURCES = {
  'generate-client': GENERATE_CLIENT_RESSOURCES,
  'build-packages': BUILD_PACKAGES_RESSOURCES,
  'build-all': BUILD_ALL_RESSOURCES
}
AVAILABLE_COMMANDS = [k for k in COMMAND_RESSOURCES.keys()]

# config

config.define_string('cmd')
cfg = config.parse()
command = cfg.get('cmd', 'build-all')

if command not in AVAILABLE_COMMANDS:
  fail('command must be one of %s' % AVAILABLE_COMMANDS)

enabled_services = COMMAND_RESSOURCES[command]
config.clear_enabled_resources()
config.set_enabled_resources(enabled_services)

# resources

## pnpm install

local_resource(
  name='pnpm-install',
  cmd='pnpm install',
  labels=['scripts'],
)

## openapi-generator-server

openapi_generator_resource = {
  'image': 'botpress/openapi-generator-online',
  'ports': ['%s:8080' % OPENAPI_GENERATOR_SERVER_PORT],
  'restart': 'always',
}

docker_compose(encode_yaml({
  'version': '3.5',
  'services': {
    'openapi-generator-server': openapi_generator_resource,
  },
}))

dc_resource(name='openapi-generator-server', labels=['utils'])

## readiness

local_resource(
  name="readiness",
  allow_parallel=True,
  serve_cmd='pnpm ready',
  serve_env={
    'PORT': '%s' % READINESS_PORT,
    'LOG_LEVEL': 'info',
    'CONFIG': encode_json([
      { 'type': 'http', 'name': 'openapi-generator-server', 'url': 'http://localhost:%s' % OPENAPI_GENERATOR_SERVER_PORT },
    ]),
  },
  labels=['utils'],
  readiness_probe=probe(http_get=http_get_action(port=READINESS_PORT, path='/ready'), period_secs=1, failure_threshold=10),
  resource_deps=[
    'openapi-generator-server',
    'pnpm-install',
  ]
)

## generate client

local_resource(
  name='generate-client',
  allow_parallel=True,
  dir='packages/client',
  cmd='pnpm generate',
  env={
    'OPENAPI_GENERATOR_ENDPOINT': 'http://localhost:%s' % OPENAPI_GENERATOR_SERVER_PORT,
  },
  labels=['client'],
  resource_deps=['readiness']
)

## build client

local_resource(
  name='build-client',
  allow_parallel=True,
  dir='packages/client',
  cmd='pnpm build',
  labels=['client'],
  resource_deps=['generate-client'],
  deps=["./packages/client"]
)

## build sdk

local_resource(
  name='build-sdk',
  allow_parallel=True,
  dir='packages/sdk',
  cmd='pnpm build',
  labels=['sdk'],
  resource_deps=['build-client'],
  deps=["./packages/sdk"]
)

## build cli

local_resource(
  name='build-cli',
  allow_parallel=True,
  dir='packages/cli',
  cmd='pnpm build',
  labels=['cli'],
  resource_deps=['build-sdk'],
  deps=["./packages/cli"]
)

## build integrations

local_resource(
  name='build-integrations',
  allow_parallel=True,
  cmd='pnpm -r --stream -F @botpresshub/* exec bp build --source-map',
  labels=['integrations'],
  resource_deps=['build-cli'],
  deps=["./integrations"]
)

## build bots

bot_filter = ".\\bots\\*" if os.name == 'nt' else './bots/*'

local_resource(
  name='add-integrations',
  allow_parallel=True,
  cmd='pnpm -r --stream -F "%s" run integrations' % bot_filter,
  labels=['bots'],
  resource_deps=['build-integrations'],
  deps=["./bots"]
)

local_resource(
  name='build-bots',
  allow_parallel=True,
  cmd='pnpm -r --stream -F "%s" exec bp build --source-map' % bot_filter,
  labels=['bots'],
  resource_deps=['add-integrations'],
  deps=["./bots"]
)

