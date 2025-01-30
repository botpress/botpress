# constants

ZENDESK_PORT = 3795
HIT_LOOPER_PORT = 3796

BOT_CACHE_PATH = './bots/hit-looper/.botpress/project.cache.json'

# resources

local_resource(
  name='run-zendesk',
  serve_cmd=" ".join([
    "pnpm -F @botpresshub/zendesk exec",
    "bp dev -y",
    "--port %s" % ZENDESK_PORT,
  ]),
  readiness_probe=probe(http_get=http_get_action(port=ZENDESK_PORT, path='/health'), period_secs=1, failure_threshold=10),
)

local_resource(
  name='build-hitl-plugin',
  cmd="pnpm turbo -F @botpresshub/hitl-plugin build && pnpm -F @bp-bots/hit-looper exec bp add -y --use-dev",
  deps=['./plugins/hitl/src'],
)

local_resource(
  name='run-hit-looper',
  serve_cmd="pnpm -F @bp-bots/hit-looper exec bp dev --port %s" % HIT_LOOPER_PORT,
  resource_deps=['build-hitl-plugin', 'run-zendesk'],
  readiness_probe=probe(http_get=http_get_action(port=HIT_LOOPER_PORT, path='/health'), period_secs=1, failure_threshold=10),
)

local_resource(
  name='reset-hit-looper',
  cmd="rm %s" % BOT_CACHE_PATH,
  auto_init=False,
)

bot_cache = read_json(BOT_CACHE_PATH, {})
if ('devId' in bot_cache):
  bot_id = bot_cache['devId']
  cmd = "bp chat %s" % bot_id
  print("\n".join([
    "",
    "#######################################################",
    "###       To chat with your bot, run command:       ###",
    "### >> %s ###" % cmd,
    "#######################################################",
    "",
  ]))