import { useState, useEffect } from 'react'
import Uploader from './components/Uploader'
import Dashboard from './components/Dashboard'

export default function App() {
  const [parsedData, setParsedData] = useState(null)
  const [fileName, setFileName] = useState('')
  const [isDark, setIsDark] = useState(false)

  // Apply / remove 'dark' class on <html>
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDark])

  function handleDataLoaded(data, name) {
    setParsedData(data)
    setFileName(name)
  }

  function handleReset() {
    setParsedData(null)
    setFileName('')
  }

  if (!parsedData) {
    return <Uploader onDataLoaded={handleDataLoaded} isDark={isDark} onThemeToggle={() => setIsDark(d => !d)} />
  }

  return (
    <Dashboard
      data={parsedData}
      fileName={fileName}
      onReset={handleReset}
      isDark={isDark}
      onThemeToggle={() => setIsDark(d => !d)}
    />
  )
}
