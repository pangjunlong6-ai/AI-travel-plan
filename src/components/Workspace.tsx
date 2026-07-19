import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, CalendarDays, Check, ChevronRight, CircleUserRound, Compass, Map as MapIcon, MapPinned, PlaneTakeoff, Plus, Settings, Sparkles } from 'lucide-react'
import type { Trip } from '../types/trip'
import { ActionDock } from './ActionDock'
import { AssistantPanel } from './AssistantPanel'
import { AllSchedulePage } from './AllSchedulePage'
import { MyTripsPage } from './MyTripsPage'
import { RemindersPage } from './RemindersPage'
import { Timeline } from './Timeline'
import { TravelMap } from './TravelMap'
import { WeatherPill } from './WeatherPill'

type WorkspaceProps = {
  trip: Trip
  busy: boolean
  creatingTrip: boolean
  locationChecking: boolean
  locationCalibrated: boolean
  error: string
  savedPulse: number
  connected: boolean
  onGenerate: (prompt: string) => Promise<void>
  onNewTrip: () => void
  onOpenSettings: () => void
}

export function Workspace({ trip, busy, creatingTrip, locationChecking, locationCalibrated, error, savedPulse, connected, onGenerate, onNewTrip, onOpenSettings }: WorkspaceProps) {
  const [view, setView] = useState<'map' | 'schedule' | 'reminders' | 'trips'>(() => {
    if (!import.meta.env.DEV) return 'map'
    const candidate = new URLSearchParams(window.location.search).get('view')
    return candidate === 'schedule' || candidate === 'reminders' || candidate === 'trips' ? candidate : 'map'
  })
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [locateSignal, setLocateSignal] = useState(0)
  const [assistantDraft, setAssistantDraft] = useState<{ id: number; text: string }>()
  const [completedReminders, setCompletedReminders] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('travel-canvas-reminders-completed') || '[]') as string[]) }
    catch { return new Set() }
  })
  const aiRef = useRef<HTMLTextAreaElement>(null)
  const day = trip.days[Math.min(selectedDay, trip.days.length - 1)]

  function chooseDay(index: number) {
    setSelectedDay(index)
    setSelectedSlot(0)
  }

  function focusMap() { document.querySelector<HTMLElement>('.travel-map')?.focus() }
  function openMap(dayIndex = selectedDay) { chooseDay(dayIndex); setView('map') }
  function draftForAi(text: string) {
    setView('map')
    setAssistantDraft({ id: Date.now(), text })
  }
  function locateRoute() {
    setView('map')
    setLocateSignal((value) => value + 1)
    window.requestAnimationFrame(focusMap)
  }
  function toggleReminder(item: string) {
    setCompletedReminders((current) => {
      const next = new Set(current)
      if (next.has(item)) next.delete(item)
      else next.add(item)
      localStorage.setItem('travel-canvas-reminders-completed', JSON.stringify([...next]))
      return next
    })
  }
  const pendingReminderCount = trip.reminders.filter((reminder) => !completedReminders.has(reminder.item)).length

  useEffect(() => {
    if (creatingTrip) setView('map')
  }, [creatingTrip])

  return (
    <main className="app-shell" aria-busy={creatingTrip || locationChecking}>
      <aside className="sidebar">
        <div className="sidebar-brand"><span><MapPinned size={20} /></span><strong>行程绘</strong></div>
        <button className="new-trip-button" type="button" onClick={onNewTrip}><Plus size={16} /> 新建行程</button>
        <nav className="primary-nav" aria-label="主要导航">
          <button type="button" className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}><MapIcon size={17} /><span>行程地图</span><kbd>⌘1</kbd></button>
          <button type="button" className={view === 'schedule' ? 'active' : ''} onClick={() => setView('schedule')}><CalendarDays size={17} /><span>全部日程</span></button>
          <button type="button" className={view === 'reminders' ? 'active' : ''} onClick={() => setView('reminders')}><Bell size={17} /><span>出发提醒</span>{pendingReminderCount > 0 && <em>{pendingReminderCount}</em>}</button>
          <button type="button" className={view === 'trips' ? 'active' : ''} onClick={() => setView('trips')}><PlaneTakeoff size={17} /><span>我的行程</span></button>
        </nav>
        <div className="trip-list-heading"><span>当前旅程</span><button type="button" aria-label="添加旅程" onClick={onNewTrip}><Plus size={14} /></button></div>
        <button className="trip-item active" type="button" onClick={() => setView('trips')}><span className="trip-thumb"><PlaneTakeoff size={17} /></span><div><strong>{trip.destination}</strong><small>{trip.days.length} 天 · {trip.startDate.slice(5)}</small></div><ChevronRight size={15} /></button>
        <div className="day-nav" aria-label="选择日期">
          {trip.days.map((item, index) => (
            <button key={item.date} type="button" className={view === 'map' && selectedDay === index ? 'active' : ''} onClick={() => openMap(index)}>
              <span>{String(index + 1).padStart(2, '0')}</span><div><strong>第 {index + 1} 天</strong><small>{item.theme}</small></div>
            </button>
          ))}
        </div>
        <div className="sidebar-footer"><button type="button" onClick={onOpenSettings}><Settings size={17} /><span>设置</span></button><button type="button"><CircleUserRound size={18} /><span>本地模式</span><i /></button></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="title-block"><nav className="breadcrumb" aria-label="当前位置"><button type="button" className={view === 'trips' ? 'current' : ''} aria-current={view === 'trips' ? 'page' : undefined} onClick={() => setView('trips')} aria-label="返回我的行程">我的行程</button>{view !== 'trips' && <><ChevronRight size={14} aria-hidden="true" /><button type="button" className="current" onClick={() => openMap(selectedDay)} aria-label={`返回${trip.destination}行程地图`}>{trip.destination}</button></>}</nav><div><h1>{trip.title}</h1><span className="trip-status"><i /> {locationChecking ? '正在校准地图定位…' : locationCalibrated ? '地图定位已校准' : '本地已保存'}</span></div></div>
          <div className="topbar-actions"><WeatherPill trip={trip} /><button className="secondary-button" type="button" onClick={() => setView('schedule')}><Compass size={16} /> 预览全程</button><button className="primary-button" type="button" onClick={onNewTrip}><Sparkles size={16} /> 生成行程</button></div>
        </header>
        {view === 'map' && <div className="workspace-content"><div className="planning-canvas"><div className="map-wrap"><TravelMap day={day} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} locateSignal={locateSignal} /><ActionDock onLocateRoute={locateRoute} onAdjustRoute={() => draftForAi(`请优化第 ${selectedDay + 1} 天“${day.theme}”的路线顺序，减少折返和步行，并保留合理缓冲时间。`)} onAddPlan={() => draftForAi(`请在第 ${selectedDay + 1} 天增加一项适合当前路线的安排，避免打乱已有预约。`)} onAskAi={() => draftForAi('请分析这段行程有哪些可以优化的地方，并优先指出路线、节奏和预约风险。')} /></div><Timeline day={day} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} /></div><AssistantPanel ref={aiRef} trip={trip} busy={busy} error={error} onGenerate={onGenerate} draftRequest={assistantDraft} /></div>}
        {view === 'schedule' && <AllSchedulePage trip={trip} onOpenMap={openMap} />}
        {view === 'reminders' && <RemindersPage trip={trip} completed={completedReminders} onToggle={toggleReminder} />}
        {view === 'trips' && <MyTripsPage trip={trip} onOpen={() => openMap(0)} onNewTrip={onNewTrip} />}
        <footer className="app-footer"><span>AI 整理内容可能不准确，请在官方渠道与地图 App 核实。</span><span><i /> {connected ? 'DeepSeek 当前会话已连接' : '示例模式'}</span></footer>
      </section>

      <AnimatePresence>{savedPulse > 0 && <motion.div key={savedPulse} className="save-toast" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}><Check size={16} /> 新行程已校验并保存</motion.div>}</AnimatePresence>
      <AnimatePresence>{(creatingTrip || locationChecking) && <motion.div className="generation-blocker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" aria-live="polite"><motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><span className="orbit-loader large"><span /></span><strong>{locationChecking ? '正在校准地图定位' : '正在推荐行程'}</strong><p>{locationChecking ? '正在重新核对已保存行程中的景点名称与地图标记…' : '根据所选地点整理路线，并逐一核对景点与地图坐标…'}</p></motion.div></motion.div>}</AnimatePresence>
    </main>
  )
}
