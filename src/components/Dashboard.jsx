import { useState, useMemo, useCallback } from 'react'
import ControlPanel from './ControlPanel'
import ScatterPlot from './ScatterPlot'
import ScreePlot from './ScreePlot'
import { buildColorMap } from '../utils/colors'

function triggerDownload(csv, name) {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
}

function exportScores({ rows, pcColumns, metaColumns, varExplained, fileName }) {
  const pcHeaders = pcColumns.map(pc =>
    varExplained?.[pc] != null ? `${pc} (${varExplained[pc].toFixed(1)}%)` : pc
  )
  const header   = [...metaColumns, ...pcHeaders].join(',')
  const dataRows = rows.map(r => {
    const meta = metaColumns.map(c => { const v = String(r[c] ?? ''); return v.includes(',') ? `"${v}"` : v })
    const pcs  = pcColumns.map(c => (r[c] ?? 0).toFixed(6))
    return [...meta, ...pcs].join(',')
  })
  const stem = fileName.replace(/\.[^.]+$/, '')
  triggerDownload([header, ...dataRows].join('\n'), `${stem}_PCA_scores.csv`)
}

function exportScree({ pcColumns, varExplained, fileName }) {
  if (!varExplained) return
  let cum = 0
  const rows = pcColumns.map(pc => {
    const v = varExplained[pc] ?? 0; cum += v
    return `${pc},${v.toFixed(4)},${cum.toFixed(4)}`
  })
  const stem = fileName.replace(/\.[^.]+$/, '')
  triggerDownload(['PC,Variance_Pct,Cumulative_Pct', ...rows].join('\n'), `${stem}_scree.csv`)
}

const S = {
  app:    { backgroundColor: 'var(--bg-app)',    color: 'var(--text-1)' },
  header: { backgroundColor: 'var(--bg-header)', borderBottom: '1px solid var(--border)' },
  footer: { backgroundColor: 'var(--bg-footer)', borderTop: '1px solid var(--border)' },
  divider:{ background: 'var(--border)' },
  badge:  { backgroundColor: 'var(--bg-card)',   border: '1px solid var(--border)' },
}

