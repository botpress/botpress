import { Component, RenderedComponent } from './component.js'
import { Context } from './context.js'
import { ValueOrGetter } from './getter.js'
import { ExecutionResult } from './result.js'
import { TranscriptArray, Transcript } from './transcript.js'

/**
 * Function type for handling messages sent from the agent to the user.
 *
 * The handler receives rendered components from the agent and is responsible for
 * presenting them to the user through the appropriate interface (CLI, web UI, mobile app, etc.).
 * This is how the agent communicates with the user.
 *
 * @param input - The rendered component to display to the user
 * @returns Promise that resolves when the message has been handled
 *
 * @example
 * ```typescript
 * const handler: MessageHandler = async (input) => {
 *   if (isComponent(input, DefaultComponents.Text)) {
 *     console.log('Agent:', input.children.join(''))
 *   } else if (isComponent(input, DefaultComponents.Button)) {
 *     console.log('Button:', input.props.label)
 *   }
 * }
 * ```
 */
export type MessageHandler = (input: RenderedComponent) => Promise<void> | void

/**
 * Base class for implementing chat interfaces in LLMz agents.
 *
 * The Chat class provides the foundation for interactive conversational agents by defining
 * how agents communicate with users. It manages the conversation transcript, available UI
 * components, and message handling. This is the bridge between the agent's generated code
 * and your user interface.
 *
 * ## Key Concepts
 *
 * **Handler Function**: The core method that receives agent messages (rendered components)
 * and displays them to the user. This is called every time the agent wants to communicate.
 *
 * **Transcript**: An up-to-date conversation history that is evaluated at each iteration.
 * The transcript must reflect the complete conversation state as the agent uses it to
 * understand context and generate appropriate responses.
 *
 * **Components**: The UI elements available to the agent for creating rich interactive
 * experiences (text, buttons, images, cards, etc.).
 *
 * ## Implementation Requirements
 *
 * To create a functional chat interface, you must:
 * 1. Implement the MessageHandler to display agent messages to users
 * 2. Maintain an accurate transcript of the conversation
 * 3. Provide the available UI components (typically includes DefaultComponents)
 * 4. Optional: Override onExecutionDone() to handle execution completion
 *
 * ## Basic Implementation
 *
 * ```typescript
 * import { Chat, DefaultComponents, isComponent } from 'llmz'
 *
 * class MyChat extends Chat {
 *   private messages: Array<{role: 'user' | 'assistant', content: string}> = []
 *
 *   constructor() {
 *     super({
 *       // Handle agent messages - this is called for every agent output
 *       handler: async (input) => {
 *         if (isComponent(input, DefaultComponents.Text)) {
 *           const text = input.children.join('')
 *           console.log('Agent:', text)
 *           this.messages.push({ role: 'assistant', content: text })
 *         } else if (isComponent(input, DefaultComponents.Button)) {
 *           console.log('Button:', input.props.label)
 *         }
 *       },
 *
 *       // Provide available components - agent can use these in generated code
 *       components: [DefaultComponents.Text, DefaultComponents.Button],
 *
 *       // Return current transcript - evaluated at each iteration
 *       transcript: () => this.messages,
 *     })
 *   }
 *
 *   // Add user message to transcript
 *   addUserMessage(content: string) {
 *     this.messages.push({ role: 'user', content })
 *   }
 * }
 *
 * // Usage
 * const chat = new MyChat()
 * chat.addUserMessage('Hello!')
 *
 * const result = await execute({
 *   instructions: 'You are a helpful assistant',
 *   chat, // Enable chat mode
 *   client,
 * })
 * ```
 *
 * ## Advanced Implementation (CLIChat Example)
 *
 * ```typescript
 * import { Chat, DefaultComponents, ListenExit } from 'llmz'
 *
 * class CLIChat extends Chat {
 *   public transcript: Array<{role: 'user' | 'assistant', content: string}> = []
 *   private buttons: string[] = []
 *   public result?: ExecutionResult
 *
 *   constructor() {
 *     super({
 *       // Dynamic component list with custom renderers
 *       components: () => [
 *         DefaultComponents.Text,
 *         DefaultComponents.Button,
 *         ...this.customComponents
 *       ],
 *
 *       // Dynamic transcript access
 *       transcript: () => this.transcript,
 *
 *       // Sophisticated message handling
 *       handler: async (input) => {
 *         if (isComponent(input, DefaultComponents.Text)) {
 *           const text = input.children.join('')
 *           console.log('🤖 Agent:', text)
 *           this.transcript.push({ role: 'assistant', content: text })
 *         } else if (isComponent(input, DefaultComponents.Button)) {
 *           this.buttons.push(input.props.label)
 *         }
 *       },
 *     })
 *   }
 *
 *   // Handle execution completion
 *   onExecutionDone(result: ExecutionResult) {
 *     this.result = result
 *   }
 *
 *   // Check if agent is waiting for user input
 *   isWaitingForInput(): boolean {
 *     return this.result?.is(ListenExit) ?? false
 *   }
 *
 *   // Conversation loop
 *   async iterate(): Promise<boolean> {
 *     if (this.isWaitingForInput()) {
 *       const userInput = await this.promptUser()
 *       this.transcript.push({ role: 'user', content: userInput })
 *       return true // Continue conversation
 *     }
 *     return false // End conversation
 *   }
 * }
 * ```
 *
 * ## Component System
 *
 * The agent generates JSX code using available components:
 *
 * ```typescript
 * // Agent generates this TSX code:
 * yield <Text>Welcome! Choose an option:</Text>
 * yield <Button action="postback" label="Get Help" value="help" />
 * yield <Button action="postback" label="Contact Sales" value="sales" />
 *
 * // Your handler receives these as RenderedComponent objects
 * ```
 *
 * ## Transcript Management
 *
 * The transcript is critical for agent context and must be kept up-to-date:
 *
 * ```typescript
 * // ❌ Bad - static transcript
 * transcript: [{ role: 'user', content: 'Hello' }]
 *
 * // ✅ Good - dynamic transcript that reflects current state
 * transcript: () => this.messages
 *
 * // The transcript is evaluated at each iteration, so the agent
 * // always sees the current conversation state
 * ```
 *
 * ## Custom Components
 *
 * Extend the UI with custom components for your specific use case:
 *
 * ```typescript
 * import { Component } from 'llmz'
 *
 * const ProductCard = new Component({
 *   type: 'leaf',
 *   name: 'ProductCard',
 *   leaf: {
 *     props: z.object({
 *       name: z.string(),
 *       price: z.number(),
 *       imageUrl: z.string(),
 *     })
 *   }
 * })
 *
 * class ShoppingChat extends Chat {
 *   constructor() {
 *     super({
 *       components: [
 *         ...DefaultComponents,
 *         ProductCard, // Add custom component
 *       ],
 *       handler: async (input) => {
 *         if (isComponent(input, ProductCard)) {
 *           // Handle custom component rendering
 *           this.renderProduct(input.props)
 *         }
 *         // ... handle other components
 *       },
 *     })
 *   }
 * }
 * ```
 *
 * @see {@link DefaultComponents} For standard UI components
 * @see {@link https://github.com/botpress/botpress/blob/master/packages/llmz/examples/utils/cli-chat.ts} Complete CLIChat implementation
 */
