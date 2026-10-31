/**
 * Normalise a department string for comparison.
 * Rules: trim, lowercase, strip one trailing "dept" token.
 */
export function normaliseDepartment(raw: string): string {
  let dept = raw.trim().toLowerCase()
  // Strip trailing "dept" (with optional preceding space)
  dept = dept.replace(/\s+dept$/i, '')
  return dept
}

/**
 * Check if a department string resolves to Student Affairs.
 * Strict comparison — no substring matching.
 * Allowed: "Student Affairs", "student affairs", "Student Affairs Dept"
 * Not allowed: "StudentAffairs", "Student Affairs Office"
 */
export function isStudentAffairs(department: string | undefined | null): boolean {
  if (!department) return false
  return normaliseDepartment(department) === 'student affairs'
}
