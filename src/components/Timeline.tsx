import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, Clock3, TicketCheck, TrainFront, Utensils } from 'lucide-react'
import type { TripDay } from '../types/trip'

type TimelineProps = {
  day: TripDay
  selectedSlot: number
  onSelectSlot: (index: number) => void
}

const periodLabels = { morning: '上午', noon: '午后', evening: '晚上' }

export function Timeline({ day, selectedSlot, onSelectSlot }: TimelineProps) {
  return (
    <section className="timeline-panel" aria-label="每日时间轴">
      <div className="section-heading compact">
        <div>
          <span className="soft-label"><CalendarClock size={13} /> 每日时间轴</span>
          <h2>{day.weekday} · {day.date.slice(5).replace('-', ' / ')}</h2>
        </div>
        {day.dining[0] && <span className="meal-note"><Utensils size={14} /> {day.dining[0].place}</span>}
      </div>

      <div className="timeline-track">
        <div className="route-rail" aria-hidden="true" />
        {day.slots.map((slot, index) => {
          const active = selectedSlot === index
          return (
            <motion.button
              layout
              type="button"
              key={`${day.date}-${slot.name}`}
              className={`timeline-stop ${active ? 'active' : ''}`}
              onClick={() => onSelectSlot(index)}
              whileHover={{ y: -3 }}
              whileTap={{ y: 0, scale: 0.99 }}
            >
              <span className="stop-dot"><span>{index + 1}</span></span>
              <span className="stop-period">{periodLabels[slot.period]}</span>
              <strong>{slot.name}</strong>
              <span className="stop-time"><Clock3 size={13} /> {slot.time}</span>
              <span className="stop-transport"><TrainFront size={13} /> {slot.transport?.duration ?? '时间待定'}</span>
              {slot.needsBooking && <span className="booking-badge"><TicketCheck size={13} /> 提前 {slot.leadDays} 天</span>}
              <AnimatePresence>
                {active && <motion.span className="active-wash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
