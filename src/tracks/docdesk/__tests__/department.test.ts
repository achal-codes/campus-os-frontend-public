import { describe, expect, it } from 'vitest'
import { isStudentAffairs, normaliseDepartment } from '../utils/department'

describe('department normalisation and Student Affairs resolution', () => {
  it('normalises basic strings properly', () => {
    expect(normaliseDepartment('Student Affairs')).toBe('student affairs')
    expect(normaliseDepartment('  student affairs  ')).toBe('student affairs')
    expect(normaliseDepartment('Student Affairs Dept')).toBe('student affairs')
    expect(normaliseDepartment('Student Affairs DEPT')).toBe('student affairs')
  })

  it('correctly grants clearance to valid Student Affairs variations', () => {
    expect(isStudentAffairs('Student Affairs')).toBe(true)
    expect(isStudentAffairs('student affairs')).toBe(true)
    expect(isStudentAffairs('Student Affairs Dept')).toBe(true)
    expect(isStudentAffairs('  Student Affairs Dept  ')).toBe(true)
  })

  it('strictly rejects non-matching or substring department strings', () => {
    expect(isStudentAffairs('StudentAffairs')).toBe(false)
    expect(isStudentAffairs('Student Affairs Office')).toBe(false)
    expect(isStudentAffairs('Office of Student Affairs')).toBe(false)
    expect(isStudentAffairs('Affairs')).toBe(false)
    expect(isStudentAffairs('Computer Science')).toBe(false)
    expect(isStudentAffairs('')).toBe(false)
    expect(isStudentAffairs(null)).toBe(false)
    expect(isStudentAffairs(undefined)).toBe(false)
  })
})
