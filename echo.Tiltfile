# 0. constants

## 0.1. ports

READINESS_PORT = 8086
CHAT_INTEGRATION_PORT = 8089
ECHO_BOT_PORT = 8090
PUSHPIN_PUBLIC_INNER_PORT = 7999
PUSHPIN_PRIVATE_INNER_PORT = 5561
PUSHPIN_PUBLIC_PORT = 7001
PUSHPIN_PRIVATE_PORT = 6001
DYNAMO_DB_PORT = 8000

## 0.2. strings

AUTH_ENCRYPTION_KEY = "allo"
WORK_DIR = os.path.dirname(__file__)
BOTPRESS_HOME_DIR = "%s/.botpresshome.echo" % WORK_DIR
PUSHPIN_CONFIG_PATH="%s/pushpin.conf" % WORK_DIR
LOCAL_AWS_ACCESS_KEY_ID = "FOO"
LOCAL_AWS_SECRET_ACCESS_KEY = "BAR"
ECHO_BOT_PATH = "%s/bots/echo" % WORK_DIR
CHAT_INT_PATH = "%s/integrations/chat" % WORK_DIR

CONV_FID_STORE = struct(
  table_name='chat-integration-conversation-fid-store',
  index_name='chat-integration-conversation-id-store',
  partition_key='bot_id',
  sort_key='fid',
  index_sort_key='id',
)

USER_FID_STORE = struct(
  table_name='chat-integration-user-fid-store',
  index_name='chat-integration-user-id-store',
  partition_key='bot_id',
  sort_key='fid',
  index_sort_key='id',
)

## 0.3. utils

def encode_base64(content):
    return str(local(
        command=['base64'],
        quiet=True,
        echo_off=True,
        stdin=content,
    )).strip()

# 0.4. env

BP_HOME_ENV = struct(key='BP_BOTPRESS_HOME', value=BOTPRESS_HOME_DIR)

# 1. config

config.define_bool('skip-install')
config.define_bool('skip-build')
config.define_string('bp-domain')
config.define_string('bp-token')
config.define_string('bp-workspace-id')
cfg = config.parse()

config_skip_install = cfg.get('skip-install', False)
config_skip_build = cfg.get('skip-build', False)
config_bp_domain = cfg.get('bp-domain', None)
config_bp_token = cfg.get('bp-token', None)
config_bp_workspace_id = cfg.get('bp-workspace-id', None)

if not config_bp_domain:
  fail("config 'bp-domain' is required")

if not config_bp_token:
  fail("config 'bp-token' is required")

if not config_bp_workspace_id:
  fail("config 'bp-workspace-id' is required")

CONFIG = struct(
  skip_install=config_skip_install,
  skip_build=config_skip_build,
  bp_domain=config_bp_domain,
  bp_token=config_bp_token,
  bp_workspace_id=config_bp_workspace_id,
)

api_webhook_domain = "webhook.%s" % CONFIG.bp_domain
api_api_domain = "api.%s" % CONFIG.bp_domain
api_tunnel_domain = "tunnel.%s" % CONFIG.bp_domain
api_api_url = "https://%s" % api_api_domain
api_tunnel_url = "https://%s" % api_tunnel_domain

API = struct(
  bp_webhook_domain = api_webhook_domain,
  bp_api_domain = api_api_domain,
  bp_tunnel_domain = api_tunnel_domain,
  bp_api_url = api_api_url,
  bp_tunnel_url = api_tunnel_url,
)

# 2. docker compose

dynamodb_resource = {
  "image": "amazon/dynamodb-local",
  "ports": ["%s:%s" % (DYNAMO_DB_PORT, DYNAMO_DB_PORT)],
  "environment": {
    "DYNAMODB_LOCAL_LOG": "DEBUG"
  }
}