export class Chat {
  public readonly handler: MessageHandler
  public readonly transcript: ValueOrGetter<TranscriptArray, Context>
  public readonly components: ValueOrGetter<Component[], Context>

  /**
   * Creates a new Chat instance.
   *
   * @param props - Chat configuration
   * @param props.handler - Function to handle agent messages (called for every agent output)
   * @param props.components - Available UI components (static array or dynamic function)
   * @param props.transcript - Conversation history (static array or dynamic function, defaults to empty)
   *
   * @example
   * ```typescript
   * // Basic chat with static configuration
   * const chat = new Chat({
   *   handler: async (input) => {
   *     if (isComponent(input, DefaultComponents.Text)) {
   *       console.log('Agent:', input.children.join(''))
   *     }
   *   },
   *   components: [DefaultComponents.Text, DefaultComponents.Button],
   *   transcript: [
   *     { role: 'user', content: 'Hello', timestamp: Date.now() }
   *   ],
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Dynamic chat with functions for real-time updates
   * class MyChat extends Chat {
   *   private messages: Transcript.Message[] = []
   *
   *   constructor() {
   *     super({
   *       handler: (input) => this.handleMessage(input),
   *
   *       // Dynamic components - can change during execution
   *       components: () => [
   *         DefaultComponents.Text,
   *         DefaultComponents.Button,
   *         ...this.getCustomComponents()
   *       ],
   *
   *       // Dynamic transcript - always reflects current state
   *       transcript: () => this.messages,
   *     })
   *   }
   * }
   * ```
   */
  public constructor(props: {
    handler: MessageHandler
    components: ValueOrGetter<Component[], Context>
    transcript?: ValueOrGetter<Transcript.Message[], Context>
  }) {
    this.handler = props.handler
    this.components = props.components
    this.transcript = props.transcript || []
  }

  /**
   * Called when an execution cycle completes, regardless of the outcome.
   *
   * Override this method to handle execution results, manage conversation flow,
   * or perform cleanup tasks. This is called after each `execute()` call completes,
   * whether it succeeds, fails, or is interrupted.
   *
   * @param result - The execution result containing status, iterations, and exit information
   *
   * @example
   * ```typescript
   * class MyChat extends Chat {
   *   public result?: ExecutionResult
   *
   *   onExecutionDone(result: ExecutionResult) {
   *     // Store result for conversation flow control
   *     this.result = result
   *
   *     // Handle different result types
   *     if (result.isSuccess()) {
   *       console.log('✅ Execution completed successfully')
   *       console.log('Exit:', result.output.exit_name)
   *     } else if (result.isError()) {
   *       console.error('❌ Execution failed:', result.output.error)
   *     } else if (result.isInterrupted()) {
   *       console.log('⏸️ Execution interrupted (partial result)')
   *     }
   *   }
   *
   *   // Use stored result for conversation flow
   *   isWaitingForInput(): boolean {
   *     return this.result?.is(ListenExit) ?? false
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // CLIChat implementation example
   * class CLIChat extends Chat {
   *   public status?: IterationStatus
   *   public result?: ExecutionResult
   *
   *   onExecutionDone(result: ExecutionResult) {
   *     this.result = result
   *     this.status = result.iterations.at(-1)?.status
   *   }
   *
   *   // Check if agent exited with specific exit type
   *   hasExitedWith<R>(exit: Exit<R>): boolean {
   *     return this.status?.type === 'exit_success' &&
   *            this.status.exit_success.exit_name === exit.name
   *   }
   * }
   * ```
   */
  public onExecutionDone(_result: ExecutionResult): void {
    // This method can be overridden to handle execution completion
  }
}
