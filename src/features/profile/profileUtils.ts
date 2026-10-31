export function getRoleLabel(role?: string): string {
  switch (role) {
    case 'student':
      return 'Student'
    case 'office_staff':
      return 'Staff'
    case 'faculty':
      return 'Faculty'
    case 'admin':
      return 'Admin'
    default:
      return role ?? ''
  }
}

export function getInitials(name?: string): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

