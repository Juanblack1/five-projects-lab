type ProjectBriefProps = {
  currentLabel: string
  nextLabel: string
  nextSteps: string[]
  skills: string[]
  summary: string
  title: string
}

export function ProjectBrief({ currentLabel, nextLabel, nextSteps, skills, summary, title }: ProjectBriefProps) {
  return (
    <aside className="project-brief">
      <p className="eyebrow">{currentLabel}</p>
      <h2>{title}</h2>
      <p>{summary}</p>
      <div className="brief-steps">
        <span>{nextLabel}</span>
        <ol>
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      <div className="chips">
        {skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </aside>
  )
}
