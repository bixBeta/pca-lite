import Papa from 'papaparse'

/**
 * Parse a PCA CSV file.
 * Returns: { rows, pcColumns, metaColumns }
 *
 * PC columns: any column whose name starts with "PC" (case-insensitive)
 * Meta columns: all others (excluding the leading row-index column if unnamed)
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

        // PC columns: start with "PC" (case-insensitive)
        const pcColumns = allColumns.filter(c =>
          /^PC\d+$/i.test(c)
        )

        // Meta columns: everything else, excluding the unnamed index column
        const metaColumns = allColumns.filter(c => {
          if (/^PC\d+$/i.test(c)) return false
          // Skip unnamed index column (empty string or just a number column acting as row index)
          if (c === '' || c === 'Unnamed: 0') return false
          return true
        })

        if (pcColumns.length < 2) {
          reject(
            new Error(
              'Could not find at least 2 PC columns. ' +
              'Columns must be named "PC1", "PC2", etc.'
            )
          )
          return
        }

        // Clean rows: ensure numeric PC values and string meta values
        const rows = data
          .map((row, i) => {
            const clean = { _index: i }
            pcColumns.forEach(pc => {
              clean[pc] = Number(row[pc]) || 0
            })
            metaColumns.forEach(col => {
              clean[col] = row[col] != null ? String(row[col]) : ''
            })
            return clean
          })
          .filter(row => pcColumns.some(pc => row[pc] !== 0))

        resolve({ rows, pcColumns, metaColumns })
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`))
      },
    })
  })
}
