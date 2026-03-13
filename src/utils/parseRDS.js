import Papa from 'papaparse'
import { getWebR } from './webr'

/**
 * Parse the custom PCA list RDS.
 *
 * Expected list structure:
 *   PCA.df      – data frame of PC scores  (rows = samples, cols = PC1..PCn)
 *   colData     – data frame of metadata   (rows = samples, cols = group, label, …)
 *   Variance.df – data frame of variances  (used as reference; actual % computed from prcomp.out)
 *   prcomp.out  – prcomp object            (sdev used for variance explained)
 *   rawCounts   – ignored (not needed for visualisation)
 *
 * Returns: { rows, pcColumns, metaColumns, varExplained }
 *   varExplained: { PC1: 23.4, PC2: 15.2, … }
 */
export async function parsePrcompRDS(file, onStatus) {
  onStatus?.('Initializing R…')
  const webR = await getWebR()

  onStatus?.('Reading RDS file…')
  const bytes = await file.arrayBuffer()
  await webR.FS.writeFile('/tmp/_pca.rds', new Uint8Array(bytes))

  onStatus?.('Extracting PCA data…')

  // All base-R — no package installs needed
  await webR.evalR(`
    .obj <- readRDS('/tmp/_pca.rds')

    # ── Detect format: plain prcomp OR named list ─────────────────────────────
    if (inherits(.obj, 'prcomp')) {
      # ── Plain prcomp object ──────────────────────────────────────────────────
      .pca_df  <- as.data.frame(.obj$x)
      .pc_cols <- colnames(.pca_df)
      .sdev    <- .obj$sdev

      .rn <- rownames(.obj$x)
      if (is.null(.rn)) .rn <- as.character(seq_len(nrow(.pca_df)))

      .combined <- .pca_df
      .combined[['Sample']] <- .rn

    } else if (is.list(.obj)) {
      # ── Named list format ────────────────────────────────────────────────────
      .required <- c('PCA.df', 'colData', 'Variance.df', 'prcomp.out')
      .missing   <- setdiff(.required, names(.obj))
      if (length(.missing) > 0)
        stop('Missing list elements: ', paste(.missing, collapse = ', '),
             '. Found: ', paste(names(.obj), collapse = ', '))

      .pca_df  <- as.data.frame(.obj$PCA.df)
      .pc_cols <- grep('^PC[0-9]+$', colnames(.pca_df), value = TRUE, ignore.case = TRUE)
      if (length(.pc_cols) == 0)
        stop('No PC columns found in PCA.df. Column names: ',
             paste(colnames(.pca_df), collapse = ', '))

      .colData <- as.data.frame(.obj$colData)

      .rn <- rownames(.pca_df)
      if (is.null(.rn) || identical(.rn, as.character(seq_len(nrow(.pca_df))))) {
        .rn2 <- rownames(.colData)
        if (!is.null(.rn2)) .rn <- .rn2
      }
      if (is.null(.rn)) .rn <- as.character(seq_len(nrow(.pca_df)))

      .combined <- cbind(.pca_df[, .pc_cols, drop = FALSE], .colData)
      if (!'Sample' %in% colnames(.combined))
        .combined[['Sample']] <- .rn

      .sdev <- .obj$prcomp.out$sdev
      if (is.null(.sdev) || length(.sdev) == 0)
        stop('prcomp.out$sdev is empty or NULL')

    } else {
      stop('RDS must be a prcomp object or a named list. Got: ',
           paste(class(.obj), collapse = ', '))
    }

    # ── Variance explained ────────────────────────────────────────────────────
    .var_exp <- (.sdev^2 / sum(.sdev^2)) * 100
    .var_exp  <- .var_exp[seq_along(.pc_cols)]

    # ── Write combined CSV ────────────────────────────────────────────────────
    write.csv(.combined, '/tmp/_scores.csv', row.names = FALSE)
  `)

  // Pull PC names and variance values back to JS
  const pcNamesRObj = await webR.evalR('as.character(.pc_cols)')
  const pcNamesJs   = await pcNamesRObj.toJs()
  const pcNames     = pcNamesJs.values   // string[]

  const varRObj   = await webR.evalR('as.numeric(.var_exp)')
  const varJs     = await varRObj.toJs()
  const varValues = varJs.values         // number[]

  // Read and parse the combined CSV
  onStatus?.('Parsing scores…')
  const csvBytes = await webR.FS.readFile('/tmp/_scores.csv')
  const csvStr   = new TextDecoder().decode(csvBytes)

  const parsed = Papa.parse(csvStr, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  })

  if (!parsed.data.length) throw new Error('No rows found after merging pca.df + colData')

  const allCols     = parsed.meta.fields ?? []
  const metaColumns = allCols.filter(c => !pcNames.includes(c) && c !== '')

  // Build varExplained map { PC1: 23.4, … }
  const varExplained = {}
  pcNames.forEach((name, i) => { varExplained[name] = varValues[i] })

  // Clean rows — same contract as parsePCACSV
  const rows = parsed.data
    .map((row, i) => {
      const clean = { _index: i }
      pcNames.forEach(pc  => { clean[pc]  = Number(row[pc]) || 0 })
      metaColumns.forEach(col => { clean[col] = row[col] != null ? String(row[col]) : '' })
      return clean
    })
    .filter(row => pcNames.some(pc => row[pc] !== 0))

  // Tidy up
  try { await webR.FS.unlink('/tmp/_pca.rds')    } catch (_) {}
  try { await webR.FS.unlink('/tmp/_scores.csv') } catch (_) {}
  await webR.evalR(`
    rm(list = intersect(ls(), c('.obj', '.pca_df', '.colData', '.combined',
                                '.pc_cols', '.rn', '.sdev', '.var_exp',
                                '.required', '.missing')))
  `)

  return { rows, pcColumns: pcNames, metaColumns, varExplained }
}
