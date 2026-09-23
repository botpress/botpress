import chalk from 'chalk'

export interface Task<T = any> {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'done'
  preview?: string // Optional preview for completed tasks
  statusText?: string // Generic status description
  value?: T
}

export interface TaskGroup<T> {
  task: Task<T>
  subtasks: Task<T>[]
}

// Animation frames for in-progress indicator
const progressFrames = ['◐', '◓', '◑', '◒']
let frameIndex = 0

export function displayTaskList(taskGroups: TaskGroup<any>[]): void {
  console.log() // Add some spacing

  taskGroups.forEach((group, groupIndex) => {
    // Display main task
    displaySingleTask(group.task, groupIndex + 1, 0)

    // Determine if this group should be expanded
    const shouldExpand = shouldExpandGroup(group)

    if (shouldExpand) {
      // Display subtasks with indentation
      group.subtasks.forEach((subtask, subtaskIndex) => {
        displaySingleTask(subtask, subtaskIndex + 1, 1, true)
      })
    } else {
      // Show collapsed indicator with appropriate color
      const collapsedCount = group.subtasks.length
      if (collapsedCount > 0) {
        const indent = '  '.repeat(1)
        const allCompleted = group.subtasks.every((subtask) => subtask.status === 'done')
        const collapsedColor = allCompleted ? chalk.green : chalk.gray
        const collapsedText = collapsedColor(
          `${indent}└─ ${collapsedCount} subtask${collapsedCount > 1 ? 's' : ''} (collapsed)`
        )
        console.log(collapsedText)
      }
    }

    // Add spacing between task groups
    if (groupIndex < taskGroups.length - 1) {
      console.log()
    }
  })

  // Display progress bar at the bottom
  displayProgressBar(taskGroups)

  console.log() // Add spacing after the list
}

// Display progress bar showing overall completion
function displayProgressBar(taskGroups: TaskGroup<any>[]): void {
  // Calculate total tasks and completed tasks
  let totalTasks = 0
  let completedTasks = 0

  taskGroups.forEach((group) => {
    // Count main task
    totalTasks++
    if (group.task.status === 'done') completedTasks++

    // Count subtasks
    group.subtasks.forEach((subtask) => {
      totalTasks++
      if (subtask.status === 'done') completedTasks++
    })
  })

  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const progressWidth = 30
  const filledWidth = Math.round((percentage / 100) * progressWidth)
  const emptyWidth = progressWidth - filledWidth

  const filledBar = chalk.green('█'.repeat(filledWidth))
  const emptyBar = chalk.gray('░'.repeat(emptyWidth))
  const progressBar = `[${filledBar}${emptyBar}]`

  const statusText = `${completedTasks}/${totalTasks} tasks completed (${percentage}%)`

  console.log()
  console.log(`${progressBar} ${statusText}`)
}

// Determine if a task group should be expanded
function shouldExpandGroup(group: TaskGroup<any>): boolean {
  // Expand if main task is in-progress
  if (group.task.status === 'in-progress') {
    return true
  }

  // Expand if any subtask is in-progress
  if (group.subtasks.some((subtask) => subtask.status === 'in-progress')) {
    return true
  }

  // Collapse if all tasks are pending or all are done
  return false
}

function displaySingleTask(task: Task, number: number, indentLevel: number, isSubtask: boolean = false): void {
  // Create indentation
  const indent = '  '.repeat(indentLevel)
  const prefix = isSubtask ? '└─' : ''

  // Status indicator with color coding
  let statusIcon: string
  let statusColor: (text: string) => string

  switch (task.status) {
    case 'pending':
      statusIcon = '○'
      statusColor = chalk.gray
      break
    case 'in-progress':
      statusIcon = progressFrames[frameIndex % progressFrames.length]
      statusColor = chalk.yellow
      break
    case 'done':
      statusIcon = '●'
      statusColor = chalk.green
      break
  }

  // Task number formatting
  const taskNumber = chalk.dim(`${number}.`)

  // Title formatting
  const title = task.status === 'done' ? chalk.dim(task.title) : task.title

  // Status text formatting - keep all status on same line
  let statusInfo = ''
  if (task.statusText) {
    if (task.status === 'in-progress') {
      statusInfo = ` ${chalk.dim(`[ ${task.statusText} ]`)}`
    } else if (task.status === 'done') {
      statusInfo = chalk.dim(` ${task.statusText}`)
    }
  }

  // Main task line
  console.log(`${indent}${prefix} ${taskNumber} ${statusColor(statusIcon)} ${title}${statusInfo}`)
}

// Animated display function that updates in-progress indicators
export function displayTaskListAnimated(taskGroups: TaskGroup<any>[], updateInterval: number = 500): () => void {
  let intervalId: ReturnType<typeof setInterval> | null = null

  const updateDisplay = () => {
    // Clear the entire screen and move cursor to top
    process.stdout.write('\x1b[2J') // Clear entire screen
    process.stdout.write('\x1b[H') // Move cursor to home position (0,0)

    // Increment animation frame
    frameIndex = (frameIndex + 1) % progressFrames.length

    // Redraw the task list
    displayTaskList(taskGroups)

    const allDone = taskGroups.every((group) => group.task.status === 'done')
    if (allDone) {
      clearInterval(intervalId!)
    }
  }

  // Initial display - clear screen first
  process.stdout.write('\x1b[2J') // Clear entire screen
  process.stdout.write('\x1b[H') // Move cursor to home position
  displayTaskList(taskGroups)

  intervalId = setInterval(updateDisplay, updateInterval)

  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  }
}

export function updateTaskStatus<T>({
  status,
  taskGroups,
  taskId,
  preview,
  statusText,
  value,
}: {
  taskGroups: TaskGroup<T>[]
  taskId: string
  status: Task['status']
  preview?: string
  statusText?: string
  value?: T
}) {
  for (const group of taskGroups) {
    if (group.task.id === taskId) {
      group.task.status = status
      if (preview) group.task.preview = preview
      if (statusText) group.task.statusText = statusText
      if (value !== undefined) group.task.value = value
    }
    for (const subtask of group.subtasks) {
      if (subtask.id === taskId) {
        subtask.status = status
        if (preview) subtask.preview = preview
        if (statusText) subtask.statusText = statusText
        if (value !== undefined) subtask.value = value
      }
    }

    if (group.task.status !== 'done' && group.subtasks.every((sub) => sub.status === 'done')) {
      group.task.status = 'done' // Mark main task as done if all subtasks are done
    }

    if (group.task.status !== 'pending' && group.subtasks.some((sub) => sub.status === 'in-progress')) {
      group.task.status = 'in-progress' // Mark main task as in-progress if any subtask is in-progress
    }
  }
}
