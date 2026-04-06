import { useMemo, useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import { buildColorMap } from '../utils/colors'

const SYMBOLS_2D = ['circle','square','diamond','triangle-up','cross','x','triangle-down','pentagon','hexagon','star','bowtie','hourglass']
const SYMBOLS_3D = ['circle','square','diamond','cross','x']

const PLOTLY_CONFIG = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: ['sendDataToCloud', 'select2d', 'lasso2d'],
  toImageButtonOptions: { format: 'png', scale: 2, filename: 'pca_plot' },
}

function axisLabel(name, varExplained) {
  const pct = varExplained?.[name]
  return pct != null ? `${name} (${pct.toFixed(1)}%)` : name
}

function buildLayout(isDark, mode, xAxis, yAxis, zAxis, varExplained) {
  const fontColor   = isDark ? '#94a3b8' : '#475569'
  const gridColor   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
  const zeroColor   = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)'
  const lineColor   = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)'
  const tickColor   = isDark ? '#64748b' : '#94a3b8'
  const titleColor  = isDark ? '#94a3b8' : '#475569'
  const legendBg    = isDark ? 'rgba(13,20,36,0.85)'    : 'rgba(255,255,255,0.92)'
  const legendBorder= isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)'
  const legendText  = isDark ? '#cbd5e1' : '#475569'
  const hoverBg     = isDark ? 'rgba(13,20,36,0.95)'    : 'rgba(255,255,255,0.97)'
  const hoverBorder = isDark ? 'rgba(129,140,248,0.4)'  : 'rgba(99,102,241,0.4)'
  const hoverText   = isDark ? '#e2e8f0' : '#1e293b'

  const axisStyle = {
    gridcolor: gridColor,
    zerolinecolor: zeroColor,
    linecolor: lineColor,
    tickfont: { color: tickColor, size: 10 },
    titlefont: { color: titleColor, size: 12 },
    showgrid: true,
    zeroline: true,
  }

  const base = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    font: { color: fontColor, family: 'Inter, system-ui, sans-serif', size: 12 },
    legend: {
      bgcolor: legendBg,
      bordercolor: legendBorder,
      borderwidth: 1,
      font: { color: legendText, size: 11 },
      itemsizing: 'constant',
      itemwidth: 30,
      x: 1,
      y: 0,
      xanchor: 'right',
      yanchor: 'bottom',
    },
    hoverlabel: {
      bgcolor: hoverBg,
      bordercolor: hoverBorder,
      font: { color: hoverText, size: 11, family: 'JetBrains Mono, monospace' },
    },
  }

  if (mode === '3D') {
    const axisLine = isDark ? 'rgba(148,163,184,0.6)' : 'rgba(71,85,105,0.5)'
    const gridColor3D = isDark ? 'rgba(148,163,184,0.03)' : 'rgba(71,85,105,0.03)'
    const axis3D = (title) => ({
      title,
      showgrid: true,
      gridcolor: gridColor3D,
      zeroline: false,
      showline: true,
      linecolor: axisLine,
      linewidth: 2,
      showbackground: false,
      backgroundcolor: 'rgba(0,0,0,0)',
      tickfont: { color: tickColor, size: 10 },
      titlefont: { color: titleColor, size: 12 },
    })
    return {
      ...base,
      scene: {
        xaxis: axis3D(axisLabel(xAxis, varExplained)),
        yaxis: axis3D(axisLabel(yAxis, varExplained)),
        zaxis: axis3D(axisLabel(zAxis, varExplained)),
        bgcolor: 'rgba(0,0,0,0)',
      },
      margin: { l: 0, r: 0, t: 20, b: 0 },
    }
  }

  return {
    ...base,
    xaxis: { ...axisStyle, title: { text: axisLabel(xAxis, varExplained), standoff: 12 } },
    yaxis: { ...axisStyle, title: { text: axisLabel(yAxis, varExplained), standoff: 12 } },
    margin: { l: 60, r: 30, t: 30, b: 60 },
  }
}

