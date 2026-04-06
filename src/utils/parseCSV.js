import Papa from 'papaparse'

/**
 * Parse a PCA CSV file.
 * Returns: { rows, pcColumns, metaColumns, varExplained }
 *
 * PC columns: any column whose name starts with "PC\d+" (case-insensitive),
 *   with an optional " (XX.X%)" variance suffix produced by DESeq2 ExploreR exports.
 *   e.g. "PC1", "PC1 (51.8%)" — both are detected; the clean name "PC1" is used.
 * varExplained: { PC1: 51.8, PC2: 12.9, … } when the suffix is present, else null.
 * Meta columns: all others (excluding the leading unnamed row-index column if present)
 */
export function parsePCACSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete(results) {
        const { data, meta } = results
        if (!data.length) {
          reject(new Error('The file appears to be empty.'))
          return
        }

        const allColumns = meta.fields || []

        // Detect PC columns: bare "PC1" or with variance suffix "PC1 (51.8%)"
        const pcRaw = allColumns.filter(c => /^PC\d+/i.test(c))

        // Build raw→clean name map and extract embedded variance values
        const varExplained = {}
        const pcNameMap = {}   // "PC1 (51.8%)" → "PC1"
        pcRaw.forEach(raw => {
          const clean = raw.match(/^(PC\d+)/i)[1].toUpperCase()
          pcNameMap[raw] = clean
          const varMatch = raw.match(/\((\d+\.?\d*)%\)/)
          if (varMatch) varExplained[clean] = parseFloat(varMatch[1])
        })

        const pcColumns = [...new Set(Object.values(pcNameMap))]
          .sort((a, b) => parseInt(a.slice(2)) - parseInt(b.slice(2)))

        // Meta columns: everything else, excluding unnamed index column
        const metaColumns = allColumns.filter(c => {
          if (/^PC\d+/i.test(c)) return false
          if (c === '' || c === 'Unnamed: 0') return false
          return true
        })

        if (pcColumns.length < 2) {
          reject(new Error(
            'Could not find at least 2 PC columns. ' +
            'Columns must be named "PC1", "PC2", etc. (variance % suffix is optional).'
          ))
          return
        }

        // Clean rows: numeric PC values (using clean names), string meta values
        const rows = data
          .map((row, i) => {
            const clean = { _index: i }
            pcRaw.forEach(raw => {
              clean[pcNameMap[raw]] = Number(row[raw]) || 0
            })
            metaColumns.forEach(col => {
              clean[col] = row[col] != null ? String(row[col]) : ''
            })
            return clean
          })
          .filter(row => pcColumns.some(pc => row[pc] !== 0))

        resolve({
          rows,
          pcColumns,
          metaColumns,
          varExplained: Object.keys(varExplained).length > 0 ? varExplained : null,
        })
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`))
      },
    })
  })
}
