import { useMemo, useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'

const CONFIG = { displaylogo: false, responsive: true,
  modeBarButtonsToRemove: ['sendDataToCloud', 'select2d', 'lasso2d'],
  toImageButtonOptions: { format: 'png', scale: 2, filename: 'scree_plot' },
}

export default function ScreePlot({ pcColumns, varExplained, isDark }) {
  const containerRef = useRef(null)

  const { traces, layout } = useMemo(() => {
    const vars    = pcColumns.map(pc => varExplained[pc] ?? 0)
    const cumVars = vars.reduce((acc, v, i) => {
      acc.push((acc[i - 1] ?? 0) + v)
      return acc
    }, [])

    const fontColor  = isDark ? '#94a3b8' : '#475569'
    const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
    const tickColor  = isDark ? '#64748b' : '#94a3b8'
    const legendBg   = isDark ? 'rgba(13,20,36,0.85)' : 'rgba(255,255,255,0.92)'
    const legendBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    const hoverBg    = isDark ? 'rgba(13,20,36,0.95)' : 'rgba(255,255,255,0.97)'
    const hoverBorder = isDark ? 'rgba(129,140,248,0.4)' : 'rgba(99,102,241,0.4)'
    const hoverText  = isDark ? '#e2e8f0' : '#1e293b'
    const cumColor   = isDark ? '#f472b6' : '#db2777'

    // Bar colours: indigo fading to violet as variance drops
    const barColors = vars.map((_, i) => {
      const t = i / Math.max(pcColumns.length - 1, 1)
      // lerp from indigo (#6366f1) toward violet/slate at low variance
      const alpha = isDark
        ? Math.max(0.25, 1 - t * 0.75)
        : Math.max(0.2, 1 - t * 0.65)
      return isDark
        ? `rgba(129,140,248,${alpha})`
        : `rgba(79,70,229,${alpha})`
    })

    const traces = [
      {
        type: 'bar',
        x: pcColumns,
        y: vars,
        name: 'Variance explained',
        marker: { color: barColors, line: { width: 0 } },
        hovertemplate: '<b>%{x}</b><br>%{y:.2f}%<extra></extra>',
      },
      {
        type: 'scatter',
        mode: 'lines+markers',
        x: pcColumns,
        y: cumVars,
        name: 'Cumulative',
        yaxis: 'y2',
        line: { color: cumColor, width: 2 },
        marker: { size: 5, color: cumColor },
        hovertemplate: '<b>%{x}</b><br>Cumulative: %{y:.1f}%<extra></extra>',
      },
    ]

    const axisBase = {
      gridcolor: gridColor,
      zerolinecolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)',
      tickfont: { color: tickColor, size: 10 },
      titlefont: { color: fontColor, size: 12 },
    }

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: fontColor, family: 'Inter, system-ui, sans-serif', size: 12 },
      bargap: 0.25,
      xaxis: {
        ...axisBase,
        title: { text: 'Principal Component', standoff: 14 },
        tickangle: pcColumns.length > 12 ? -45 : 0,
      },
      yaxis: {
        ...axisBase,
        title: { text: 'Variance explained (%)', standoff: 12 },
        range: [0, Math.max(...vars) * 1.18],
        zeroline: true,
      },
      yaxis2: {
        ...axisBase,
        overlaying: 'y',
        side: 'right',
        title: { text: 'Cumulative (%)', standoff: 12, font: { color: cumColor, size: 12 } },
        range: [0, 105],
        showgrid: false,
        zeroline: false,
        tickfont: { color: tickColor, size: 10 },
      },
      legend: {
        bgcolor: legendBg,
        bordercolor: legendBorder,
        borderwidth: 1,
        font: { color: isDark ? '#cbd5e1' : '#475569', size: 11 },
        x: 0.5, y: 1.02, xanchor: 'center', yanchor: 'bottom',
        orientation: 'h',
      },
      hoverlabel: {
        bgcolor: hoverBg,
        bordercolor: hoverBorder,
        font: { color: hoverText, size: 11, family: 'JetBrains Mono, monospace' },
      },
      margin: { l: 60, r: 60, t: 50, b: pcColumns.length > 12 ? 100 : 60 },
    }

    return { traces, layout }
  }, [pcColumns, varExplained, isDark])

  // Render / update Plotly and fix modebar transparency
  useEffect(() => {
    if (!containerRef.current) return
    Plotly.react(containerRef.current, traces, layout, CONFIG)

    const id = setTimeout(() => {
      containerRef.current
        ?.querySelectorAll('.modebar-container, .modebar, .modebar-group')
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

  // Responsive resize
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      if (containerRef.current) Plotly.Plots.resize(containerRef.current)
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
