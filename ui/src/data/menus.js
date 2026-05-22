export const DEFAULT_OPTIONS = [
  { id: 'extra-shot', name: '샷 추가', extraPrice: 500 },
  { id: 'extra-syrup', name: '시럽 추가', extraPrice: 0 },
]

export const MENUS = [
  {
    id: 'americano-ice',
    name: '아메리카노(ICE)',
    basePrice: 4000,
    description: '시원하고 깔끔한 아이스 아메리카노',
    imageUrl: '/images/americano-ice.png',
    options: DEFAULT_OPTIONS,
  },
  {
    id: 'americano-hot',
    name: '아메리카노(HOT)',
    basePrice: 4000,
    description: '진한 에스프레소의 깊은 맛',
    imageUrl: '/images/americano-hot.png',
    options: DEFAULT_OPTIONS,
  },
  {
    id: 'cafe-latte',
    name: '카페라떼',
    basePrice: 5000,
    description: '부드러운 우유와 에스프레소의 조화',
    imageUrl: '/images/cafe-latte.png',
    options: DEFAULT_OPTIONS,
  },
  {
    id: 'cappuccino',
    name: '카푸치노',
    basePrice: 5000,
    description: '풍부한 우유 거품이 올라간 커피',
    imageUrl: '/images/cappuccino.png',
    options: DEFAULT_OPTIONS,
  },
  {
    id: 'vanilla-latte',
    name: '바닐라라떼',
    basePrice: 5500,
    description: '달콤한 바닐라 시럽이 들어간 라떼',
    imageUrl: '/images/vanilla-latte.png',
    options: DEFAULT_OPTIONS,
  },
  {
    id: 'caramel-macchiato',
    name: '카라멜 마키아토',
    basePrice: 6000,
    description: '카라멜 드리즐과 에스프레소의 달콤함',
    imageUrl: '/images/caramel-macchiato.png',
    options: DEFAULT_OPTIONS,
  },
]
