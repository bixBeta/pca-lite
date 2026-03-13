// Curated palette optimised for dark backgrounds — vibrant but not garish
export const PALETTE = [
  '#818cf8', // indigo-400
  '#fb7185', // rose-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#38bdf8', // sky-400
  '#a78bfa', // violet-400
  '#2dd4bf', // teal-400
  '#f97316', // orange-400
  '#a3e635', // lime-400
  '#e879f9', // fuchsia-400
  '#f43f5e', // rose-500
  '#60a5fa', // blue-400
  '#4ade80', // green-400
  '#facc15', // yellow-400
  '#c084fc', // purple-400
  '#22d3ee', // cyan-400
  '#fb923c', // orange-400
  '#86efac', // green-300
]

/**
 * Build a { value -> color } map for an array of unique category values.
 */
export function buildColorMap(values) {
  const unique = [...new Set(values)]
  const map = {}
  unique.forEach((v, i) => {
    map[v] = PALETTE[i % PALETTE.length]
  })
  return map
}

/**
 * Given an array of category strings and a colorMap, return an array of
 * hex color strings — one per data point.
 */
export function mapColors(values, colorMap) {
  return values.map(v => colorMap[v] ?? '#94a3b8')
}