PUSHPIN_ROUTES = "* %s:443,ssl,insecure,host=%s" % (API.bp_webhook_domain, API.bp_webhook_domain)
PUSHPIN_CONFIG = "%s" % read_file(PUSHPIN_CONFIG_PATH, '')
pushpin_ressource = {
  "image": "botpress/pushpin",
  "environment": {
    "PUSHPIN_ROUTES": PUSHPIN_ROUTES,
    "PUSHPIN_CONFIG": PUSHPIN_CONFIG,
  },
  'ports': ['%s:%s' % (PUSHPIN_PUBLIC_PORT, PUSHPIN_PUBLIC_INNER_PORT), '%s:%s' % (PUSHPIN_PRIVATE_PORT, PUSHPIN_PRIVATE_INNER_PORT)],
  'platform': 'linux/amd64',
}

docker_compose(encode_yaml({
  'version': '3.5',
  'services': {
    'run-pushpin': pushpin_ressource,
    'run-dynamodb': dynamodb_resource,
  },
}))

dc_readiness = [
  { 'type': 'http', 'name': 'run-pushpin', 'url': 'http://localhost:%s' % PUSHPIN_PUBLIC_PORT },
  { 'type': 'dynamodb', 'name': 'run-dynamodb', 'uri': 'http://localhost:%s' % DYNAMO_DB_PORT },
]

# 3. ressources

## 3.1. utils

local_resource(
  name='pnpm-install',
  cmd='pnpm install' if not CONFIG.skip_install else 'echo skipped',
  labels=['utils']
)

local_resource(
  name='pnpm-build',
  cmd='pnpm build' if not CONFIG.skip_build else 'echo skipped',
  labels=['utils'],
  resource_deps=['pnpm-install']
)

local_resource(
  name='login-botpress',
  cmd='pnpm bp login',
  env={
    BP_HOME_ENV.key: BP_HOME_ENV.value,
    'BP_API_URL': API.bp_api_url,
    'BP_TOKEN': CONFIG.bp_token,
    'BP_WORKSPACE_ID': CONFIG.bp_workspace_id,
  },
  resource_deps=['pnpm-install', 'pnpm-build'],
  labels=['utils'],
)

readiness_deps=[r['name'] for r in dc_readiness] + ['pnpm-install', 'pnpm-build']
local_resource(
  name="readiness",
  allow_parallel=True,
  serve_cmd='pnpm ready',
  serve_env={
    'PORT': '%s' % READINESS_PORT,
    'LOG_LEVEL': 'info',
    'CONFIG': encode_json(dc_readiness),
    'AWS_REGION': 'localhost',
    'AWS_ACCESS_KEY_ID': LOCAL_AWS_ACCESS_KEY_ID,
    'AWS_SECRET_ACCESS_KEY': LOCAL_AWS_SECRET_ACCESS_KEY,
  },
  labels=['utils'],
  readiness_probe=probe(http_get=http_get_action(port=READINESS_PORT, path='/ready'), period_secs=2, failure_threshold=20),
  resource_deps=readiness_deps,
)

# 3.2. scripts

local_resource(
  name='create-conv-fid-store',
  cmd='pnpm ts-node -T ./scripts/dynamodb-create-table.ts',
  env={
    'AWS_REGION': "localhost",
    'AWS_ACCESS_KEY_ID': LOCAL_AWS_ACCESS_KEY_ID,
    'AWS_SECRET_ACCESS_KEY': LOCAL_AWS_SECRET_ACCESS_KEY,
    'endpoint': "http://localhost:%s" % DYNAMO_DB_PORT,
    'table_name': CONV_FID_STORE.table_name,
    'index_name': CONV_FID_STORE.index_name,
    'partition_key': CONV_FID_STORE.partition_key,
    'sort_key': CONV_FID_STORE.sort_key,
    'index_sort_key': CONV_FID_STORE.index_sort_key,
  },
  labels=['scripts'],
  resource_deps=['readiness'],
)

local_resource(
  name='create-user-fid-store',
  cmd='pnpm ts-node -T ./scripts/dynamodb-create-table.ts',
  env={
    'AWS_REGION': "localhost",
    'AWS_ACCESS_KEY_ID': LOCAL_AWS_ACCESS_KEY_ID,
    'AWS_SECRET_ACCESS_KEY': LOCAL_AWS_SECRET_ACCESS_KEY,
    'endpoint': "http://localhost:%s" % DYNAMO_DB_PORT,
    'table_name': USER_FID_STORE.table_name,
    'index_name': USER_FID_STORE.index_name,
    'partition_key': USER_FID_STORE.partition_key,
    'sort_key': USER_FID_STORE.sort_key,
    'index_sort_key': USER_FID_STORE.index_sort_key,
  },
  labels=['scripts'],
  resource_deps=['readiness'],
)

