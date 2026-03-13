import { useCallback, useEffect, useRef, useState } from 'react'
import { parsePCACSV } from '../utils/parseCSV'
import { parsePrcompRDS } from '../utils/parseRDS'
import { getWebR } from '../utils/webr'

const ACCEPTED = '.csv,.rds,.RDS,.Rds,text/csv'

export default function Uploader({ onDataLoaded, isDark, onThemeToggle }) {
  const [dragging,   setDragging]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [statusMsg,  setStatusMsg]  = useState('')
  const [error,      setError]      = useState('')
  const [webRStatus, setWebRStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const inputRef = useRef(null)

  // Pre-warm WebR in the background so it's ready when the user picks an RDS
  useEffect(() => {
    getWebR()
      .then(() => setWebRStatus('ready'))
      .catch(() => setWebRStatus('error'))
  }, [])

  const handleFile = useCallback(async file => {
    if (!file) return
    const ext = file.name.toLowerCase().split('.').pop()
    if (ext !== 'csv' && ext !== 'rds') {
      setError('Please upload a .csv or .rds file.')
      return
    }
    setError('')
    setLoading(true)
    setStatusMsg(ext === 'rds' ? 'Initializing R…' : 'Parsing CSV…')
    try {
      let result
      if (ext === 'rds') {
        result = await parsePrcompRDS(file, msg => setStatusMsg(msg))
      } else {
        result = await parsePCACSV(file)
      }
      onDataLoaded(result, file.name)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setStatusMsg('')
    }
  }, [onDataLoaded])

  const onDrop        = useCallback(e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }, [handleFile])
  const onDragOver    = useCallback(e => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave   = useCallback(() => setDragging(false), [])
  const onInputChange = useCallback(e => handleFile(e.target.files[0]), [handleFile])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden
                    transition-colors duration-300"
         style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-1)' }}>

      {/* Theme toggle */}
      <div className="absolute top-4 right-5">
        <ThemeToggle isDark={isDark} onToggle={onThemeToggle} />
      </div>

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl"
             style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.12)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl"
             style={{ backgroundColor: isDark ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.12)' }} />
        <div className="absolute inset-0 opacity-[0.04]"
             style={{
               backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,1) 1px,transparent 1px)',
               backgroundSize: '60px 60px',
             }} />
      </div>

      <div className="relative w-full max-w-2xl animate-slide-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600
                              flex items-center justify-center shadow-lg shadow-indigo-900/30">
                <ScatterIcon />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 animate-pulse"
                   style={{ borderColor: 'var(--bg-app)' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight gradient-text">PCA ExploreR</h1>
              <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-3)' }}>
                Principal Component Analysis Visualizer
              </p>
            </div>
          </div>
          <p className="text-center text-sm max-w-md leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Upload a PCA eigenvalues CSV <span style={{ color: 'var(--text-3)' }}>or</span>{' '}
            a <code className="text-xs px-1 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--bg-card)', color: '#a78bfa' }}>prcomp</code>{' '}
            RDS to explore interactive{' '}
            <span style={{ color: '#6366f1' }}>2D</span> &amp;{' '}
            <span style={{ color: '#8b5cf6' }}>3D</span>{' '}
            scatter plots with scree analysis.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-4
                     rounded-2xl border-2 border-dashed p-14 cursor-pointer transition-all duration-300"
          style={{
            borderColor: dragging ? '#6366f1' : 'var(--border-input)',
            backgroundColor: dragging ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
            transform: dragging ? 'scale(1.01)' : 'scale(1)',
          }}
        >
          <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={onInputChange} />

          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              <p className="text-sm font-mono" style={{ color: 'var(--text-2)' }}>{statusMsg}</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                   style={{
                     backgroundColor: dragging ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
                     color: dragging ? '#6366f1' : 'var(--text-3)',
                   }}>
                <UploadIcon />
              </div>
              <div className="text-center">
                <p className="font-medium" style={{ color: 'var(--text-1)' }}>
                  {dragging ? 'Drop it!' : 'Drag & drop your file here'}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                  or{' '}
                  <span className="underline underline-offset-2 cursor-pointer" style={{ color: '#6366f1' }}>
                    browse to upload
                  </span>
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <FileTypeBadge label=".csv"  color="#6366f1" />
                  <FileTypeBadge label=".rds  prcomp" color="#a78bfa" />
                </div>
              </div>
            </>
          )}

          <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-indigo-400/50" />
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-violet-400/50" />
          <span className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-pink-400/50" />
          <span className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-emerald-400/50" />
        </div>

        {/* WebR status indicator */}
        <div className="flex justify-end mt-2">
          <WebRBadge status={webRStatus} />
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-3 px-4 py-3 rounded-xl text-sm animate-fade-in"
               style={{
                 backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : 'rgba(254,226,226,0.8)',
                 border: `1px solid ${isDark ? 'rgba(244,63,94,0.3)' : 'rgba(248,113,113,0.5)'}`,
                 color: isDark ? '#fda4af' : '#dc2626',
               }}>
            <ErrorIcon />
            <span>{error}</span>
          </div>
        )}

        {/* Format reference cards */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {/* CSV card */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
              <p className="label-sm">CSV Format</p>
            </div>
            <div className="font-mono text-xs overflow-x-auto whitespace-nowrap space-y-1">
              <div>
                <span style={{ color: 'var(--text-3)' }}>"",</span>
                <span style={{ color: '#6366f1' }}>"PC1","PC2",...,</span>
                <span style={{ color: '#10b981' }}>"label","group"</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-3)' }}>"1",</span>
                <span style={{ color: isDark ? '#a5b4fc' : '#4f46e5' }}>-1.06,-28.3,...,</span>
                <span style={{ color: isDark ? '#6ee7b7' : '#059669' }}>"A","GroupX"</span>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="stat-chip"><span className="w-2 h-2 rounded-full bg-indigo-500" />PC cols → axes</span>
              <span className="stat-chip"><span className="w-2 h-2 rounded-full bg-emerald-500" />other → color</span>
            </div>
          </div>

          {/* RDS card */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
              <p className="label-sm">RDS Format</p>
            </div>
            <div className="font-mono text-xs space-y-1" style={{ color: 'var(--text-2)' }}>
              <div>
                <span style={{ color: '#a78bfa' }}>pca</span>
                <span style={{ color: 'var(--text-3)' }}> &lt;- </span>
                <span>prcomp(data, ...)</span>
              </div>
              <div>
                saveRDS(<span style={{ color: '#a78bfa' }}>pca</span>,{' '}
                <span style={{ color: '#34d399' }}>"pca.rds"</span>)
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="stat-chip"><span className="w-2 h-2 rounded-full bg-violet-500" />scree plot</span>
              <span className="stat-chip"><span className="w-2 h-2 rounded-full bg-pink-400" />% var on axes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function WebRBadge({ status }) {
  const cfg = {
    loading: { dot: 'bg-amber-400 animate-pulse', text: 'R engine loading…', color: 'var(--text-3)' },
    ready:   { dot: 'bg-emerald-400',              text: 'R engine ready',    color: '#34d399' },
    error:   { dot: 'bg-red-400',                  text: 'R unavailable',     color: '#f87171' },
  }[status]

  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: cfg.color }}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.text}
    </div>
  )
}

