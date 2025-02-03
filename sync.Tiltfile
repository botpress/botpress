# constants

LINEAR_PORT = 3793
SINLIN_PORT = 3794

# resources

local_resource(
  name='run-linear',
  serve_cmd=" ".join([
    "pnpm -F @botpresshub/linear exec",
    "bp dev -y",
    "--port %s" % LINEAR_PORT,
    "--secrets CLIENT_ID=CLIENT_ID",
    "--secrets CLIENT_SECRET=CLIENT_SECRET",
    "--secrets WEBHOOK_SIGNING_SECRET=WEBHOOK_SIGNING_SECRET",
  ]),
  readiness_probe=probe(http_get=http_get_action(port=LINEAR_PORT, path='/health'), period_secs=1, failure_threshold=10),
)

local_resource(
  name='build-synchronizer',
  cmd="pnpm turbo -F @botpresshub/synchronizer build && pnpm -F @bp-bots/sinlin exec bp add -y --use-dev",
  deps=['./plugins/synchronizer/src'],
)

local_resource(
  name='run-sinlin',
  serve_cmd="pnpm -F @bp-bots/sinlin exec bp dev --port %s" % SINLIN_PORT,
  resource_deps=['build-synchronizer', 'run-linear'],
  readiness_probe=probe(http_get=http_get_action(port=SINLIN_PORT, path='/health'), period_secs=1, failure_threshold=10),
)

botId = read_json('./bots/sinlin/.botpress/project.cache.json')['devId']
cmd = "bp chat %s" % botId
print("\n".join([
  "",
  "#######################################################",
  "###       To chat with your bot, run command:       ###",
  "### >> %s ###" % cmd,
  "#######################################################",
  "",
]))