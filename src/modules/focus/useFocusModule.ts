import { useCallback, useEffect, useState } from 'react'
import { createId } from '../../utils/ids'
import { formatTimer } from '../../utils/formatters'
import {
  initialFocusTasks,
  timerDefaults,
  timerPresets,
  type FocusSession,
  type FocusSessionStatus,
  type FocusTask,
  type TimerMode,
  type TimerPresetKey,
} from './focusModel'

type FocusCopy = {
  emptyTask: string
  intentPlaceholder: string
  reportText: (sessions: number, tasks: number, distractions: number, score: number) => string
  taskLabels: Record<string, string>
}

type StoredFocusState = {
  bestStreak?: number
  completedSessions?: number
  currentStreak?: number
  distractions?: string[]
  focusIntent?: string
  focusMinutes?: number
  focusSecondsToday?: number
  focusTasks?: FocusTask[]
  history?: FocusSession[]
  longBreakMinutes?: number
  shortBreakMinutes?: number
  statsDate?: string
}

const focusStorageKey = 'five-projects-focus-v2'

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function readStoredFocusState(): StoredFocusState {
  try {
    const stored = window.localStorage.getItem(focusStorageKey)
    return stored ? (JSON.parse(stored) as StoredFocusState) : {}
  } catch {
    return {}
  }
}

function playFinishTone() {
  try {
    const audioWindow = window as Window &
      typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    const AudioContextConstructor = audioWindow.AudioContext ?? audioWindow.webkitAudioContext
    if (!AudioContextConstructor) return

    const context = new AudioContextConstructor()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(660, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(880, context.currentTime + 0.16)
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.26)
  } catch {
    // Browsers can block audio until the user interacts with the page.
  }
}

