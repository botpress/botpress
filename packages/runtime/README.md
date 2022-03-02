# Botpress Runtime

The botpress runtime is a lightweight version of botpress that runs on the cloud

## SDK

### Removed methods

- `bp.http.*`
- `bp.config.*`
- `bp.workspaces.*`
- `bp.distributed.*`
- `bp.experimental.*`
- `bp.realtime.*`
- `bp.bots.*` except `bp.bots.getBotById`
- `bp.kvs.*` except `bp.kvs.forBot`
- `bp.ghost.*` except `bp.ghost.forBot` (also only provides functions to read files, not write)
- `bp.cms.deleteContentElements`
- `bp.cms.createOrUpdateContentElement`
- `bp.cms.saveFile`
- `bp.cms.readFile`
- `bp.cms.getFilePath`
