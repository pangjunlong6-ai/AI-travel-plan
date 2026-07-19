import { useEffect, useState } from 'react'
import { CloudSun, RefreshCw } from 'lucide-react'
import { getCurrentWeather, type WeatherSnapshot } from '../lib/backend'
import type { Trip } from '../types/trip'

const weatherNames: Record<number, string> = {
  0: '晴', 1: '大致晴', 2: '局部多云', 3: '阴',
  45: '有雾', 48: '雾凇', 51: '毛毛雨', 53: '毛毛雨', 55: '较强毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪',
  80: '阵雨', 81: '阵雨', 82: '强阵雨', 95: '雷雨', 96: '雷雨伴冰雹', 99: '强雷雨',
}

function formatObservedDate(value: string) {
  const [, month = '', day = ''] = value.slice(0, 10).split('-')
  return month && day ? `${Number(month)}月${Number(day)}日` : '当前'
}

export function WeatherPill({ trip }: { trip: Trip }) {
  const firstStop = trip.days[0]?.slots[0]
  const lat = firstStop?.lat
  const lng = firstStop?.lng
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (lat === undefined || lng === undefined) return
    let cancelled = false
    setLoading(true)
    setFailed(false)
    getCurrentWeather(lat, lng)
      .then((next) => { if (!cancelled) setWeather(next) })
      .catch(() => { if (!cancelled) setFailed(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [lat, lng])

  return (
    <span className="weather-pill" title="当前天气由 Open-Meteo 根据行程坐标自动更新">
      {loading ? <RefreshCw className="weather-spin" size={15} /> : <CloudSun size={16} />}
      {loading ? '获取天气…' : failed || !weather ? '天气暂不可用' : `${trip.destination} · ${formatObservedDate(weather.observedAt)} · ${Math.round(weather.temperature)}° ${weatherNames[weather.weatherCode] ?? '天气变化'}`}
    </span>
  )
}
