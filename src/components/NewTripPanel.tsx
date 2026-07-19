import { useEffect, useRef, useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { CalendarDays, Map, MapPinned, Sparkles, X } from 'lucide-react'
import { DestinationMapPicker } from './DestinationMapPicker'
import { reverseGeocode, type PlaceMatch } from '../lib/backend'

type NewTripPanelProps = {
  busy: boolean
  error: string
  onClose: () => void
  onCreate: (prompt: string) => Promise<void>
}

export function NewTripPanel({ busy, error, onClose, onCreate }: NewTripPanelProps) {
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [days, setDays] = useState(5)
  const [nights, setNights] = useState(4)
  const [pace, setPace] = useState('松弛适中')
  const [interests, setInterests] = useState('')
  const [pickerOpen, setPickerOpen] = useState(() => import.meta.env.DEV && new URLSearchParams(window.location.search).has('picker'))
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [placeMatch, setPlaceMatch] = useState<PlaceMatch | null>(null)
  const [placeLoading, setPlaceLoading] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const lookupTimer = useRef<number | null>(null)
  const lookupSequence = useRef(0)

  useEffect(() => () => {
    if (lookupTimer.current !== null) window.clearTimeout(lookupTimer.current)
  }, [])

  function handleMapPick(nextPosition: { lat: number; lng: number }) {
    setPosition(nextPosition)
    setPlaceMatch(null)
    setPlaceError('')
    setPlaceLoading(true)
    const sequence = ++lookupSequence.current
    if (lookupTimer.current !== null) window.clearTimeout(lookupTimer.current)
    lookupTimer.current = window.setTimeout(async () => {
      try {
        const match = await reverseGeocode(nextPosition.lat, nextPosition.lng)
        if (sequence !== lookupSequence.current) return
        setPlaceMatch(match)
        setDestination(match.name)
      } catch (lookupError) {
        if (sequence !== lookupSequence.current) return
        setPlaceError(lookupError instanceof Error ? lookupError.message : String(lookupError))
      } finally {
        if (sequence === lookupSequence.current) setPlaceLoading(false)
      }
    }, 1100)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if ((!destination.trim() && !position) || busy) return
    const prompt = [
      '请从零规划一个全新的旅行行程，不要沿用或修改任何已有示例。',
      `目的地：${destination.trim() || '根据地图选点判断附近城市或区域'}`,
      position ? `用户地图选点坐标（WGS-84）：${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : '',
      placeMatch ? `地图反查地点：${placeMatch.displayName}` : '',
      position ? '地图选点为地点真值：必须以该坐标所在地为中心规划，目的地名称、景点和所有景点坐标都必须与之对应，不得沿用示例城市。' : '',
      `开始日期：${startDate || '日期待定'}`,
      `旅行时长：${days} 天 ${nights} 晚`,
      `行程节奏：${pace}`,
      `兴趣与补充要求：${interests.trim() || '经典景点、当地美食与自由探索相结合'}`,
    ].filter(Boolean).join('\n')
    await onCreate(prompt)
  }

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={busy ? undefined : onClose}>
      <motion.section className="new-trip-panel" initial={{ y: 24, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 16, scale: 0.98, opacity: 0 }} onMouseDown={(event) => event.stopPropagation()} aria-labelledby="new-trip-title">
        <header>
          <div className="new-trip-heading"><span><MapPinned size={21} /></span><div><span className="soft-label">新的远方</span><h2 id="new-trip-title">规划一段全新旅程</h2></div></div>
          <button className="icon-button" type="button" onClick={onClose} disabled={busy} aria-label="关闭新建行程"><X size={19} /></button>
        </header>

        <form onSubmit={submit}>
          <div className="field-label-row"><label className="field-label" htmlFor="destination">想去哪里？</label><button type="button" className={pickerOpen ? 'map-pick-toggle active' : 'map-pick-toggle'} onClick={() => setPickerOpen((value) => !value)}><Map size={14} /> {pickerOpen ? '收起地图' : '地图选点'}</button></div>
          <div className="new-trip-destination"><MapPinned size={17} /><input id="destination" value={destination} onChange={(event) => { setDestination(event.target.value); setPlaceMatch(null); setPosition(null); setPlaceError(''); setPlaceLoading(false); lookupSequence.current += 1; if (lookupTimer.current !== null) window.clearTimeout(lookupTimer.current) }} placeholder={position ? '正在匹配地图选点…' : '例如：清迈、冰岛南岸、成都'} autoFocus /></div>
          {pickerOpen && <DestinationMapPicker position={position} onPick={handleMapPick} status={placeLoading ? '正在识别地点…' : placeMatch?.displayName ?? (placeError || undefined)} />}
          {pickerOpen && position && <p className={placeError ? 'place-match error' : 'place-match'}>{placeError ? `识别失败：${placeError}，仍可按坐标生成。` : placeLoading ? '正在确认该坐标所属的城市与区域…' : placeMatch ? `已匹配 ${placeMatch.displayName} · 地点数据来自 OpenStreetMap` : '已记录地图坐标'}</p>}

          <div className="new-trip-grid">
            <label><span className="field-label">出发日期</span><div className="new-trip-control"><CalendarDays size={16} /><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div></label>
            <label><span className="field-label">旅行时长</span><div className="new-trip-control duration-control"><input aria-label="天数" type="number" min="1" max="30" value={days} onChange={(event) => { const next = Math.max(1, Math.min(30, Number(event.target.value) || 1)); setDays(next); setNights(Math.max(0, next - 1)) }} /><span>天</span><input aria-label="晚数" type="number" min="0" max="30" value={nights} onChange={(event) => setNights(Math.max(0, Math.min(30, Number(event.target.value) || 0)))} /><span>晚</span></div></label>
          </div>

          <label className="field-label" htmlFor="pace">喜欢的节奏</label>
          <select id="pace" value={pace} onChange={(event) => setPace(event.target.value)}>
            <option>轻松留白</option>
            <option>松弛适中</option>
            <option>充实探索</option>
          </select>

          <label className="field-label" htmlFor="interests">兴趣与特别要求</label>
          <textarea id="interests" value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="例如：喜欢建筑和咖啡店，少走路，不安排购物…" rows={4} />

          {error && <p className="form-message error">{error}</p>}
          <button className="primary-button create-trip-button" type="submit" disabled={busy || placeLoading || (!destination.trim() && !position)}>{busy || placeLoading ? <span className="button-loader small" /> : <Sparkles size={17} />} {busy ? '正在规划全新行程…' : placeLoading ? '正在确认所选地点…' : position ? '根据所选地点推荐行程' : '生成全新行程'}</button>
          <p className="new-trip-note">生成成功后会替换当前展示，并自动保存到本机。</p>
        </form>
      </motion.section>
    </motion.div>
  )
}
