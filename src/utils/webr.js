/**
 * WebR singleton — initialised once, reused across calls.
 * Call getWebR() as early as possible so the 30 MB WASM download
 * happens in the background before the user picks an RDS file.
 */
let initPromise = null

export function getWebR() {
  if (!initPromise) {
    initPromise = (async () => {
      // @vite-ignore tells Vite not to try to bundle the CDN import
      const { WebR } = await import(/* @vite-ignore */ 'https://webr.r-wasm.org/latest/webr.mjs')
      const webR = new WebR({ quiet: true })
      await webR.init()
      return webR
    })().catch(err => {
      initPromise = null   // allow retry on next call
      throw err
    })
  }
  return initPromise
}
