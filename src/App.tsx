import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Onboarding } from './components/Onboarding'
import { NewTripPanel } from './components/NewTripPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { Workspace } from './components/Workspace'
import { sampleTrip } from './data/sampleTrip'
import { generateTrip, recheckTripCoordinates } from './lib/backend'
import { parseTrip, type Trip } from './types/trip'
import './App.css'

const COORDINATE_ALGORITHM_VERSION = 'poi-landmark-v3'

function App() {
  const [screen, setScreen] = useState<'onboarding' | 'workspace'>('onboarding')
  const [trip, setTrip] = useState<Trip>(() => {
    const saved = localStorage.getItem('travel-canvas-trip')
    if (!saved) return sampleTrip
    try { return parseTrip(JSON.parse(saved)) } catch { return sampleTrip }
  })
  const [model, setModel] = useState(() => localStorage.getItem('travel-canvas-model') || 'deepseek-chat')
  const [apiKey, setApiKey] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newTripOpen, setNewTripOpen] = useState(false)
  const [creatingTrip, setCreatingTrip] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [savedPulse, setSavedPulse] = useState(0)
  const [locationChecking, setLocationChecking] = useState(false)
  const [locationCalibrated, setLocationCalibrated] = useState(() => localStorage.getItem('travel-canvas-coordinate-version') === COORDINATE_ALGORITHM_VERSION)
  const locationMigrationStarted = useRef(false)

  useEffect(() => {
    const preview = new URLSearchParams(window.location.search)
    if (import.meta.env.DEV && preview.has('workspace')) {
      setScreen('workspace')
      if (preview.has('settings')) setSettingsOpen(true)
      if (preview.has('newtrip')) setNewTripOpen(true)
      return
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('travel-canvas-trip', JSON.stringify(trip))
  }, [trip])

  useEffect(() => {
    if (screen !== 'workspace' || locationCalibrated || locationMigrationStarted.current) return
    locationMigrationStarted.current = true
    setLocationChecking(true)
    setError('')
    recheckTripCoordinates(trip)
      .then((nextTrip) => {
        setTrip(nextTrip)
        localStorage.setItem('travel-canvas-coordinate-version', COORDINATE_ALGORITHM_VERSION)
        setLocationCalibrated(true)
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)))
      .finally(() => setLocationChecking(false))
  }, [locationCalibrated, screen, trip])

  function changeModel(next: string) {
    setModel(next)
    localStorage.setItem('travel-canvas-model', next)
  }

  async function runGenerate(prompt: string, includeCurrentTrip: boolean) {
    if (!apiKey) {
      setError('请先填写当前会话使用的 DeepSeek API Key')
      setScreen('onboarding')
      return false
    }
    setBusy(true)
    setError('')
    try {
      const nextTrip = await generateTrip(prompt, model, apiKey, includeCurrentTrip ? trip : undefined)
      setTrip(nextTrip)
      localStorage.setItem('travel-canvas-coordinate-version', COORDINATE_ALGORITHM_VERSION)
      setLocationCalibrated(true)
      setSavedPulse((value) => value + 1)
      window.setTimeout(() => setSavedPulse(0), 2600)
      return true
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      return false
    } finally {
      setBusy(false)
    }
  }

  async function handleModify(prompt: string) {
    await runGenerate(prompt, true)
  }

  async function handleCreate(prompt: string) {
    setNewTripOpen(false)
    setCreatingTrip(true)
    const success = await runGenerate(prompt, false)
    setCreatingTrip(false)
    if (!success) setNewTripOpen(true)
  }

  return (
    <>
      {screen === 'onboarding' && <Onboarding model={model} onModelChange={changeModel} onComplete={(key) => { setApiKey(key); setScreen('workspace') }} onPreview={() => setScreen('workspace')} />}
      {screen === 'workspace' && <Workspace trip={trip} busy={busy} creatingTrip={creatingTrip} locationChecking={locationChecking} locationCalibrated={locationCalibrated} error={error} savedPulse={savedPulse} connected={Boolean(apiKey)} onGenerate={handleModify} onNewTrip={() => { setError(''); setNewTripOpen(true) }} onOpenSettings={() => setSettingsOpen(true)} />}
      <AnimatePresence>
        {newTripOpen && <NewTripPanel busy={busy} error={error} onClose={() => setNewTripOpen(false)} onCreate={handleCreate} />}
        {settingsOpen && <SettingsPanel model={model} onModelChange={changeModel} onClose={() => setSettingsOpen(false)} onApiKeyChange={setApiKey} onKeyDeleted={() => { setApiKey(''); setSettingsOpen(false); setScreen('onboarding') }} />}
      </AnimatePresence>
    </>
  )
}

export default App
