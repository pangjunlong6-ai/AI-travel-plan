import { forwardRef, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, ArrowUp, Bot, CheckCircle2, CloudSun, Sparkles, TicketCheck, WandSparkles } from 'lucide-react'
import type { Trip } from '../types/trip'
import { SpotlightSurface } from './SpotlightSurface'

type AssistantPanelProps = {
  trip: Trip
  busy: boolean
  error: string
  onGenerate: (prompt: string) => Promise<void>
  draftRequest?: { id: number; text: string }
}

export const AssistantPanel = forwardRef<HTMLTextAreaElement, AssistantPanelProps>(function AssistantPanel(
  { trip, busy, error, onGenerate, draftRequest },
  ref,
) {
  const [tab, setTab] = useState<'ai' | 'prepare'>('ai')
  const [prompt, setPrompt] = useState('')
  const quickPrompts = ['第三天下午换成室内活动', '减少每天步行距离', '增加两家当地餐厅']
  const sortedReminders = useMemo(() => [...trip.reminders].sort((a, b) => b.leadDays - a.leadDays), [trip.reminders])

  useEffect(() => {
    if (!draftRequest) return
    setTab('ai')
    setPrompt(draftRequest.text)
    window.requestAnimationFrame(() => {
      if (typeof ref === 'function') return
      ref?.current?.focus()
      ref?.current?.setSelectionRange(draftRequest.text.length, draftRequest.text.length)
    })
  }, [draftRequest, ref])

  async function submit() {
    if (!prompt.trim() || busy) return
    await onGenerate(prompt.trim())
    setPrompt('')
  }

  return (
    <aside className="assistant-panel">
      <div className="assistant-tabs" role="tablist">
        <button type="button" className={tab === 'ai' ? 'active' : ''} onClick={() => setTab('ai')}><Bot size={15} /> AI 助手</button>
        <button type="button" className={tab === 'prepare' ? 'active' : ''} onClick={() => setTab('prepare')}><TicketCheck size={15} /> 行前</button>
      </div>

      {tab === 'ai' ? (
        <div className="assistant-body">
          <div className="assistant-intro">
            <span className="assistant-avatar"><Sparkles size={18} /></span>
            <div><strong>想怎么调整？</strong><p>描述修改，我会返回完整行程供你确认。</p></div>
          </div>

          <div className="quick-prompts">
            {quickPrompts.map((item) => <button type="button" key={item} onClick={() => setPrompt(item)}>{item}</button>)}
          </div>

          <SpotlightSurface className={`prompt-box ${error ? 'has-error' : ''}`}>
            <textarea
              ref={ref}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="例如：把第三天下午改成室内活动，并减少步行…"
              rows={4}
              disabled={busy}
            />
            <div className="prompt-footer">
              <span><WandSparkles size={13} /> 修改当前行程</span>
              <button type="button" onClick={submit} disabled={!prompt.trim() || busy} aria-label="发送给 AI">
                {busy ? <span className="button-loader small" /> : <ArrowUp size={17} />}
              </button>
            </div>
          </SpotlightSurface>

          <AnimatePresence mode="wait">
            {busy && (
              <motion.div className="ai-progress" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <span className="orbit-loader"><span /></span>
                <div><strong>正在重排行程</strong><p>检查路线、时段与缓冲时间…</p></div>
              </motion.div>
            )}
            {error && !busy && (
              <motion.div className="assistant-error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <AlertCircle size={16} /><span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="source-status">
            <CheckCircle2 size={15} />
            <div><strong>结构校验已启用</strong><span>日期、坐标与必填字段会在应用修改前检查。</span></div>
          </div>
        </div>
      ) : (
        <div className="prepare-body">
          <section>
            <span className="soft-label"><TicketCheck size={13} /> 提前处理</span>
            <div className="reminder-list">
              {sortedReminders.map((reminder) => (
                <div key={reminder.item}><span>{reminder.leadDays}</span><p><strong>{reminder.item}</strong><small>建议提前 {reminder.leadDays} 天</small></p></div>
              ))}
            </div>
          </section>
          <section className="weather-brief">
            <span className="soft-label"><CloudSun size={13} /> 天气与穿搭</span>
            <p>{trip.preTrip.weather}</p>
            <small>{trip.preTrip.packing}</small>
          </section>
          <section>
            <span className="soft-label">必备 App</span>
            <div className="app-chips">{trip.preTrip.apps.map((app) => <span key={app}>{app}</span>)}</div>
          </section>
        </div>
      )}
    </aside>
  )
})
