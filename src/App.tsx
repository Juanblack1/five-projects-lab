import type { CSSProperties } from 'react'
import './App.css'
import heroImage from './assets/hero.png'
import {
  currencyByLanguage,
  localeByLanguage,
  useLanguagePreference,
  type Language,
} from './hooks/useLanguagePreference'
import { useProjectRoute } from './hooks/useProjectRoute'
import { useThemePreference } from './hooks/useThemePreference'
import { copy } from './i18n/copy'
import { IntroPage } from './layout/IntroPage'
import { ProjectBrief } from './layout/ProjectBrief'
import { Sidebar } from './layout/Sidebar'
import { SuiteHeader } from './layout/SuiteHeader'
import { SuiteMetrics } from './layout/SuiteMetrics'
import { BudgetModule } from './modules/budget/BudgetModule'
import { useBudgetModule } from './modules/budget/useBudgetModule'
import { CsvModule } from './modules/csv/CsvModule'
import { useCsvModule } from './modules/csv/useCsvModule'
import { FocusModule } from './modules/focus/FocusModule'
import { useFocusModule } from './modules/focus/useFocusModule'
import { GithubModule } from './modules/github/GithubModule'
import { useGithubModule } from './modules/github/useGithubModule'
import { LogsModule } from './modules/logs/LogsModule'
import { useLogsModule } from './modules/logs/useLogsModule'
import { downloadText } from './services/fileDownload'
import type { CopyState } from './shared/types'
import { suiteProjects } from './suiteData'