function FileTypeBadge({ label, color }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', color }}>
      {label}
    </span>
  )
}

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
                 cursor-pointer transition-all duration-200"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-input)', color: 'var(--text-2)' }}>
      <span className={`relative inline-flex items-center w-8 h-4 rounded-full transition-colors duration-300 flex-shrink-0 ${
        isDark ? 'bg-indigo-600' : 'bg-amber-400'
      }`}>
        <span className={`absolute w-3 h-3 rounded-full bg-white shadow transition-transform duration-300 ${
          isDark ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
        <span className={`absolute text-[8px] left-[3px] transition-opacity duration-200 ${isDark ? 'opacity-100' : 'opacity-0'}`}>🌙</span>
        <span className={`absolute text-[8px] right-[3px] transition-opacity duration-200 ${isDark ? 'opacity-0' : 'opacity-100'}`}>☀️</span>
      </span>
      {isDark ? 'Dark' : 'Light'}
    </button>
  )
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

function ScatterIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="7"  cy="17" r="2"   fill="white"/>
      <circle cx="17" cy="7"  r="2"   fill="white"/>
      <circle cx="14" cy="16" r="1.5" fill="rgba(255,255,255,0.7)"/>
      <circle cx="8"  cy="9"  r="1.5" fill="rgba(255,255,255,0.7)"/>
      <circle cx="19" cy="15" r="1"   fill="rgba(255,255,255,0.5)"/>
      <circle cx="5"  cy="14" r="1"   fill="rgba(255,255,255,0.5)"/>
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
