import { motion } from 'motion/react'
import { Bot, CalendarPlus, LocateFixed, Route } from 'lucide-react'

type ActionDockProps = {
  onLocateRoute: () => void
  onAdjustRoute: () => void
  onAddPlan: () => void
  onAskAi: () => void
}

export function ActionDock({ onLocateRoute, onAdjustRoute, onAddPlan, onAskAi }: ActionDockProps) {
  const items = [
    { label: '定位路线', icon: <LocateFixed size={18} />, onClick: onLocateRoute },
    { label: '调整路线', icon: <Route size={18} />, onClick: onAdjustRoute },
    { label: '增加安排', icon: <CalendarPlus size={18} />, onClick: onAddPlan },
    { label: '问问 AI', icon: <Bot size={18} />, onClick: onAskAi },
  ]

  return (
    <div className="action-dock" role="toolbar" aria-label="地图快捷操作">
      {items.map((item) => (
        <motion.button
          key={item.label}
          type="button"
          aria-label={item.label}
          onClick={item.onClick}
          whileHover={{ y: -5, scale: 1.12 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          {item.icon}
          <span>{item.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
