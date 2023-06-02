# ports

docker_compose_readiness = 9398
openapi_generator_server_port = 8080

# pnpm install

local_resource(
  name='pnpm-install',
  cmd='pnpm install',
  labels=['scripts'],
)

# openapi-generator-server

openapi_generator_resource = {
  'image': 'openapitools/openapi-generator-online:v6.6.0',
  'ports': ['%s:8080' % openapi_generator_server_port],
  'restart': 'always',
}

docker_compose(encode_yaml({
  'version': '3.5',
  'services': {
    'openapi-generator-server': openapi_generator_resource,
  },
}))

dc_resource(name='openapi-generator-server', labels=['utils'])

# readiness

local_resource(
  name="readiness",
  allow_parallel=True,
  serve_dir='local/readiness',
  serve_cmd='pnpm start',
  serve_env={
    'PORT': '%s' % docker_compose_readiness,
    'LOG_LEVEL': 'info',
    'CONFIG': encode_json([
      { 'type': 'http', 'name': 'openapi-generator-server', 'url': 'http://localhost:%s' % openapi_generator_server_port },
    ]),
  },
  labels=['utils'],
  readiness_probe=probe(http_get=http_get_action(port=docker_compose_readiness, path='/ready'), period_secs=1, failure_threshold=10),
  resource_deps=[
    'openapi-generator-server',
    'pnpm-install',
  ],
  deps=['local/readiness'],
)

# client

local_resource(
  name='build-client',
  allow_parallel=True,
  dir='packages/client',
  cmd='pnpm generate && pnpm type-check && pnpm build',
  env={
    'OPENAPI_GENERATOR_ENDPOINT': 'http://localhost:%s' % openapi_generator_server_port,
  },
  labels=['client'],
  resource_deps=[
    'pnpm-install',
    'openapi-generator-server',
    'readiness',
  ]
)

# sdk

local_resource(
  name='build-sdk',
  allow_parallel=True,
  dir='packages/sdk',
  cmd='pnpm type-check && pnpm build',
  labels=['sdk'],
  resource_deps=['build-client']
)

# cli

local_resource(
  name='build-cli',
  allow_parallel=True,
  dir='packages/cli',
  cmd='pnpm type-check && pnpm build',
  labels=['cli'],
  resource_deps=['build-sdk']
)



