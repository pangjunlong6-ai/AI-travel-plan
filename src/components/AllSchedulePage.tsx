import { CalendarDays, Clock3, MapPin, Navigation2, TicketCheck } from 'lucide-react'
import type { Trip } from '../types/trip'

export function AllSchedulePage({ trip, onOpenMap }: { trip: Trip; onOpenMap: (day: number) => void }) {
  return (
    <section className="detail-page" aria-labelledby="schedule-title">
      <header className="detail-page-heading">
        <div><span className="soft-label"><CalendarDays size={13} /> 完整安排</span><h2 id="schedule-title">全部日程</h2><p>{trip.days.length} 天 · {trip.summary}</p></div>
        <span className="detail-count">{trip.days.reduce((total, day) => total + day.slots.length, 0)} 个停靠点</span>
      </header>
      <div className="schedule-list">
        {trip.days.map((day, dayIndex) => (
          <article className="schedule-day-card" key={day.date}>
            <button className="schedule-day-heading" type="button" onClick={() => onOpenMap(dayIndex)}>
              <span className="day-number">{String(dayIndex + 1).padStart(2, '0')}</span>
              <div><strong>第 {dayIndex + 1} 天 · {day.weekday}</strong><small>{day.date} · {day.theme}</small></div>
              <span className="view-on-map"><Navigation2 size={13} /> 地图查看</span>
            </button>
            <div className="schedule-slots">
              {day.slots.map((slot) => (
                <div key={`${day.date}-${slot.name}`}>
                  <span className={`period-dot ${slot.period}`} />
                  <time><Clock3 size={12} /> {slot.time}</time>
                  <p><strong>{slot.name}</strong><small><MapPin size={11} /> {slot.transport?.mode ?? '自由前往'} · {slot.transport?.duration ?? '时间待核实'}</small></p>
                  {slot.needsBooking && <em><TicketCheck size={11} /> 需预约</em>}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
