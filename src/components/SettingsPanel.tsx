import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Eye, EyeOff, KeyRound, ShieldCheck, Trash2, X } from 'lucide-react'
import { testApiKey } from '../lib/backend'

type SettingsPanelProps = {
  model: string
  onModelChange: (model: string) => void
  onClose: () => void
  onApiKeyChange: (apiKey: string) => void
  onKeyDeleted: () => void
}

export function SettingsPanel({ model, onModelChange, onClose, onApiKeyChange, onKeyDeleted }: SettingsPanelProps) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function replaceKey() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await testApiKey(key, model)
      onApiKeyChange(key.trim())
      setKey('')
      setMessage('新 Key 已验证，仅在当前运行期间生效')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  function removeKey() {
    onKeyDeleted()
  }

  return (
    <motion.div className="settings-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.section className="settings-panel" initial={{ x: 36, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 36, opacity: 0 }} onMouseDown={(event) => event.stopPropagation()} aria-label="设置">
        <header><div><span className="soft-label">偏好与安全</span><h2>设置</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭设置"><X size={19} /></button></header>
        <div className="settings-section">
          <label className="field-label" htmlFor="settings-model">DeepSeek 模型</label>
          <select id="settings-model" value={model} onChange={(event) => onModelChange(event.target.value)}>
            <option value="deepseek-chat">deepseek-chat</option>
            <option value="deepseek-reasoner">deepseek-reasoner</option>
          </select>
          <p>模型名称保存在本机偏好中，不属于敏感信息。</p>
        </div>
        <div className="settings-section keychain-section">
          <div className="setting-title"><span><KeyRound size={17} /></span><div><strong>替换当前会话 API Key</strong><p>不会保存到 macOS 钥匙串，关闭应用后自动清除。</p></div></div>
          <div className="key-field"><ShieldCheck size={17} /><input value={key} onChange={(event) => setKey(event.target.value)} type={show ? 'text' : 'password'} placeholder="填写新的 Key" autoComplete="off" /><button className="icon-button" type="button" onClick={() => setShow((value) => !value)} aria-label="切换显示 Key">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
          <button type="button" className="primary-button settings-save" onClick={replaceKey} disabled={busy || key.trim().length < 16}>{busy ? <span className="button-loader small" /> : <Check size={16} />} {busy ? '正在验证…' : '测试并替换'}</button>
          {message && <p className="form-message success">{message}</p>}
          {error && <p className="form-message error">{error}</p>}
        </div>
        <div className="settings-section danger-zone"><div><strong>清除当前会话</strong><p>立即清除内存中的 DeepSeek Key，并返回连接页面。</p></div><button type="button" onClick={removeKey}><Trash2 size={15} /> 清除 Key</button></div>
      </motion.section>
    </motion.div>
  )
}
