export function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`
}

export function formatEventType(type: string) {
  return type.replace(/Event$/, '').replace(/([a-z])([A-Z])/g, '$1 $2')
}