function App() {
  const { language, setLanguage } = useLanguagePreference()
  const t = copy[language]
  const locale = localeByLanguage[language]
  const currency = currencyByLanguage[language]
  const { theme, setTheme } = useThemePreference()
  const { activeProject, changeProject, openIntro, openLab, suiteView } = useProjectRoute()
  const {
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
    timerMode,
    timerProgress,
    timerRunning,
    toggleTimer,
    updateTimerMinutes,
  } = useFocusModule(t.focus)
  const {
    budget,
    budgetError,
    budgetFieldErrors,
    budgetFilters,
    categoryEntries,
    categoryLimit,
    categoryOptions,
    clearBudgetFilters,
    deleteTransaction,
    editTransaction,
    editingTransactionId,
    filteredTransactions,
    goalProgress,
    limitOverage,
    monthOptions,
    monthlyTrend,
    remainingGoal,
    resetTransactionDraft,
    savingsGoal,
    savingsRate,
    saveTransaction,
    setBudgetFilters,
    setCategoryLimit,
    setSavingsGoal,
    setTransactionDraft,
    topExpense,
    transactionDraft,
    transactions,
  } = useBudgetModule(language, t.budget, locale)
  const {
    fetchGithubEvents,
    filteredGithubRepos,
    getGithubStatus,
    githubEventTypes,
    githubEvents,
    githubForks,
    githubLanguageOptions,
    githubLanguages,
    githubLoadedAt,
    githubProfile,
    githubRateLimit,
    githubRepoFilters,
    githubReport,
    githubRepos,
    githubStars,
    githubState,
    githubUser,
    latestRepo,
    maxGithubEventCount,
    setGithubRepoFilters,
    setGithubUser,
  } = useGithubModule(t.github, locale)
  const {
    applyCsvClean,
    applyCsvReplace,
    copyCleanCsv,
    csvActionMessage,
    csvCleanOptions,
    csvCleanPreviewLimited,
    csvCleanPreviewRows,
    csvCleanedFileName,
    csvCopyStatus,
    csvFileError,
    csvFileMeta,
    csvFilter,
    csvFind,
    csvInput,
    csvPreviewLimited,
    csvPreviewRows,
    csvQuality,
    csvReplace,
    csvReport,
    formatCsvBytes,
    handleCsvFile,
    loadSampleCsv,
    normalizeCsvHeaders,
    setCsvCleanOption,
    setCsvCopyStatus,
    setCsvFilter,
    setCsvFind,
    setCsvInput,
    setCsvReplace,
  } = useCsvModule(language, t.csv, locale)
  const {
    copyIncidentReport,
    copyLogSummary,
    detectedLogSignals,
    handleLogFile,
    incidentReport,
    logActionMessage,
    logCopyStatus,
    logEntries,
    logFileError,
    logFilters,
    logInput,
    logReport,
    loadSampleLogs,
    maxSeverityCount,
    maxSourceCount,
    riskLabel,
    selectedLog,
    selectedLogId,
    setLogCopyStatus,
    setLogFilter,
    setLogInput,
    setSelectedLogId,
    severityEntries,
    simulateLogs,
    sourceEntries,
    visibleLogs,
  } = useLogsModule(language, t.logs, locale)

  const selectedProject =
    suiteProjects.find((project) => project.key === activeProject) ?? suiteProjects[0]
  const selectedProjectCopy = t.projects[activeProject]
  const activeStyle = { '--accent': selectedProject.accent } as CSSProperties
  const projectMetric =
    activeProject === 'focus'
      ? `${focusScore}%`
      : activeProject === 'budget'
        ? `${goalProgress}%`
        : activeProject === 'github'
          ? String(githubRepos.length || githubEvents.length)
          : activeProject === 'csv'
            ? `${csvQuality}%`
            : riskLabel

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage)
    setCsvCopyStatus('idle')
    setLogCopyStatus('idle')
  }

  function getCopyMessage(state: CopyState) {
    if (state === 'success') return t.common.copied
    if (state === 'error') return t.common.copyBlocked
    if (state === 'empty') return t.common.copyEmpty
    return ''
  }

  if (suiteView === 'intro') {
    return (
      <main className={`site-shell view-intro project-${activeProject}`} style={activeStyle}>
        <IntroPage
          activeProject={activeProject}
          appLabel={t.shell.appLabel}
          heroImage={heroImage}
          intro={t.intro}
          language={language}
          languageLabel={t.shell.language}
          onLanguageChange={changeLanguage}
          onOpenLab={openLab}
          onThemeChange={setTheme}
          projectCopies={t.projects}
          theme={theme}
          themeLabel={t.shell.theme}
          themeLabels={t.shell.themeLabels}
        />
      </main>
    )
  }

  return (
    <main className={`site-shell view-lab project-${activeProject}`} style={activeStyle}>
      <section className="app-shell" id="laboratorio">
        <Sidebar
          activeProject={activeProject}
          appLabel={t.shell.appLabel}
          heroImage={heroImage}
          homeLabel={t.shell.home}
          navLabel={t.shell.navLabel}
          onHome={openIntro}
          onProjectChange={changeProject}
          projectCopies={t.projects}
          sidebarCopy={t.shell.sidebarCopy}
          title={t.shell.title}
        />

        <section className="stage">
        <SuiteHeader
          eyebrow={t.hero.summary}
          language={language}
          languageLabel={t.shell.language}
          onLanguageChange={changeLanguage}
          onThemeChange={setTheme}
          subtitle={t.shell.subtitle}
          theme={theme}
          themeLabel={t.shell.theme}
          themeLabels={t.shell.themeLabels}
          title={t.shell.title}
        />

        <SuiteMetrics
          activeMetric={{ label: selectedProjectCopy.metricLabel, value: projectMetric }}
          appsLabel={t.hero.metrics.apps}
          appsValue={suiteProjects.length}
          csvQualityLabel={t.hero.metrics.quality}
          csvQualityValue={csvQuality}
          label={t.hero.summary}
          sessionsLabel={t.hero.metrics.sessions}
          sessionsValue={completedSessions}
        />

        <section className="workbench">
          <ProjectBrief
            currentLabel={t.hero.current}
            nextLabel={t.hero.nextSteps}
            nextSteps={selectedProjectCopy.nextSteps}
            skills={selectedProjectCopy.skills}
            summary={selectedProjectCopy.summary}
            title={selectedProjectCopy.title}
          />

          {activeProject === 'focus' && (
            <FocusModule
              activeTimerDuration={activeTimerDuration}
              addDistraction={addDistraction}
              addFocusTask={addFocusTask}
              alertFlash={alertFlash}
              bestStreak={bestStreak}
              changeTimerMode={changeTimerMode}
              clearFocusStats={clearFocusStats}
              completedSessions={completedSessions}
              currentStreak={currentStreak}
              distractionDraft={distractionDraft}
              distractions={distractions}
              focusIntent={focusIntent}
              focusMinutes={focusMinutes}
              focusReport={focusReport}
              focusScore={focusScore}
              focusSecondsToday={focusSecondsToday}
              focusTasks={focusTasks}
              getTaskLabel={getTaskLabel}
              history={history}
              lastAlert={lastAlert}
              longBreakMinutes={longBreakMinutes}
              removeFocusTask={removeFocusTask}
              resetTimer={resetTimer}
              setDistractionDraft={setDistractionDraft}
              setFocusIntent={setFocusIntent}
              setFocusTasks={setFocusTasks}
              setTaskDraft={setTaskDraft}
              setTimerPreset={setTimerPreset}
              shortBreakMinutes={shortBreakMinutes}
              skipStage={skipStage}
              taskDraft={taskDraft}
              taskError={taskError}
              taskProgress={taskProgress}
              tCommon={t.common}
              tFocus={t.focus}
              timerMode={timerMode}
              timerProgress={timerProgress}
              timerRunning={timerRunning}
              title={selectedProjectCopy.title}
              toggleTimer={toggleTimer}
              updateTimerMinutes={updateTimerMinutes}
              secondsLeftText={secondsLeftText}
            />
          )}

          {activeProject === 'budget' && (
            <BudgetModule
              budget={budget}
              budgetError={budgetError}
              budgetFieldErrors={budgetFieldErrors}
              budgetFilters={budgetFilters}
              categoryEntries={categoryEntries}
              categoryLimit={categoryLimit}
              categoryOptions={categoryOptions}
              clearBudgetFilters={clearBudgetFilters}
              currency={currency}
              deleteTransaction={deleteTransaction}
              editTransaction={editTransaction}
              editingTransactionId={editingTransactionId}
              filteredTransactions={filteredTransactions}
              goalProgress={goalProgress}
              limitOverage={limitOverage}
              locale={locale}
              monthOptions={monthOptions}
              monthlyTrend={monthlyTrend}
              remainingGoal={remainingGoal}
              resetTransactionDraft={resetTransactionDraft}
              savingsGoal={savingsGoal}
              savingsRate={savingsRate}
              saveTransaction={saveTransaction}
              setBudgetFilters={setBudgetFilters}
              setCategoryLimit={setCategoryLimit}
              setSavingsGoal={setSavingsGoal}
              setTransactionDraft={setTransactionDraft}
              tBudget={t.budget}
              tCommon={t.common}
              title={selectedProjectCopy.title}
              topExpense={topExpense}
              transactionDraft={transactionDraft}
              transactions={transactions}
            />
          )}

          {activeProject === 'github' && (
            <GithubModule
              eventRepoCount={githubReport.repoCount}
              filteredGithubRepos={filteredGithubRepos}
              githubErrorState={githubState}
              githubEventTypes={githubEventTypes}
              githubEvents={githubEvents}
              githubForks={githubForks}
              githubLanguageOptions={githubLanguageOptions}
              githubLanguages={githubLanguages}
              githubLoadedAt={githubLoadedAt}
              githubProfile={githubProfile}
              githubRateLimit={githubRateLimit}
              githubRepoFilters={githubRepoFilters}
              githubRepos={githubRepos}
              githubStars={githubStars}
              githubStatus={getGithubStatus()}
              githubUser={githubUser}
              latestRepo={latestRepo}
              locale={locale}
              maxGithubEventCount={maxGithubEventCount}
              onFetchGithubEvents={fetchGithubEvents}
              setGithubRepoFilters={setGithubRepoFilters}
              setGithubUser={setGithubUser}
              tGithub={t.github}
              title={selectedProjectCopy.title}
            />
          )}

          {activeProject === 'csv' && (
            <CsvModule
              applyCsvClean={applyCsvClean}
              applyCsvReplace={applyCsvReplace}
              copyCleanCsv={copyCleanCsv}
              csvActionMessage={csvActionMessage}
              csvCleanOptions={csvCleanOptions}
              csvCleanPreviewLimited={csvCleanPreviewLimited}
              csvCleanPreviewRows={csvCleanPreviewRows}
              csvCopyStatus={csvCopyStatus}
              csvFileError={csvFileError}
              csvFileMeta={csvFileMeta}
              csvFilter={csvFilter}
              csvFind={csvFind}
              csvInput={csvInput}
              csvPreviewLimited={csvPreviewLimited}
              csvPreviewRows={csvPreviewRows}
              csvQuality={csvQuality}
              csvReplace={csvReplace}
              csvReport={csvReport}
              formatCsvBytes={formatCsvBytes}
              getCopyMessage={getCopyMessage}
              handleCsvFile={handleCsvFile}
              normalizeCsvHeaders={normalizeCsvHeaders}
              onDownloadClean={() => downloadText(csvCleanedFileName, csvReport.cleaned, 'text/csv')}
              onLoadSample={loadSampleCsv}
              setCsvCleanOption={setCsvCleanOption}
              setCsvFilter={setCsvFilter}
              setCsvFind={setCsvFind}
              setCsvInput={setCsvInput}
              setCsvReplace={setCsvReplace}
              tCommon={t.common}
              tCsv={t.csv}
              title={selectedProjectCopy.title}
            />
          )}

          {activeProject === 'logs' && (
            <LogsModule
              copyIncidentReport={copyIncidentReport}
              copyLogSummary={copyLogSummary}
              detectedLogSignals={detectedLogSignals}
              getCopyMessage={getCopyMessage}
              handleLogFile={handleLogFile}
              incidentReport={incidentReport}
              locale={locale}
              logActionMessage={logActionMessage}
              logCopyStatus={logCopyStatus}
              logEntries={logEntries}
              logFileError={logFileError}
              logFilters={logFilters}
              logInput={logInput}
              logReport={logReport}
              maxSeverityCount={maxSeverityCount}
              maxSourceCount={maxSourceCount}
              onDownloadIncident={() => downloadText('incident-summary.txt', incidentReport)}
              onLoadSample={loadSampleLogs}
              riskLabel={riskLabel}
              selectedLog={selectedLog}
              selectedLogId={selectedLogId}
              setLogFilter={setLogFilter}
              setLogInput={setLogInput}
              setSelectedLogId={setSelectedLogId}
              severityEntries={severityEntries}
              simulateLogs={simulateLogs}
              sourceEntries={sourceEntries}
              tCommon={t.common}
              tLogs={t.logs}
              title={selectedProjectCopy.title}
              visibleLogs={visibleLogs}
            />
          )}
        </section>
        </section>
      </section>
    </main>
  )
}

export default App