export default function ScatterPlot({
  rows, mode, xAxis, yAxis, zAxis, colorBy, shapeBy,
  pointSize, opacity, showLabels, metaColumns, isDark, varExplained,
}) {
  const containerRef = useRef(null)
  const plotRef = useRef(null)

  const { traces, layout } = useMemo(() => {
    if (!rows.length) return { traces: [], layout: buildLayout(isDark, mode, xAxis, yAxis, zAxis, varExplained) }

    const colorValues = rows.map(r => r[colorBy] ?? 'Unknown')
    const colorMap = buildColorMap(colorValues)
    const groups = [...new Set(colorValues)]
    const is3D = mode === '3D'

    // Build shapeMap: unique shapeBy values → symbol strings
    const shapeUniqueVals = shapeBy
      ? [...new Set(rows.map(r => r[shapeBy] ?? 'Unknown'))]
      : []
    const shapeMap = shapeBy
      ? Object.fromEntries(shapeUniqueVals.map((v, i) => [v, (is3D ? SYMBOLS_3D : SYMBOLS_2D)[i % (is3D ? SYMBOLS_3D : SYMBOLS_2D).length]]))
      : null

    const traces = groups.map(group => {
      const gr = rows.filter(r => (r[colorBy] ?? 'Unknown') === group)
      const xs = gr.map(r => r[xAxis] ?? 0)
      const ys = gr.map(r => r[yAxis] ?? 0)
      const zs = is3D ? gr.map(r => r[zAxis] ?? 0) : undefined

      const hoverTexts = gr.map(r => {
        const lines = metaColumns.map(col => `<b>${col}</b>: ${r[col] ?? '—'}`)
        lines.push(`<b>${xAxis}</b>: ${(r[xAxis] ?? 0).toFixed(3)}`)
        lines.push(`<b>${yAxis}</b>: ${(r[yAxis] ?? 0).toFixed(3)}`)
        if (is3D) lines.push(`<b>${zAxis}</b>: ${(r[zAxis] ?? 0).toFixed(3)}`)
        return lines.join('<br>')
      })

      const labels = showLabels ? gr.map(r => r[metaColumns[0]] ?? '') : gr.map(() => '')
      const color = colorMap[group]
      const symbols = shapeMap
        ? gr.map(r => shapeMap[r[shapeBy] ?? 'Unknown'])
        : 'circle'

      if (is3D) {
        return {
          type: 'scatter3d', mode: showLabels ? 'markers+text' : 'markers',
          name: group, x: xs, y: ys, z: zs,
          text: labels,
          textfont: { size: 9, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' },
          hovertemplate: '%{customdata}<extra><b>' + group + '</b></extra>',
          customdata: hoverTexts,
          marker: {
            color, size: pointSize * 0.7, opacity,
            symbol: symbols,
            line: { color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', width: 0.5 },
          },
        }
      }

      return {
        type: 'scatter', mode: showLabels ? 'markers+text' : 'markers',
        name: group, x: xs, y: ys,
        text: labels, textposition: 'top center',
        textfont: { size: 9, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' },
        hovertemplate: '%{customdata}<extra><b>' + group + '</b></extra>',
        customdata: hoverTexts,
        marker: {
          color, size: pointSize, opacity,
          symbol: symbols,
          line: { color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', width: 0.8 },
        },
      }
    })

    return { traces, layout: buildLayout(isDark, mode, xAxis, yAxis, zAxis, varExplained) }
  }, [rows, mode, xAxis, yAxis, zAxis, colorBy, shapeBy, pointSize, opacity, showLabels, metaColumns, isDark, varExplained])

  useEffect(() => {
    if (!containerRef.current) return
    Plotly.react(containerRef.current, traces, layout, PLOTLY_CONFIG)
    plotRef.current = containerRef.current

    // Plotly injects inline background styles on modebar elements — override them
    const id = setTimeout(() => {
      if (!containerRef.current) return
      containerRef.current
        .querySelectorAll('.modebar-container, .modebar, .modebar-group')
        .forEach(el => {
          el.style.setProperty('background', 'transparent', 'important')
          el.style.setProperty('background-color', 'transparent', 'important')
        })
    }, 50)

    return () => {
      clearTimeout(id)
      if (containerRef.current) Plotly.purge(containerRef.current)
    }
  }, [traces, layout])

  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (plotRef.current) Plotly.Plots.resize(plotRef.current)
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  return <div ref={containerRef} className="w-full h-full animate-fade-in" />
}
