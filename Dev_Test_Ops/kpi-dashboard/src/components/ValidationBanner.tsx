interface ValidationBannerProps {
  issues: string[]
}

export function ValidationBanner({ issues }: ValidationBannerProps) {
  if (issues.length === 0) {
    return null
  }

  return (
    <aside className="validation-banner" role="alert">
      <strong>Data validation issues</strong>
      <ul>
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </aside>
  )
}