export default function Dashboard({ data, fileName, onReset, isDark, onThemeToggle }) {
  const { rows, pcColumns, metaColumns, varExplained } = data

  const [mode,       setMode]       = useState('2D')
  const [view,       setView]       = useState('scatter')   // 'scatter' | 'scree'
  const [xAxis,      setXAxis]      = useState(pcColumns[0])
  const [yAxis,      setYAxis]      = useState(pcColumns[1])
  const [zAxis,      setZAxis]      = useState(pcColumns[2] ?? pcColumns[0])
  const [colorBy,    setColorBy]    = useState(metaColumns[0] ?? '')
  const [pointSize,  setPointSize]  = useState(20)
  const [opacity,    setOpacity]    = useState(0.85)
  const [showLabels, setShowLabels] = useState(false)

  const groupCount = useMemo(() => {
    if (!colorBy) return 1
    return new Set(rows.map(r => r[colorBy])).size
  }, [rows, colorBy])

  const colorMap = useMemo(() => {
    if (!colorBy) return {}
    return buildColorMap(rows.map(r => r[colorBy] ?? 'Unknown'))
  }, [rows, colorBy])

  const groups = useMemo(() => Object.keys(colorMap), [colorMap])

  const handleModeChange = useCallback(newMode => {
    setMode(newMode)
    setView('scatter')
  }, [])

  return (
    <div className="h-screen flex flex-col overflow-hidden animate-fade-in transition-colors duration-300" style={S.app}>

      {/* ── Header ── */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-5 z-10 backdrop-blur-sm"
              style={S.header}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600
                          flex items-center justify-center shadow-lg shadow-indigo-900/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <circle cx="7" cy="17" r="3"/>
              <circle cx="17" cy="7" r="3"/>
              <circle cx="14" cy="16" r="2" fillOpacity="0.7"/>
              <circle cx="8" cy="9" r="2" fillOpacity="0.7"/>
            </svg>
          </div>
          <span className="font-semibold tracking-tight" style={{ color: 'var(--text-1)' }}>PCA ExploreR</span>

          <div className="ml-2 h-5 w-px" style={S.divider} />

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={S.badge}>
            <CsvIcon color="var(--text-3)" />
            <span className="text-xs font-mono max-w-[240px] truncate" style={{ color: 'var(--text-2)' }}>
              {fileName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* View toggle — only visible when scree data is available (RDS upload) */}
          {varExplained && (
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg"
                 style={{ backgroundColor: 'var(--bg-moderow)', border: '1px solid var(--border)' }}>
              <ViewTab active={view === 'scatter'} onClick={() => setView('scatter')} label="Scatter" icon={<ScatterTabIcon />} />
              <ViewTab active={view === 'scree'}   onClick={() => setView('scree')}   label="Scree"   icon={<ScreeTabIcon />} />
            </div>
          )}

          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors duration-300 ${
            mode === '3D'
              ? 'bg-violet-100 text-violet-700 border border-violet-200'
              : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
          }`}
          style={isDark ? {
            backgroundColor: mode === '3D' ? 'rgba(109,40,217,0.2)' : 'rgba(67,56,202,0.2)',
            color: mode === '3D' ? '#c4b5fd' : '#a5b4fc',
            border: `1px solid ${mode === '3D' ? 'rgba(139,92,246,0.3)' : 'rgba(99,102,241,0.3)'}`,
          } : {}}>
            {mode} Scatter
          </span>

          <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />

          <button onClick={onReset} className="btn-ghost text-xs" title="Upload new file">
            <UploadIcon /> New File
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        <ControlPanel
          pcColumns={pcColumns} metaColumns={metaColumns}
          mode={mode} onModeChange={handleModeChange}
          xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} colorBy={colorBy}
          pointSize={pointSize} opacity={opacity} showLabels={showLabels}
          onXAxisChange={setXAxis} onYAxisChange={setYAxis} onZAxisChange={setZAxis}
          onColorByChange={setColorBy} onPointSizeChange={setPointSize}
          onOpacityChange={setOpacity} onShowLabelsChange={setShowLabels}
          sampleCount={rows.length} groupCount={groupCount} isDark={isDark}
          varExplained={varExplained}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                 style={{
                   backgroundImage: 'radial-gradient(circle, rgba(99,102,241,1) 1px, transparent 1px)',
                   backgroundSize: '40px 40px',
                 }} />
            <div className="absolute inset-0 p-4">
              {view === 'scree' && varExplained ? (
                <ScreePlot pcColumns={pcColumns} varExplained={varExplained} isDark={isDark} />
              ) : (
                <ScatterPlot
                  rows={rows} mode={mode} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis}
                  colorBy={colorBy} pointSize={pointSize} opacity={opacity}
                  showLabels={showLabels} metaColumns={metaColumns} isDark={isDark}
                  varExplained={varExplained}
                />
              )}

              {/* ── Export toolbar ── */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                <button
                  onClick={() => exportScores({ rows, pcColumns, metaColumns, varExplained, fileName })}
                  title="Download PCA scores joined with metadata"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 7, fontSize: '0.7rem', fontWeight: 600,
                    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-input)',
                    color: 'var(--text-2)', cursor: 'pointer', backdropFilter: 'blur(8px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}>
                  <DownloadIcon /> Scores + Metadata
                </button>
                {varExplained && (
                  <button
                    onClick={() => exportScree({ pcColumns, varExplained, fileName })}
                    title="Download scree (variance explained per PC)"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 7, fontSize: '0.7rem', fontWeight: 600,
                      backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-input)',
                      color: 'var(--text-2)', cursor: 'pointer', backdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}>
                    <DownloadIcon /> Scree
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <footer className="flex-shrink-0 px-5 py-2.5 backdrop-blur-sm" style={S.footer}>
            <div className="flex items-center gap-4 overflow-x-auto">
              {view === 'scree' && varExplained ? (
                <ScreeFooter pcColumns={pcColumns} varExplained={varExplained} />
              ) : (
                groups.length > 0 && colorBy && (
                  <>
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                      {colorBy}:
                    </span>
                    <div className="flex items-center gap-3 flex-wrap">
                      {groups.map(g => (
                        <LegendItem key={g} label={g} color={colorMap[g]}
                          count={rows.filter(r => (r[colorBy] ?? 'Unknown') === g).length} />
                      ))}
                    </div>
                    <div className="ml-auto flex-shrink-0 flex items-center gap-3">
                      <span className="stat-chip">
                        <span style={{ color: '#818cf8' }}>n</span>{rows.length} samples
                      </span>
                      <span className="stat-chip">
                        <span style={{ color: '#a78bfa' }}>⊕</span>
                        {mode === '3D' ? `${xAxis} · ${yAxis} · ${zAxis}` : `${xAxis} · ${yAxis}`}
                      </span>
                    </div>
                  </>
                )
              )}
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function ViewTab({ active, onClick, label, icon }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                 transition-all duration-200 cursor-pointer"
      style={active
        ? { backgroundImage: 'linear-gradient(to right,#4f46e5,#7c3aed)', color: '#fff',
            boxShadow: '0 1px 8px rgba(79,70,229,0.3)' }
        : { color: 'var(--text-3)' }}>
      {icon}{label}
    </button>
  )
}

function ScreeFooter({ pcColumns, varExplained }) {
  const vars = pcColumns.map(pc => varExplained[pc] ?? 0)
  const cumulative = vars.reduce((a, b) => a + b, 0)
  const top3 = [...pcColumns]
    .sort((a, b) => (varExplained[b] ?? 0) - (varExplained[a] ?? 0))
    .slice(0, 3)
  return (
    <div className="flex items-center gap-3 w-full">
      {top3.map(pc => (
        <span key={pc} className="stat-chip">
          <span style={{ color: '#818cf8' }}>{pc}</span>
          {(varExplained[pc] ?? 0).toFixed(1)}%
        </span>
      ))}
      <div className="ml-auto flex items-center gap-3">
        <span className="stat-chip">
          <span style={{ color: '#f472b6' }}>Σ</span>
          {cumulative.toFixed(1)}% total variance
        </span>
        <span className="stat-chip">
          <span style={{ color: '#a78bfa' }}>⊕</span>
          {pcColumns.length} PCs
        </span>
      </div>
    </div>
  )
}

function ScatterTabIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/>
      <circle cx="15" cy="16" r="2"/><circle cx="8" cy="9" r="2"/>
    </svg>
  )
}

function ScreeTabIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="12" width="4" height="9" rx="1"/>
      <rect x="10" y="6" width="4" height="15" rx="1"/>
      <rect x="17" y="15" width="4" height="6" rx="1"/>
      <polyline points="3,8 10,3 17,10 21,7"/>
    </svg>
  )
}

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                 cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-input)',
        color: 'var(--text-2)',
      }}
    >
      <span className={`relative inline-flex items-center w-8 h-4 rounded-full
                        transition-colors duration-300 flex-shrink-0 ${
        isDark ? 'bg-indigo-600' : 'bg-amber-400'
      }`}>
        <span className={`absolute w-3 h-3 rounded-full bg-white shadow
                          transition-transform duration-300 ${
          isDark ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`} />
        <span className={`absolute text-[8px] left-[3px] transition-opacity duration-200 ${isDark ? 'opacity-100' : 'opacity-0'}`}>🌙</span>
        <span className={`absolute text-[8px] right-[3px] transition-opacity duration-200 ${isDark ? 'opacity-0' : 'opacity-100'}`}>☀️</span>
      </span>
      <span className="hidden sm:inline">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}

function LegendItem({ label, color, count }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
           style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }} />
      <span className="text-xs max-w-[140px] truncate" style={{ color: 'var(--text-2)' }} title={label}>{label}</span>
      <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>({count})</span>
    </div>
  )
}

function CsvIcon({ color }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
