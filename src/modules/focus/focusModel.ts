export type PresetTaskKey = 'deliverable' | 'quiet' | 'note'
export type TimerMode = 'focus' | 'longBreak' | 'shortBreak'
export type TimerPresetKey = 'classic' | 'deep' | 'sprint'
export type FocusSessionStatus = 'completed' | 'skipped'

export type FocusTask = {
  id: string
  done: boolean
  label?: string
  labelKey?: PresetTaskKey
}

export type FocusSession = {
  id: string
  completedAt: string
  minutes: number
  mode: TimerMode
  status: FocusSessionStatus
}

export const timerDefaults = {
  focus: 25,
  longBreak: 15,
  shortBreak: 5,
}

export const timerPresets: Record<TimerPresetKey, { focus: number; longBreak: number; shortBreak: number }> = {
  classic: { focus: 25, longBreak: 15, shortBreak: 5 },
  deep: { focus: 45, longBreak: 20, shortBreak: 10 },
  sprint: { focus: 15, longBreak: 12, shortBreak: 3 },
}

export const timerModeOrder: TimerMode[] = ['focus', 'shortBreak', 'longBreak']

export const initialFocusTasks: FocusTask[] = [
  { done: false, id: 'f-1', labelKey: 'deliverable' },
  { done: false, id: 'f-2', labelKey: 'quiet' },
  { done: false, id: 'f-3', labelKey: 'note' },
]
