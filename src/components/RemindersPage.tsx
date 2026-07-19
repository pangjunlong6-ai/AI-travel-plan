import { Bell, CheckCircle2, CloudSun, CreditCard, Smartphone, TicketCheck } from 'lucide-react'
import type { Trip } from '../types/trip'

export function RemindersPage({ trip, completed, onToggle }: { trip: Trip; completed: Set<string>; onToggle: (item: string) => void }) {
  const reminders = [...trip.reminders].sort((a, b) => b.leadDays - a.leadDays)
  const pendingCount = reminders.filter((reminder) => !completed.has(reminder.item)).length

  return (
    <section className="detail-page" aria-labelledby="reminders-title">
      <header className="detail-page-heading">
        <div><span className="soft-label"><Bell size={13} /> 行前清单</span><h2 id="reminders-title">出发提醒</h2><p>按建议提前时间排序，完成后可逐项核对。</p></div>
        <span className={pendingCount ? 'detail-count coral' : 'detail-count'}>{pendingCount ? `${pendingCount} 项待确认` : '全部完成'}</span>
      </header>
      <div className="reminders-layout">
        <div className="reminder-page-list">
          {reminders.map((reminder) => (
            <article className={completed.has(reminder.item) ? 'completed' : ''} key={reminder.item}><span>{reminder.leadDays}<small>天前</small></span><div><strong>{reminder.item}</strong><p>{completed.has(reminder.item) ? '已完成，可再次点击取消。' : `建议至少提前 ${reminder.leadDays} 天处理，并以官方渠道信息为准。`}</p></div><button type="button" className={completed.has(reminder.item) ? 'completed' : ''} onClick={() => onToggle(reminder.item)} aria-pressed={completed.has(reminder.item)} aria-label={`${completed.has(reminder.item) ? '取消完成' : '标记完成'} ${reminder.item}`}><CheckCircle2 size={18} /></button></article>
          ))}
        </div>
        <aside className="pretrip-cards">
          <article><span><CloudSun size={17} /></span><div><strong>天气与穿搭</strong><p>{trip.preTrip.weather}</p><small>{trip.preTrip.packing}</small></div></article>
          <article><span><CreditCard size={17} /></span><div><strong>支付准备</strong><p>{trip.preTrip.payment}</p></div></article>
          <article><span><Smartphone size={17} /></span><div><strong>必备 App</strong><div className="app-chips">{trip.preTrip.apps.map((app) => <span key={app}>{app}</span>)}</div></div></article>
          <article><span><TicketCheck size={17} /></span><div><strong>购票建议</strong><p>{trip.preTrip.ticketTip}</p></div></article>
        </aside>
      </div>
    </section>
  )
}
