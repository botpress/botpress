/**
 * There are two different startups possible for the runtime:
 * - As a standalone (with the limited sdk)
 * - Started from Botpress (with the usuak sdk & module middlewares)
 *
 * The atandalone server spins its own express server and just needs
 */

require('./standalone')
