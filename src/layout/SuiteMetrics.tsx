type SuiteMetricsProps = {
  activeMetric: {
    label: string
    value: string
  }
  appsLabel: string
  appsValue: number
  csvQualityLabel: string
  csvQualityValue: number
  label: string
  sessionsLabel: string
  sessionsValue: number
}

export function SuiteMetrics({
  activeMetric,
  appsLabel,
  appsValue,
  csvQualityLabel,
  csvQualityValue,
  label,
  sessionsLabel,
  sessionsValue,
}: SuiteMetricsProps) {
  return (
    <section className="suite-strip" aria-label={label}>
      <article>
        <span>{appsLabel}</span>
        <strong>{appsValue}</strong>
      </article>
      <article>
        <span>{sessionsLabel}</span>
        <strong>{sessionsValue}</strong>
      </article>
      <article>
        <span>{csvQualityLabel}</span>
        <strong>{csvQualityValue}%</strong>
      </article>
      <article className="active-snapshot">
        <span>{activeMetric.label}</span>
        <strong>{activeMetric.value}</strong>
      </article>
    </section>
  )
}
