import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import {
  timerModeOrder,
  type FocusSession,
  type FocusTask,
  type TimerMode,
  type TimerPresetKey,
} from './focusModel'

type CommonCopy = {
  add: string
  remove: string
}

type FocusCopy = {
  alertComplete: string
  bestStreak: string
  clearSessions: string
  completedStatus: string
  distractionInput: string
  distractionLog: string
  distractionPlaceholder: string
  done: string
  duration: string
  focusMinutes: string
  focusToday: string
  history: string
  intent: string
  intentPlaceholder: string
  longBreakMinutes: string
  minutes: string
  modeLabels: Record<TimerMode, string>
  noDistractions: string
  noHistory: string
  pause: string
  presets: Record<TimerPresetKey, string>
  progressLabel: string
  quotes: string[]
  report: string
  resetTimer: string
  sessions: string
  shortBreakMinutes: string
  skippedStatus: string
  skip: string
  start: string
  statePaused: string
  stateRunning: string
  streak: string
  taskInput: string
  tasks: string
  timerFocus: string
  timerLongBreak: string
  timerShortBreak: string
}

type FocusModuleProps = {
  activeTimerDuration: number
  addDistraction: () => void
  addFocusTask: () => void
  alertFlash: boolean
  bestStreak: number
  changeTimerMode: (mode: TimerMode) => void
  clearFocusStats: () => void
  completedSessions: number
  currentStreak: number
  distractionDraft: string
  distractions: string[]
  focusIntent: string
  focusMinutes: number
  focusReport: string
  focusScore: number
  focusSecondsToday: number
  focusTasks: FocusTask[]
  getTaskLabel: (task: FocusTask) => string
  history: FocusSession[]
  lastAlert: FocusSession | null
  longBreakMinutes: number
  removeFocusTask: (id: string) => void
  resetTimer: () => void
  secondsLeftText: string
  setDistractionDraft: (value: string) => void
  setFocusIntent: (value: string) => void
  setFocusTasks: Dispatch<SetStateAction<FocusTask[]>>
  setTaskDraft: (value: string) => void
  setTimerPreset: (preset: TimerPresetKey) => void
  shortBreakMinutes: number
  skipStage: () => void
  taskDraft: string
  taskError: string
  taskProgress: number
  tCommon: CommonCopy
  tFocus: FocusCopy
  timerMode: TimerMode
  timerProgress: number
  timerRunning: boolean
  title: string
  toggleTimer: () => void
  updateTimerMinutes: (mode: TimerMode, value: string) => void
}

const timerPresetOrder: TimerPresetKey[] = ['classic', 'sprint', 'deep']

