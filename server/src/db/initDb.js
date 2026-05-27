import { query } from '../config/database.js'

const seedMenus = [
  {
    id: 'americano-ice',
    name: '아메리카노(ICE)',
    description: '시원하고 깔끔한 아이스 아메리카노',
    price: 4000,
    imageUrl: '/images/americano-ice.jpg',
    stockQuantity: 10,
  },
  {
    id: 'americano-hot',
    name: '아메리카노(HOT)',
    description: '진한 에스프레소의 깊은 맛',
    price: 4000,
    imageUrl: '/images/americano-hot.jpg',
    stockQuantity: 10,
  },
  {
    id: 'cafe-latte',
    name: '카페라떼',
    description: '부드러운 우유와 에스프레소의 조화',
    price: 5000,
    imageUrl: '/images/caffe-latte.jpg',
    stockQuantity: 10,
  },
  {
    id: 'cappuccino',
    name: '카푸치노',
    description: '풍부한 우유 거품이 올라간 커피',
    price: 5000,
    imageUrl: '/images/cappuccino.png',
    stockQuantity: 10,
  },
  {
    id: 'vanilla-latte',
    name: '바닐라라떼',
    description: '달콤한 바닐라 시럽이 들어간 라떼',
    price: 5500,
    imageUrl: '/images/vanilla-latte.png',
    stockQuantity: 10,
  },
  {
    id: 'caramel-macchiato',
    name: '카라멜 마키아토',
    description: '카라멜 드리즐과 에스프레소의 달콤함',
    price: 6000,
    imageUrl: '/images/caramel-macchiato.png',
    stockQuantity: 10,
  },
]

const seedOptions = [
  { id: 'extra-shot', name: '샷 추가', extraPrice: 500 },
  { id: 'extra-syrup', name: '시럽 추가', extraPrice: 0 },
]

export async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS menus (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      image_url TEXT,
      stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS options (
      id TEXT NOT NULL,
      menu_id TEXT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      extra_price INTEGER NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (id, menu_id)
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'IN_PREPARATION', 'COMPLETED')),
      total_amount INTEGER NOT NULL CHECK (total_amount >= 0)
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_id TEXT NOT NULL REFERENCES menus(id),
      menu_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
      line_total INTEGER NOT NULL CHECK (line_total >= 0)
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS order_item_options (
      id BIGSERIAL PRIMARY KEY,
      order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      option_id TEXT NOT NULL,
      option_name TEXT NOT NULL,
      extra_price INTEGER NOT NULL DEFAULT 0 CHECK (extra_price >= 0)
    );
  `)

  await query(`CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON orders(ordered_at DESC);`)
  await query(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`)
  await query(`CREATE INDEX IF NOT EXISTS idx_options_menu_id ON options(menu_id);`)

  for (const menu of seedMenus) {
    await query(
      `
      INSERT INTO menus (id, name, description, price, image_url, stock_quantity)
      VALUES ($1, $2, $3, $4, $5, COALESCE((SELECT stock_quantity FROM menus WHERE id = $1), $6))
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        image_url = EXCLUDED.image_url,
        updated_at = NOW();
      `,
      [
        menu.id,
        menu.name,
        menu.description,
        menu.price,
        menu.imageUrl,
        menu.stockQuantity,
      ],
    )

    for (const option of seedOptions) {
      await query(
        `
        INSERT INTO options (id, menu_id, name, extra_price)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id, menu_id)
        DO UPDATE SET
          name = EXCLUDED.name,
          extra_price = EXCLUDED.extra_price;
        `,
        [option.id, menu.id, option.name, option.extraPrice],
      )
    }
  }
}

