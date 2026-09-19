# LLMz documentation

The earlier protocol design notes have been replaced by the implemented native-message contract.

- [Native protocol specification](native-protocol-spec.md) describes the current runtime, memory, and snapshot behavior.
- [Public API guide](../DOCS.md) shows integration examples.
- [Major-version migration guide](native-protocol-migration.md) explains the changes from the retired marker protocol.

Remaining rollout work is documented in the specification: provider compatibility checks, quantitative evaluation thresholds, and application migration validation.

Cancellation while host work is pending needs a separate snapshot design. Started operations are awaited, but a `SnapshotSignal` arriving after the VM has aborted can be lost. Preserving those late signals must account for concurrent pending jobs and assignment ownership; snapshots already yielded by the VM survive response-stream failure or cancellation.