function formatFocusTime(seconds: number) {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export function FocusModule({
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
  secondsLeftText,
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
  tCommon,
  tFocus,
  timerMode,
  timerProgress,
  timerRunning,
  title,
  toggleTimer,
  updateTimerMinutes,
}: FocusModuleProps) {
  const modeTitle = tFocus.modeLabels[timerMode]
  const timerLabel =
    timerMode === 'focus'
      ? tFocus.timerFocus
      : timerMode === 'shortBreak'
        ? tFocus.timerShortBreak
        : tFocus.timerLongBreak
  const focusQuote = tFocus.quotes[completedSessions % tFocus.quotes.length]
  const visualMessage = timerMode === 'focus' ? focusQuote : timerLabel
  const durationByMode: Record<TimerMode, number> = {
    focus: focusMinutes,
    longBreak: longBreakMinutes,
    shortBreak: shortBreakMinutes,
  }
  const modeDurationLabels: Record<TimerMode, string> = {
    focus: tFocus.focusMinutes,
    longBreak: tFocus.longBreakMinutes,
    shortBreak: tFocus.shortBreakMinutes,
  }
  const alertMessage =
    alertFlash && lastAlert ? `${tFocus.alertComplete} ${tFocus.modeLabels[lastAlert.mode]}` : ''

  return (
    <section
      className={`panel focus-panel focus-mode-${timerMode}${alertFlash ? ' focus-alert' : ''}`}
      aria-label={title}
    >
      <div className="focus-cockpit">
        <section className="timer-card focus-timer-card" aria-label={timerLabel}>
          <div className="focus-state-row">
            <span>{timerRunning ? tFocus.stateRunning : tFocus.statePaused}</span>
            <b>{modeTitle}</b>
          </div>

          <div
            aria-label={tFocus.progressLabel}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={timerProgress}
            aria-valuetext={`${secondsLeftText} / ${activeTimerDuration} ${tFocus.minutes}`}
            className="focus-dial"
            role="progressbar"
            style={{ '--progress': `${timerProgress}%` } as CSSProperties}
          >
            <div>
              <span>{timerLabel}</span>
              <strong>{secondsLeftText}</strong>
              <p>{visualMessage}</p>
            </div>
          </div>

          <div className="button-row focus-controls">
            <button className="primary-action" onClick={toggleTimer} type="button">
              {timerRunning ? tFocus.pause : tFocus.start}
            </button>
            <button onClick={resetTimer} type="button">
              {tFocus.resetTimer}
            </button>
            <button onClick={skipStage} type="button">
              {tFocus.skip}
            </button>
          </div>

          <div className="focus-mode-tabs" role="group" aria-label={tFocus.duration}>
            {timerModeOrder.map((mode) => (
              <button
                aria-pressed={timerMode === mode}
                className={timerMode === mode ? 'selected' : ''}
                key={mode}
                onClick={() => changeTimerMode(mode)}
                type="button"
              >
                <span>{tFocus.modeLabels[mode]}</span>
                <b>
                  {durationByMode[mode]} {tFocus.minutes}
                </b>
              </button>
            ))}
          </div>

          <p className="focus-live" role="status" aria-live="polite">
            {alertMessage}
          </p>
        </section>

        <section className="focus-config-card" aria-label={tFocus.duration}>
          <div className="card-title-row">
            <span>{tFocus.duration}</span>
            <button onClick={clearFocusStats} type="button">
              {tFocus.clearSessions}
            </button>
          </div>

          <div className="focus-duration-grid">
            {timerModeOrder.map((mode) => (
              <label key={mode}>
                <span>{modeDurationLabels[mode]}</span>
                <input
                  min="1"
                  max="90"
                  onChange={(event) => updateTimerMinutes(mode, event.target.value)}
                  type="number"
                  value={durationByMode[mode]}
                />
              </label>
            ))}
          </div>

          <div className="preset-row" role="group" aria-label={tFocus.duration}>
            {timerPresetOrder.map((preset) => (
              <button key={preset} onClick={() => setTimerPreset(preset)} type="button">
                {tFocus.presets[preset]}
              </button>
            ))}
          </div>
        </section>
      </div>

      <aside className="focus-side-panel">
        <section className="focus-stats-grid" aria-label={tFocus.report}>
          <article>
            <span>{tFocus.focusToday}</span>
            <strong>{formatFocusTime(focusSecondsToday)}</strong>
          </article>
          <article>
            <span>{tFocus.sessions}</span>
            <strong>{completedSessions}</strong>
          </article>
          <article>
            <span>{tFocus.bestStreak}</span>
            <strong>{bestStreak}</strong>
          </article>
          <article>
            <span>{tFocus.streak}</span>
            <strong>{currentStreak}</strong>
          </article>
        </section>

        <label className="field-card focus-intent-card">
          <span>{tFocus.intent}</span>
          <input
            onChange={(event) => setFocusIntent(event.target.value)}
            placeholder={tFocus.intentPlaceholder}
            value={focusIntent}
          />
        </label>

        <article className="module-card report-card">
          <span>{tFocus.report}</span>
          <strong>{focusScore}%</strong>
          <p>{focusReport}</p>
        </article>

        <article className="module-card history-card">
          <span>{tFocus.history}</span>
          {history.length === 0 ? (
            <p className="empty-line">{tFocus.noHistory}</p>
          ) : (
            <ol>
              {history.slice(0, 5).map((session) => (
                <li key={session.id}>
                  <b>{tFocus.modeLabels[session.mode]}</b>
                  <span>
                    {session.minutes} {tFocus.minutes} -{' '}
                    {session.status === 'completed' ? tFocus.completedStatus : tFocus.skippedStatus}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </article>

        <article className="module-card task-card">
          <div className="card-title-row">
            <span>{tFocus.tasks}</span>
            <b>
              {taskProgress}% {tFocus.done}
            </b>
          </div>
          <div className="task-input-row">
            <input
              aria-label={tFocus.taskInput}
              onChange={(event) => setTaskDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addFocusTask()
              }}
              placeholder={tFocus.taskInput}
              value={taskDraft}
            />
            <button onClick={addFocusTask} type="button">
              {tCommon.add}
            </button>
          </div>
          {taskError && (
            <p className="error-line" role="alert">
              {taskError}
            </p>
          )}
          <div className="task-list">
            {focusTasks.map((task) => (
              <label key={task.id}>
                <input
                  checked={task.done}
                  onChange={() =>
                    setFocusTasks((current) =>
                      current.map((item) =>
                        item.id === task.id ? { ...item, done: !item.done } : item,
                      ),
                    )
                  }
                  type="checkbox"
                />
                <span>{getTaskLabel(task)}</span>
                <button
                  aria-label={`${tCommon.remove}: ${getTaskLabel(task)}`}
                  onClick={() => removeFocusTask(task.id)}
                  type="button"
                >
                  {tCommon.remove}
                </button>
              </label>
            ))}
          </div>
        </article>

        <article className="module-card distraction-card">
          <span>{tFocus.distractionLog}</span>
          <div className="task-input-row">
            <input
              aria-label={tFocus.distractionInput}
              onChange={(event) => setDistractionDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addDistraction()
              }}
              placeholder={tFocus.distractionPlaceholder}
              value={distractionDraft}
            />
            <button onClick={addDistraction} type="button">
              {tCommon.add}
            </button>
          </div>
          {distractions.length === 0 ? (
            <p className="empty-line">{tFocus.noDistractions}</p>
          ) : (
            <ul className="distraction-list">
              {distractions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </article>
      </aside>
    </section>
  )
}
