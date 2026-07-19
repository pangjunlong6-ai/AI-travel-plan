import type { Trip } from '../types/trip'

export const sampleTrip: Trip = {
  title: '东京 5 日自由行',
  startDate: '2026-09-18',
  destination: '东京',
  summary: '从江户街巷到当代城市，在晴朗秋日里慢慢走完东京的不同表情。',
  preTrip: {
    weather: '9 月仍可能闷热多雨，出发前 3 天请以日本气象厅预报为准。',
    packing: '轻薄外套、舒适步行鞋、折叠伞和可重复使用水瓶。',
    payment: '交通 IC 卡最方便，小店和寺社建议准备少量日元现金。',
    apps: ['Google Maps', 'Japan Travel', '日本气象厅'],
    ticketTip: '热门展览与 teamLab 建议提前 7 天确认预约。',
  },
  reminders: [
    { item: '确认 teamLab 入场时段', leadDays: 7 },
    { item: '开通境外流量或 eSIM', leadDays: 3 },
    { item: '核对机场到酒店路线', leadDays: 2 },
  ],
  tips: [
    '每天保留至少 45 分钟机动时间。',
    '繁忙车站优先按线路颜色和编号寻找站台。',
  ],
  days: [
    {
      date: '2026-09-18',
      weekday: '周五',
      theme: '浅草初见 · 江户风景',
      slots: [
        { period: 'morning', name: '浅草寺', time: '09:00–11:00', lat: 35.7148, lng: 139.7967, review: '趁人流尚少，从雷门一路走到本堂。', needsBooking: false, leadDays: 0, transport: { mode: '银座线', fare: '约 ¥180', duration: '约 20 分钟' } },
        { period: 'noon', name: '上野公园', time: '13:00–16:00', lat: 35.7148, lng: 139.7734, review: '博物馆与林荫步道组合，午后节奏舒适。', needsBooking: false, leadDays: 0, transport: { mode: '银座线', fare: '约 ¥180', duration: '约 12 分钟' } },
        { period: 'evening', name: '东京晴空塔', time: '18:00–20:30', lat: 35.7101, lng: 139.8107, review: '在天色变化时登塔，城市灯光最有层次。', needsBooking: true, leadDays: 3, transport: { mode: '浅草线', fare: '约 ¥180', duration: '约 15 分钟' } },
      ],
      dining: [{ meal: '午餐', place: '上野附近荞麦面', hours: '请出发前核实', dishes: [{ name: '天妇罗荞麦面', price: '约 ¥1,400' }] }],
      tips: ['浅草寺适合尽早到达，晴空塔时段需再次核实。'],
    },
    {
      date: '2026-09-19', weekday: '周六', theme: '原宿绿意 · 涩谷夜色',
      slots: [
        { period: 'morning', name: '明治神宫', time: '08:30–10:30', lat: 35.6764, lng: 139.6993, review: '清晨的参道安静而凉爽。', needsBooking: false, leadDays: 0, transport: { mode: '山手线', duration: '约 25 分钟' } },
        { period: 'noon', name: '代官山', time: '12:00–15:30', lat: 35.648, lng: 139.703, review: '书店、咖啡与街区散步，适合放慢节奏。', needsBooking: false, leadDays: 0, transport: { mode: '东横线', duration: '约 18 分钟' } },
        { period: 'evening', name: '涩谷 Sky', time: '17:30–20:00', lat: 35.6585, lng: 139.7013, review: '日落前入场，从天光看到城市夜景。', needsBooking: true, leadDays: 7, transport: { mode: '步行', duration: '约 20 分钟' } },
      ], dining: [{ meal: '晚餐', place: '涩谷横丁', hours: '请出发前核实', dishes: [{ name: '日式串烧', price: '约 ¥2,000' }] }], tips: ['周六人流较大，晚间观景台请预留排队时间。'],
    },
    {
      date: '2026-09-20', weekday: '周日', theme: '市场风味 · 艺术与银座',
      slots: [
        { period: 'morning', name: '筑地场外市场', time: '08:00–10:30', lat: 35.6655, lng: 139.7707, review: '早到才能从容吃早餐并避开午前高峰。', needsBooking: false, leadDays: 0, transport: { mode: '大江户线', duration: '约 25 分钟' } },
        { period: 'noon', name: '麻布台之丘', time: '12:30–15:30', lat: 35.6605, lng: 139.7405, review: '室内艺术与街区建筑适合作为午后主场。', needsBooking: true, leadDays: 7, transport: { mode: '日比谷线', duration: '约 20 分钟' } },
        { period: 'evening', name: '银座', time: '17:00–20:00', lat: 35.6717, lng: 139.765, review: '在步行街与百货屋顶收尾，移动轻松。', needsBooking: false, leadDays: 0, transport: { mode: '日比谷线', duration: '约 15 分钟' } },
      ], dining: [{ meal: '早餐', place: '筑地市场', hours: '各店不同', dishes: [{ name: '海鲜盖饭', price: '约 ¥2,500' }] }], tips: ['市场店铺休息日不同，务必逐店核实。'],
    },
    {
      date: '2026-09-21', weekday: '周一', theme: '吉祥寺 · 湖畔慢行',
      slots: [
        { period: 'morning', name: '三鹰之森美术馆', time: '10:00–12:00', lat: 35.6962, lng: 139.5704, review: '小体量但细节丰富，需严格按预约时段入场。', needsBooking: true, leadDays: 30, transport: { mode: '中央线＋巴士', duration: '约 45 分钟' } },
        { period: 'noon', name: '井之头公园', time: '13:00–15:00', lat: 35.7, lng: 139.574, review: '湖边散步连接美术馆与吉祥寺。', needsBooking: false, leadDays: 0, transport: { mode: '步行', duration: '约 15 分钟' } },
        { period: 'evening', name: '吉祥寺商店街', time: '16:00–19:00', lat: 35.7032, lng: 139.5798, review: '在小店与居酒屋间自由探索。', needsBooking: false, leadDays: 0, transport: { mode: '步行', duration: '约 10 分钟' } },
      ], dining: [{ meal: '晚餐', place: '吉祥寺 Harmonica 横丁', hours: '请出发前核实', dishes: [{ name: '小料理组合', price: '约 ¥2,500' }] }], tips: ['美术馆票务规则严格，需优先处理。'],
    },
    {
      date: '2026-09-22', weekday: '周二', theme: '东京站 · 从容返程',
      slots: [
        { period: 'morning', name: '皇居外苑', time: '08:30–10:00', lat: 35.6807, lng: 139.7581, review: '返程日前安排轻量户外散步。', needsBooking: false, leadDays: 0, transport: { mode: '地铁', duration: '约 20 分钟' } },
        { period: 'noon', name: '东京站丸之内', time: '10:30–13:30', lat: 35.6812, lng: 139.7671, review: '建筑、午餐和伴手礼一次完成。', needsBooking: false, leadDays: 0, transport: { mode: '步行', duration: '约 12 分钟' } },
        { period: 'evening', name: '前往机场', time: '15:00–17:00', lat: 35.772, lng: 140.3929, review: '按航班时间倒推并保留充足值机缓冲。', needsBooking: true, leadDays: 2, transport: { mode: '机场快线', duration: '约 60 分钟' } },
      ], dining: [{ meal: '午餐', place: '东京站一番街', hours: '请出发前核实', dishes: [{ name: '拉面或定食', price: '约 ¥1,500' }] }], tips: ['机场交通与航班时间需在前一晚再次核对。'],
    },
  ],
  disclaimer: '所有天气、交通、价格、营业时间和地点信息均为 AI 基于公开资料与常识整理的参考，可能不准确或过时；请在官方渠道和地图 App 核实后再决定。',
}
