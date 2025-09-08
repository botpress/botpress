local_resource(
  name='install',
  cmd="pnpm install"
)

local_resource(
  name='build',
  cmd="pnpm build",
  deps=['install'],
)

local_resource(
  name='check',
  cmd="pnpm check",
  deps=['install', 'build'],
)

local_resource(
  name='test',
  cmd="pnpm test",
  deps=['install', 'build'],
)
