import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { KpiCard } from './KpiCard'

const record = {
  id: 'kpi-test',
  category: 'Support Performance',
  kpi: 'Support tickets responded to within SLA',
  targetDisplay: '>= 95%',
  targetValue: 95,
  condition: '>=' as const,
  actual: 99,
  scorePct: 104,
  workbookStatus: 'Met' as const,
  status: 'On Track' as const,
  notes: '',
  team: 'Service Desk',
  owner: 'Morgan Lee',
  frequency: 'Weekly' as const,
  lastUpdated: '2026-03-23',
}

describe('KpiCard', () => {
  it('renders KPI and links to drilldown route', () => {
    render(
      <BrowserRouter>
        <KpiCard record={record} />
      </BrowserRouter>,
    )
    expect(screen.getByText('Support tickets responded to within SLA')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View details' })).toHaveAttribute('href', '/kpi/kpi-test')
  })
})

