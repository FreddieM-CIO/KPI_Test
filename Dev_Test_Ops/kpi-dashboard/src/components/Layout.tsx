import { NavLink, Outlet } from 'react-router-dom'
import { appConfig, getEnvironmentLabel } from '../config/appConfig'

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">IT Performance</p>
          <div className="title-row">
            <h1>{appConfig.title}</h1>
            <span className={`environment-pill environment-${appConfig.environment}`}>
              {getEnvironmentLabel(appConfig.environment)}
            </span>
          </div>
          <p className="subtitle">Workbook-backed scorecards, trends, and drilldowns for operational KPI tracking.</p>
          <div className="runtime-meta">
            <span>Release channel: {appConfig.releaseChannel}</span>
            <span>Refresh cadence: {appConfig.refreshIntervalMinutes} min</span>
            <span>Source: {appConfig.dataSource}</span>
          </div>
        </div>
        <nav className="header-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
