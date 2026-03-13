export default function ControlPanel({
  pcColumns, metaColumns, mode, onModeChange,
  xAxis, yAxis, zAxis, colorBy,
  pointSize, opacity, showLabels,
  onXAxisChange, onYAxisChange, onZAxisChange, onColorByChange,
  onPointSizeChange, onOpacityChange, onShowLabelsChange,
  sampleCount, groupCount, isDark,
}) {
  return (
    <aside className="w-72 flex-shrink-0 h-full flex flex-col overflow-y-auto transition-colors duration-300"
           style={{ backgroundColor: 'var(--bg-panel)', borderRight: '1px solid var(--border)' }}>

      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="label-sm">Controls</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

        <Section title="Plot Mode">
          <div className="flex gap-1 p-1 rounded-xl"
               style={{ backgroundColor: 'var(--bg-moderow)', border: '1px solid var(--border)' }}>
            <ModeButton active={mode === '2D'} onClick={() => onModeChange('2D')} label="2D" icon={<Icon2D />} />
            <ModeButton active={mode === '3D'} onClick={() => onModeChange('3D')} label="3D" icon={<Icon3D />} />
          </div>
        </Section>

        <Section title="Axes">
          <div className="space-y-3">
            <AxisSelect label="X Axis" labelColor="#f43f5e" value={xAxis} options={pcColumns} onChange={onXAxisChange} />
            <AxisSelect label="Y Axis" labelColor="#10b981" value={yAxis} options={pcColumns} onChange={onYAxisChange} />
            {mode === '3D' && (
              <AxisSelect label="Z Axis" labelColor="#38bdf8" value={zAxis} options={pcColumns} onChange={onZAxisChange} />
            )}
          </div>
        </Section>

        <Section title="Color By">
          {metaColumns.length > 0 ? (
            <select className="select-styled" value={colorBy} onChange={e => onColorByChange(e.target.value)}>
              {metaColumns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          ) : (
            <p className="text-xs italic" style={{ color: 'var(--text-3)' }}>No metadata columns found</p>
          )}
        </Section>

        <Section title="Appearance">
          <div className="space-y-4">
            <SliderRow label="Point Size" value={pointSize} min={15} max={30} step={1}
              onChange={onPointSizeChange} displayValue={`${pointSize}px`} />
            <SliderRow label="Opacity" value={opacity} min={0.1} max={1} step={0.05}
              onChange={onOpacityChange} displayValue={`${Math.round(opacity * 100)}%`} />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>Show Labels</span>
              <Toggle checked={showLabels} onChange={onShowLabelsChange} />
            </div>
          </div>
        </Section>

        <Section title="Dataset">
          <div className="space-y-2">
            <StatRow label="Samples"  value={sampleCount}       dot="#818cf8" />
            <StatRow label="PC Axes"  value={pcColumns.length}  dot="#a78bfa" />
            <StatRow label="Groups"   value={groupCount}         dot="#34d399" />
            <StatRow label="Metadata" value={metaColumns.length} dot="#fbbf24" />
          </div>
        </Section>
      </div>
    </aside>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="label-sm mb-2.5">{title}</p>
      {children}
    </div>
  )
}

function ModeButton({ active, onClick, label, icon }) {
  return (
    <button onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium
                 transition-all duration-200 cursor-pointer"
      style={active
        ? { backgroundImage: 'linear-gradient(to right,#4f46e5,#7c3aed)', color: '#fff',
            boxShadow: '0 2px 10px rgba(79,70,229,0.35)' }
        : { color: 'var(--text-3)' }}>
      {icon}{label}
    </button>
  )
}

function AxisSelect({ label, labelColor, value, options, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: labelColor }}>{label}</label>
      <select className="select-styled" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(pc => <option key={pc} value={pc}>{pc}</option>)}
      </select>
    </div>
  )
}

function SliderRow({ label, value, min, max, step, onChange, displayValue }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</span>
        <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>{displayValue}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="w-full"
        style={{
          background: `linear-gradient(to right,#6366f1 0%,#8b5cf6 ${pct}%,rgba(128,128,128,0.15) ${pct}%,rgba(128,128,128,0.15) 100%)`,
        }} />
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full
                 border-2 border-transparent transition-colors duration-200 focus:outline-none"
      style={{ backgroundColor: checked ? '#4f46e5' : 'rgba(128,128,128,0.2)' }}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow
                        transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

function StatRow({ label, value, dot }) {
  return (
    <div className="flex items-center justify-between py-1.5"
         style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</span>
      </div>
      <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-1)' }}>{value}</span>
    </div>
  )
}

function Icon2D() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="12" x2="21" y2="12" strokeOpacity="0.4"/>
      <line x1="12" y1="3" x2="12" y2="21" strokeOpacity="0.4"/>
      <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="14" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function Icon3D() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  )
}