export function useFocusModule(tFocus: FocusCopy) {
  const todayKey = getTodayKey()
  const [storedState] = useState(readStoredFocusState)
  const storedStatsAreCurrent = storedState.statsDate === todayKey
  const [timerMode, setTimerMode] = useState<TimerMode>('focus')
  const [focusMinutes, setFocusMinutes] = useState(storedState.focusMinutes ?? timerDefaults.focus)
  const [shortBreakMinutes, setShortBreakMinutes] = useState(
    storedState.shortBreakMinutes ?? timerDefaults.shortBreak,
  )
  const [longBreakMinutes, setLongBreakMinutes] = useState(
    storedState.longBreakMinutes ?? timerDefaults.longBreak,
  )
  const [secondsLeft, setSecondsLeft] = useState((storedState.focusMinutes ?? timerDefaults.focus) * 60)
  const [targetEndAt, setTargetEndAt] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(storedState.completedSessions ?? 0)
  const [focusIntent, setFocusIntent] = useState(storedState.focusIntent ?? tFocus.intentPlaceholder)
  const [focusTasks, setFocusTasks] = useState<FocusTask[]>(storedState.focusTasks ?? initialFocusTasks)
  const [distractionDraft, setDistractionDraft] = useState('')
  const [distractions, setDistractions] = useState<string[]>(storedState.distractions ?? [])
  const [taskDraft, setTaskDraft] = useState('')
  const [taskError, setTaskError] = useState('')
  const [history, setHistory] = useState<FocusSession[]>(storedState.history ?? [])
  const [focusSecondsToday, setFocusSecondsToday] = useState(
    storedStatsAreCurrent ? storedState.focusSecondsToday ?? 0 : 0,
  )
  const [currentStreak, setCurrentStreak] = useState(
    storedStatsAreCurrent ? storedState.currentStreak ?? 0 : 0,
  )
  const [bestStreak, setBestStreak] = useState(storedState.bestStreak ?? 0)
  const [statsDate, setStatsDate] = useState(todayKey)
  const [alertFlash, setAlertFlash] = useState(false)
  const [lastAlert, setLastAlert] = useState<FocusSession | null>(null)

  const getDurationSeconds = useCallback(
    (mode: TimerMode) => {
      if (mode === 'focus') return focusMinutes * 60
      if (mode === 'shortBreak') return shortBreakMinutes * 60
      return longBreakMinutes * 60
    },
    [focusMinutes, longBreakMinutes, shortBreakMinutes],
  )

  const activeTimerDuration = getDurationSeconds(timerMode)
  const timerProgress = Math.max(
    0,
    Math.min(100, Math.round(((activeTimerDuration - secondsLeft) / activeTimerDuration) * 100)),
  )
  const completedTaskCount = focusTasks.filter((task) => task.done).length
  const taskProgress = focusTasks.length ? Math.round((completedTaskCount / focusTasks.length) * 100) : 0
  const focusScore = Math.max(0, Math.min(100, taskProgress + completedSessions * 6 - distractions.length * 8))
  const focusReport = tFocus.reportText(completedSessions, taskProgress, distractions.length, focusScore)

  const completeStage = useCallback(
    (status: FocusSessionStatus) => {
      const currentDuration = getDurationSeconds(timerMode)
      const session: FocusSession = {
        completedAt: new Date().toISOString(),
        id: createId('focus-session'),
        minutes: Math.round(currentDuration / 60),
        mode: timerMode,
        status,
      }
      const isCompletedFocus = timerMode === 'focus' && status === 'completed'
      const nextCompletedSessions = completedSessions + (isCompletedFocus ? 1 : 0)
      const nextMode: TimerMode =
        timerMode === 'focus'
          ? nextCompletedSessions > 0 && nextCompletedSessions % 4 === 0
            ? 'longBreak'
            : 'shortBreak'
          : 'focus'

      if (isCompletedFocus) {
        setCompletedSessions(nextCompletedSessions)
        setFocusSecondsToday((value) => value + currentDuration)
        setCurrentStreak((value) => {
          const next = value + 1
          setBestStreak((best) => Math.max(best, next))
          return next
        })
      } else if (timerMode === 'focus' && status === 'skipped') {
        setCurrentStreak(0)
      }

      setHistory((current) => [session, ...current].slice(0, 8))
      setLastAlert(session)
      setAlertFlash(status === 'completed')
      setTimerRunning(false)
      setTargetEndAt(null)
      setTimerMode(nextMode)
      setSecondsLeft(getDurationSeconds(nextMode))

      if (status === 'completed') {
        playFinishTone()
      }
    },
    [completedSessions, getDurationSeconds, timerMode],
  )

  useEffect(() => {
    if (!timerRunning || !targetEndAt) return

    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((targetEndAt - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining <= 0) {
        completeStage('completed')
      }
    }, 250)

    return () => window.clearInterval(id)
  }, [completeStage, targetEndAt, timerRunning])

  useEffect(() => {
    if (!alertFlash) return
    const id = window.setTimeout(() => setAlertFlash(false), 1200)
    return () => window.clearTimeout(id)
  }, [alertFlash])

  useEffect(() => {
    const payload: StoredFocusState = {
      bestStreak,
      completedSessions,
      currentStreak,
      distractions,
      focusIntent,
      focusMinutes,
      focusSecondsToday,
      focusTasks,
      history,
      longBreakMinutes,
      shortBreakMinutes,
      statsDate,
    }

    window.localStorage.setItem(focusStorageKey, JSON.stringify(payload))
  }, [
    bestStreak,
    completedSessions,
    currentStreak,
    distractions,
    focusIntent,
    focusMinutes,
    focusSecondsToday,
    focusTasks,
    history,
    longBreakMinutes,
    shortBreakMinutes,
    statsDate,
  ])

  function startTimer() {
    setTargetEndAt(Date.now() + secondsLeft * 1000)
    setTimerRunning(true)
  }

  function pauseTimer() {
    if (targetEndAt) {
      setSecondsLeft(Math.max(0, Math.ceil((targetEndAt - Date.now()) / 1000)))
    }
    setTargetEndAt(null)
    setTimerRunning(false)
  }

  function toggleTimer() {
    if (timerRunning) {
      pauseTimer()
    } else {
      startTimer()
    }
  }

  function resetTimer() {
    setTargetEndAt(null)
    setTimerRunning(false)
    setSecondsLeft(getDurationSeconds(timerMode))
  }

  function skipStage() {
    completeStage('skipped')
  }

  function changeTimerMode(mode: TimerMode) {
    setTimerMode(mode)
    setSecondsLeft(getDurationSeconds(mode))
    setTargetEndAt(null)
    setTimerRunning(false)
  }

  function setTimerPreset(preset: TimerPresetKey) {
    const next = timerPresets[preset]
    setFocusMinutes(next.focus)
    setShortBreakMinutes(next.shortBreak)
    setLongBreakMinutes(next.longBreak)
    setTargetEndAt(null)
    setTimerRunning(false)
    setSecondsLeft(next[timerMode] * 60)
  }

  function updateTimerMinutes(mode: TimerMode, value: string) {
    const minutes = Math.min(90, Math.max(1, Number(value) || 1))
    if (mode === 'focus') {
      setFocusMinutes(minutes)
    } else if (mode === 'shortBreak') {
      setShortBreakMinutes(minutes)
    } else {
      setLongBreakMinutes(minutes)
    }

    if (mode === timerMode) {
      setSecondsLeft(minutes * 60)
      setTargetEndAt(null)
      setTimerRunning(false)
    }
  }

  function clearFocusStats() {
    setCompletedSessions(0)
    setCurrentStreak(0)
    setBestStreak(0)
    setFocusSecondsToday(0)
    setHistory([])
    setStatsDate(getTodayKey())
  }

  function addFocusTask() {
    const label = taskDraft.trim()
    if (!label) {
      setTaskError(tFocus.emptyTask)
      return
    }

    setFocusTasks((current) => [{ done: false, id: createId('task'), label }, ...current])
    setTaskDraft('')
    setTaskError('')
  }

  function removeFocusTask(id: string) {
    setFocusTasks((current) => current.filter((task) => task.id !== id))
  }

  function addDistraction() {
    const label = distractionDraft.trim()
    if (!label) return
    setDistractions((current) => [label, ...current].slice(0, 6))
    setDistractionDraft('')
  }

  function getTaskLabel(task: FocusTask) {
    if (task.label) return task.label
    if (task.labelKey) return tFocus.taskLabels[task.labelKey]
    return ''
  }

  return {
    activeTimerDuration,
    addDistraction,
    addFocusTask,
    alertFlash,
    bestStreak,
    changeTimerMode,
    clearFocusStats,
    completedSessions,
    currentStreak,
    distractionDraft,
    distractions,
    focusIntent,
    focusMinutes,
    focusReport,
    focusScore,
    focusSecondsToday,
    focusTasks,
    getTaskLabel,
    history,
    lastAlert,
    longBreakMinutes,
    removeFocusTask,
    resetTimer,
    secondsLeftText: formatTimer(secondsLeft),
    setDistractionDraft,
    setFocusIntent,
    setFocusTasks,
    setTaskDraft,
    setTimerPreset,
    shortBreakMinutes,
    skipStage,
    taskDraft,
    taskError,
    taskProgress,
    timerMode,
    timerProgress,
    timerRunning,
    toggleTimer,
    updateTimerMinutes,
  }
}
