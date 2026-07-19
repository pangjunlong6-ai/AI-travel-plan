import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { testApiKey } from '../lib/backend'
import { SpotlightSurface } from './SpotlightSurface'

type OnboardingProps = {
  model: string
  onModelChange: (model: string) => void
  onComplete: (apiKey: string) => void
  onPreview: () => void
}

export function Onboarding({ model, onModelChange, onComplete, onPreview }: OnboardingProps) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [busy, setBusy] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')

  async function connect() {
    setBusy(true)
    setError('')
    setVerified(false)
    try {
      await testApiKey(apiKey, model)
      setVerified(true)
      window.setTimeout(() => onComplete(apiKey.trim()), 550)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="onboarding-shell">
      <section className="onboarding-visual" aria-label="产品预览">
        <div className="brand-lockup">
          <span className="brand-mark"><MapPinned size={21} /></span>
          <span>行程绘</span>
        </div>

        <div className="visual-copy">
          <span className="soft-label"><Sparkles size={14} /> AI 旅行工作台</span>
          <h1>把想去的地方，<br />连成一条自由的路。</h1>
          <p>从一句想法开始，生成可继续修改的每日路线、地图与出发前提醒。</p>
        </div>

        <div className="route-art" aria-hidden="true">
          <svg viewBox="0 0 720 340" role="presentation">
            <defs>
              <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path className="contour contour-a" d="M-30 280C120 190 170 310 315 210S550 90 760 125" />
            <path className="contour contour-b" d="M-10 320C150 230 220 340 360 245S590 115 745 160" />
            <motion.path
              className="travel-path"
              d="M42 286C145 255 140 174 245 190S350 276 430 186S560 72 678 86"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
            />
            {[
              [42, 286, 'cyan'], [245, 190, 'cyan'], [430, 186, 'cyan'], [678, 86, 'coral'],
            ].map(([cx, cy, tone], index) => (
              <motion.g key={String(cx)} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.45 + index * 0.28 }}>
                <circle className={`waypoint-halo ${tone}`} cx={Number(cx)} cy={Number(cy)} r="17" />
                <circle className={`waypoint ${tone}`} cx={Number(cx)} cy={Number(cy)} r="7" filter="url(#routeGlow)" />
              </motion.g>
            ))}
          </svg>
          <div className="route-place route-place-a"><span>01</span><strong>浅草</strong><small>09:00</small></div>
          <div className="route-place route-place-b"><span>02</span><strong>上野</strong><small>13:00</small></div>
          <div className="route-place route-place-c"><span>03</span><strong>晴空塔</strong><small>18:00</small></div>
        </div>
      </section>

      <section className="onboarding-form-wrap">
        <SpotlightSurface className="connection-panel">
          <div className="form-heading">
            <span className="form-icon"><KeyRound size={21} /></span>
            <div>
              <h2>连接 DeepSeek</h2>
              <p>密钥仅用于当前运行，关闭应用后自动清除。</p>
            </div>
          </div>

          <div className="security-note">
            <ShieldCheck size={18} />
            <span><strong>仅限当前会话</strong>　不会写入系统钥匙串、行程文件或应用日志。</span>
          </div>

          <label className="field-label" htmlFor="api-key">DeepSeek API Key</label>
          <div className={`key-field ${error ? 'has-error' : ''}`}>
            <LockKeyhole size={17} />
            <input
              id="api-key"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              type={showKey ? 'text' : 'password'}
              placeholder="sk-••••••••••••••••"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="button" className="icon-button" onClick={() => setShowKey((value) => !value)} aria-label={showKey ? '隐藏 API Key' : '显示 API Key'}>
              {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          <div className="field-row">
            <div>
              <label className="field-label" htmlFor="model">默认模型</label>
              <select id="model" value={model} onChange={(event) => onModelChange(event.target.value)}>
                <option value="deepseek-chat">deepseek-chat</option>
                <option value="deepseek-reasoner">deepseek-reasoner</option>
              </select>
            </div>
            <p>之后可以在设置中修改</p>
          </div>

          <AnimatePresence mode="wait">
            {error && <motion.p className="form-message error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert">{error}</motion.p>}
            {verified && <motion.p className="form-message success" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}><Check size={15} /> 连接成功，正在进入工作台</motion.p>}
          </AnimatePresence>

          <button className="primary-button connect-button" type="button" onClick={connect} disabled={busy || apiKey.trim().length < 16}>
            {busy ? <span className="button-loader" /> : verified ? <Check size={18} /> : <Sparkles size={18} />}
            {busy ? '正在验证…' : verified ? '连接成功' : '测试并进入'}
            {!busy && !verified && <ArrowRight size={17} />}
          </button>

          <button type="button" className="text-button preview-button" onClick={onPreview}>稍后设置，先查看示例行程</button>
          <p className="form-footnote">请先撤销曾在聊天中发送过的旧 Key，再在这里填写新 Key。</p>
        </SpotlightSurface>
      </section>
    </main>
  )
}