## 3.3. run

dc_resource(name='run-pushpin', labels=['run'])
dc_resource(name='run-dynamodb', labels=['run'])

local_resource(
  name='run-chat-integration',
  serve_cmd=" ".join([
    "pnpm -F @botpresshub/chat exec bp dev -v",
    "--secrets SIGNAL_URL=http://localhost:%s" % PUSHPIN_PRIVATE_PORT,
    "--secrets AUTH_ENCRYPTION_KEY=%s" % AUTH_ENCRYPTION_KEY,
    '--secrets FID_STORE_CONFIG="%s"' % encode_base64(encode_json({
      "strategy": "dynamo-db",
      "endpoint": "http://localhost:%s" % DYNAMO_DB_PORT,
      "region": "localhost",
      "accessKeyId": LOCAL_AWS_ACCESS_KEY_ID,
      "secretAccessKey": LOCAL_AWS_SECRET_ACCESS_KEY,
      "conversationTable": {
        "tableName": CONV_FID_STORE.table_name,
        "indexName": CONV_FID_STORE.index_name,
        "partitionKey": CONV_FID_STORE.partition_key,
        "sortKey": CONV_FID_STORE.sort_key,
        "indexSortKey": CONV_FID_STORE.index_sort_key,
      },
      "userTable": {
        "tableName": USER_FID_STORE.table_name,
        "indexName": USER_FID_STORE.index_name,
        "partitionKey": USER_FID_STORE.partition_key,
        "sortKey": USER_FID_STORE.sort_key,
        "indexSortKey": USER_FID_STORE.index_sort_key,
      }
    }))
  ]),
  serve_env={
    BP_HOME_ENV.key: BP_HOME_ENV.value,
    'BP_CONFIRM': 'true',
    'BP_TUNNEL_URL': API.bp_tunnel_url,
    'BP_PORT': str(CHAT_INTEGRATION_PORT),
  },
  resource_deps=['login-botpress', 'readiness', 'run-pushpin', 'create-conv-fid-store', 'create-user-fid-store'],
  labels=['run'],
  readiness_probe=probe(http_get=http_get_action(port=CHAT_INTEGRATION_PORT, path='/health'), period_secs=1, failure_threshold=10),
)

local_resource(
  name='run-echo-bot',
  cmd="pnpm -F echo exec bp add --use-dev -y -v",
  serve_cmd="pnpm -F echo exec bp dev -y --tunnel-url %s --port %s" % (API.bp_tunnel_url, ECHO_BOT_PORT),
  serve_env={
    BP_HOME_ENV.key: BP_HOME_ENV.value,
  },
  resource_deps=['login-botpress', 'run-chat-integration'],
  labels=['run'],
  readiness_probe=probe(http_get=http_get_action(port=ECHO_BOT_PORT, path='/health'), period_secs=1, failure_threshold=10),
)

## 3.3. test

# TODO: find a way to make this work without bash specific syntax
local_resource(
  name='test-chat-integration',
  cmd=" ".join([
    'wh_id=$(pnpm ts-node -T ./scripts/fetch-chat-wh.ts);',
    'API_URL=http://localhost:%s/$wh_id' % PUSHPIN_PUBLIC_PORT,
    'pnpm run -F @botpress/chat test:e2e'
  ]),
  env={
    BP_HOME_ENV.key: BP_HOME_ENV.value,
    'BP_API_URL': API.bp_api_url,
    'BP_TOKEN': CONFIG.bp_token,
    'BP_WORKSPACE_ID': CONFIG.bp_workspace_id,
    'ECHO_PATH': ECHO_BOT_PATH,
    'CHAT_PATH': CHAT_INT_PATH,
    'ENCRYPTION_KEY': AUTH_ENCRYPTION_KEY,   
  },
  resource_deps=['run-chat-integration', 'run-echo-bot'],
  labels=['test'],
)
