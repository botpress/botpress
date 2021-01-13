/**
 * This hook executes rigth after nlu election, before all incoming middlewares.
 *
 * Use it to modify election logic and force any result you want.
 *
 * Here, let's force the none intent to be elected
 */
event.nlu.intent.name = 'none'
event.nlu.intent.confidence = 1
