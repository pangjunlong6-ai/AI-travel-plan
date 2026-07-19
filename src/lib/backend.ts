import { invoke } from '@tauri-apps/api/core'
import { sampleTrip } from '../data/sampleTrip'
import { parseTrip, type Trip } from '../types/trip'

export const isTauri = '__TAURI_INTERNALS__' in window

export type WeatherSnapshot = {
  temperature: number
  weatherCode: number
  observedAt: string
}

export type PlaceMatch = {
  name: string
  displayName: string
  lat: number
  lng: number
}

type NominatimPayload = {
  display_name?: string
  lat?: string
  lon?: string
  address?: Record<string, string | undefined>
}

function placeFromNominatim(payload: NominatimPayload, lat: number, lng: number): PlaceMatch {
  const address = payload.address ?? {}
  const chineseCity = address.country_code === 'cn'
    ? payload.display_name?.split(',').map((part) => part.trim()).filter((part) => /(?:市|自治州|地区|盟)$/.test(part)).at(-1)
    : undefined
  const locality = chineseCity ?? address.city ?? address.town ?? address.village ?? address.municipality ?? address.county ?? address.state
  const name = locality ?? payload.display_name?.split(',')[0]?.trim()
  if (!name) throw new Error('未识别到该坐标对应的地点')
  const parts = [name, address.state, address.country].filter((part, index, values): part is string => Boolean(part) && values.indexOf(part) === index)
  return {
    name,
    displayName: parts.join(' · ') || payload.display_name || name,
    lat: Number(payload.lat) || lat,
    lng: Number(payload.lon) || lng,
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<PlaceMatch> {
  if (!isTauri) {
    const query = new URLSearchParams({
      format: 'jsonv2',
      lat: String(lat),
      lon: String(lng),
      zoom: '10',
      addressdetails: '1',
      layer: 'address',
      'accept-language': 'zh-CN,zh',
    })
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`)
    if (!response.ok) throw new Error('地点识别服务暂不可用')
    return placeFromNominatim(await response.json() as NominatimPayload, lat, lng)
  }
  return invoke<PlaceMatch>('reverse_geocode', { lat, lng })
}

function assertTripMatchesMapPoint(trip: Trip, prompt: string): Trip {
  const coordinate = prompt.match(/WGS-84.*?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  if (!coordinate) return trip
  const selected = { lat: Number(coordinate[1]), lng: Number(coordinate[2]) }
  const toRadians = (value: number) => value * Math.PI / 180
  const distanceKm = (lat: number, lng: number) => {
    const latDelta = toRadians(lat - selected.lat)
    const lngDelta = toRadians(lng - selected.lng)
    const a = Math.sin(latDelta / 2) ** 2 + Math.cos(toRadians(selected.lat)) * Math.cos(toRadians(lat)) * Math.sin(lngDelta / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
  const stops = trip.days.flatMap((day) => day.slots)
  const nearbyStops = stops.filter((stop) => distanceKm(stop.lat, stop.lng) <= 500)
  if (stops.length > 0 && nearbyStops.length < Math.ceil(stops.length / 2)) {
    throw new Error('AI 返回的地点与地图选点不对应，已阻止覆盖当前行程，请重新生成。')
  }
  return trip
}

export async function testApiKey(apiKey: string, model: string): Promise<string> {
  if (!isTauri) {
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    if (apiKey.trim().length < 16) throw new Error('API Key 格式不正确')
    return 'OK（浏览器预览）'
  }
  return invoke<string>('test_api_key', { apiKey, model })
}

export async function getCurrentWeather(lat: number, lng: number): Promise<WeatherSnapshot> {
  if (!isTauri) {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&timezone=auto`)
    if (!response.ok) throw new Error('天气服务暂不可用')
    const payload = await response.json() as { current: { temperature_2m: number; weather_code: number; time: string } }
    return { temperature: payload.current.temperature_2m, weatherCode: payload.current.weather_code, observedAt: payload.current.time }
  }
  return invoke<WeatherSnapshot>('get_current_weather', { lat, lng })
}

export async function recheckTripCoordinates(trip: Trip): Promise<Trip> {
  if (!isTauri) return trip
  const raw = await invoke<string>('recheck_trip_coordinates', { tripJson: JSON.stringify(trip) })
  return parseTrip(JSON.parse(raw))
}

export async function generateTrip(
  prompt: string,
  model: string,
  apiKey: string,
  currentTrip?: Trip,
): Promise<Trip> {
  if (!isTauri) {
    await new Promise((resolve) => window.setTimeout(resolve, 1400))
    const destination = prompt.match(/^目的地：(.+)$/m)?.[1]?.trim() || '地图选点'
    const coordinate = prompt.match(/WGS-84.*?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
    if (!coordinate) return { ...sampleTrip, destination, title: `${destination} 5 日自由行`, summary: `预览修改：${prompt.slice(0, 42)}` }
    const selected = { lat: Number(coordinate[1]), lng: Number(coordinate[2]) }
    const origin = sampleTrip.days[0].slots[0]
    const delta = { lat: selected.lat - origin.lat, lng: selected.lng - origin.lng }
    return parseTrip({
      ...sampleTrip,
      title: `${destination} 5 日自由行`,
      destination,
      summary: `以地图选点为中心生成的浏览器预览行程。`,
      days: sampleTrip.days.map((day, dayIndex) => ({
        ...day,
        theme: `${destination}周边 · 自由探索`,
        slots: day.slots.map((slot, slotIndex) => ({
          ...slot,
          name: `${destination}周边地点 ${dayIndex * 3 + slotIndex + 1}`,
          lat: Math.max(-90, Math.min(90, slot.lat + delta.lat)),
          lng: ((slot.lng + delta.lng + 540) % 360) - 180,
          review: '浏览器预览占位地点；桌面 App 会由 AI 生成真实地点。',
        })),
        dining: day.dining.map((dining) => ({ ...dining, place: `${destination}当地餐饮` })),
      })),
    })
  }
  const raw = await invoke<string>('generate_trip', {
    input: {
      prompt,
      model,
      apiKey,
      currentTripJson: currentTrip ? JSON.stringify(currentTrip) : null,
    },
  })
  return assertTripMatchesMapPoint(parseTrip(JSON.parse(raw)), prompt)
}
