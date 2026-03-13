# PCA ExploreR

A modern, serverless PCA visualization app built with React + Vite. Upload a CSV of eigenvalues or a `prcomp` RDS file and instantly explore your data with interactive 2D/3D scatter plots, a scree plot, and metadata-driven coloring — all in the browser, no server required.

**Live app → [bixbeta.github.io/pca-lite](https://bixbeta.github.io/pca-lite/)**

---

## Features

- **2D & 3D scatter plots** via Plotly.js
- **Scree plot** with cumulative variance line (RDS upload)
- **% variance on axis labels** (RDS upload)
- **Metadata coloring** — color points by any column in your CSV or `colData`
- **WebR** — R runs entirely in the browser (WASM), no backend needed
- **Light / dark theme** toggle
- **Drag & drop** or click-to-browse file upload

---

## Supported File Formats

### CSV
Standard eigenvalues CSV exported from R or any PCA tool.

```
"","PC1","PC2",...,"label","group"
"1",-1.06,-28.3,...,"Sample_A","GroupX"
```

- Columns matching `PC1, PC2, …` → plot axes
- All other columns → available for color grouping

### RDS (`prcomp` list)
Save your `prcomp` result as a named list and upload directly:

```r
pca_list <- list(
  PCA.df      = as.data.frame(pca$x),   # PC scores
  colData     = sample_metadata,          # metadata data frame
  Variance.df = variance_df,              # variance data frame
  prcomp.out  = pca,                      # prcomp object
  rawCounts   = counts                    # ignored, can be omitted
)
saveRDS(pca_list, "pca.rds")
```

Uploading an RDS unlocks the **Scree Plot** view and adds **% variance** to each axis label.

---

## Tech Stack

| | |
|---|---|
| Framework | React 18 + Vite |
| Plotting | Plotly.js (`plotly.js-dist-min`) |
| CSV parsing | PapaParse |
| R in browser | [WebR](https://webr.r-wasm.org/) (WASM) |
| Styling | Tailwind CSS v3 |
| Deploy | GitHub Actions → GitHub Pages |

---

## Local Development

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Deploy

Pushing to `main` triggers the GitHub Actions workflow which builds and deploys to GitHub Pages automatically.
