import { z } from 'zod'

const transportSchema = z.object({
  mode: z.string(),
  fare: z.string().optional(),
  duration: z.string().optional(),
})

const slotSchema = z.object({
  period: z.enum(['morning', 'noon', 'evening']),
  name: z.string(),
  time: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  review: z.string().default(''),
  openingHours: z.string().optional(),
  ticketPrice: z.string().optional(),
  needsBooking: z.boolean().default(false),
  leadDays: z.number().default(0),
  transport: transportSchema.optional(),
})

const diningSchema = z.object({
  meal: z.string(),
  place: z.string(),
  hours: z.string().default('请出发前核实'),
  dishes: z.array(z.object({ name: z.string(), price: z.string() })).default([]),
})

const daySchema = z.object({
  date: z.string(),
  weekday: z.string(),
  theme: z.string().default('自由探索'),
  slots: z.array(slotSchema).min(1),
  dining: z.array(diningSchema).default([]),
  tips: z.array(z.string()).default([]),
})

export const tripSchema = z.object({
  title: z.string(),
  startDate: z.string(),
  destination: z.string().default('目的地'),
  summary: z.string().default('一段值得期待的旅程'),
  preTrip: z.object({
    weather: z.string().default('请在出发前核实天气'),
    packing: z.string().default('按天气准备衣物'),
    payment: z.string().default('准备常用支付方式'),
    apps: z.array(z.string()).default([]),
    ticketTip: z.string().default('热门项目请提前确认预约'),
  }),
  reminders: z.array(z.object({ item: z.string(), leadDays: z.number() })).default([]),
  tips: z.array(z.string()).default([]),
  days: z.array(daySchema).min(1),
  disclaimer: z.string(),
})

export type Trip = z.infer<typeof tripSchema>
export type TripDay = Trip['days'][number]
export type TripSlot = TripDay['slots'][number]

export function parseTrip(value: unknown): Trip {
  return tripSchema.parse(value)
}
