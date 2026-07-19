import { CalendarDays, ChevronRight, MapPinned, PlaneTakeoff, Plus, Sparkles } from 'lucide-react'
import type { Trip } from '../types/trip'

export function MyTripsPage({ trip, onOpen, onNewTrip }: { trip: Trip; onOpen: () => void; onNewTrip: () => void }) {
  return (
    <section className="detail-page" aria-labelledby="trips-title">
      <header className="detail-page-heading">
        <div><span className="soft-label"><PlaneTakeoff size={13} /> 本地收藏</span><h2 id="trips-title">我的行程</h2><p>行程保存在这台 Mac 上，打开应用即可继续查看和调整。</p></div>
        <button className="primary-button" type="button" onClick={onNewTrip}><Plus size={16} /> 新建行程</button>
      </header>
      <div className="my-trips-grid">
        <button className="saved-trip-card" type="button" onClick={onOpen}>
          <span className="saved-trip-art"><MapPinned size={32} /><i /><i /></span>
          <span className="saved-trip-copy"><small>当前行程 · 本地已保存</small><strong>{trip.title}</strong><span>{trip.summary}</span><em><CalendarDays size={13} /> {trip.startDate} · {trip.days.length} 天</em></span>
          <ChevronRight size={20} />
        </button>
        <button className="empty-trip-card" type="button" onClick={onNewTrip}><span><Sparkles size={23} /></span><strong>下一段旅程去哪里？</strong><small>告诉 AI 目的地、日期和旅行偏好</small></button>
      </div>
    </section>
  )
}
