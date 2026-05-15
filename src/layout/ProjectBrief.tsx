type ProjectBriefProps = {
  currentLabel: string
  skills: string[]
  summary: string
  title: string
}

export function ProjectBrief({ currentLabel, skills, summary, title }: ProjectBriefProps) {
  return (
    <aside className="project-brief">
      <p className="eyebrow">{currentLabel}</p>
      <h2>{title}</h2>
      <p>{summary}</p>
      <div className="chips">
        {skills.map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
    </aside>
  )
}
