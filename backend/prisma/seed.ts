/**
 * Toilet.uz — Prisma seed
 * --------------------------------------------------------------------------
 * Ishga tushirish:
 *   npx prisma db push        # avval schema'ni Neon'ga yuboring
 *   npx prisma db seed        # bu skriptni ishga tushiradi
 *   npm run db:seed:reset     # to'liq tozalab qaytadan to'ldirish
 *
 * 10 ta realistik Toshkent joyi + 5 ta test user + har joyga 2-4 ta sharh.
 */

import { PrismaClient } from '@prisma/client';
import type { LocationType, PriceType } from '@/types';

const prisma = new PrismaClient();
const shouldReset = process.argv.includes('--reset');

interface SeedLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: LocationType;
  priceType: PriceType;
  priceAmount: number;
}

const TEST_USERS = [
  { email: 'aziz@example.uz',    name: 'Aziz Karimov',     image: null },
  { email: 'malika@example.uz',  name: 'Malika Yusupova',  image: null },
  { email: 'rustam@example.uz',  name: 'Rustam Saidov',    image: null },
  { email: 'dilnoza@example.uz', name: 'Dilnoza Hamidova', image: null },
  { email: 'jasur@example.uz',   name: 'Jasur Tursunov',   image: null },
];

const TASHKENT_LOCATIONS: SeedLocation[] = [
  {
    name: 'Amir Temur xiyoboni jamoat hojatxonasi',
    address: 'Amir Temur xiyoboni, Mirobod tumani, Toshkent',
    latitude: 41.3111, longitude: 69.2797,
    type: 'public', priceType: 'free', priceAmount: 0,
  },
  {
    name: 'Magic City — markaziy WC',
    address: 'Magic City hududi, Yashnobod tumani, Toshkent',
    latitude: 41.3175, longitude: 69.2419,
    type: 'mall', priceType: 'free', priceAmount: 0,
  },
  {
    name: 'Samarqand Darvoza Mall',
    address: 'Koratosh ko\'chasi 5A, Olmazor tumani, Toshkent',
    latitude: 41.3260, longitude: 69.2150,
    type: 'mall', priceType: 'paid', priceAmount: 2000,
  },
  {
    name: 'Compass Mall WC',
    address: 'Mustaqillik shoh ko\'chasi 75, Mirzo Ulug\'bek tumani, Toshkent',
    latitude: 41.3120, longitude: 69.2880,
    type: 'mall', priceType: 'free', priceAmount: 0,
  },
  {
    name: 'UzGasOil shoxobchasi #14',
    address: 'Bunyodkor shoh ko\'chasi, Chilonzor tumani, Toshkent',
    latitude: 41.2855, longitude: 69.2034,
    type: 'fuel', priceType: 'free', priceAmount: 0,
  },
  {
    name: 'Lukoil — Yunusobod filiali',
    address: 'Amir Temur shoh ko\'chasi 107, Yunusobod tumani, Toshkent',
    latitude: 41.3540, longitude: 69.2880,
    type: 'fuel', priceType: 'paid', priceAmount: 1000,
  },
  {
    name: 'Chorsu bozori jamoat hojatxonasi',
    address: 'Chorsu bozori, Eski shahar, Toshkent',
    latitude: 41.3267, longitude: 69.2362,
    type: 'public', priceType: 'paid', priceAmount: 1500,
  },
  {
    name: 'Tashkent City Park markaziy WC',
    address: 'Tashkent City, Yakkasaroy tumani, Toshkent',
    latitude: 41.3050, longitude: 69.2680,
    type: 'public', priceType: 'free', priceAmount: 0,
  },
  {
    name: 'Mega Planet Mall',
    address: 'Babur ko\'chasi 1, Yunusobod tumani, Toshkent',
    latitude: 41.3618, longitude: 69.2872,
    type: 'mall', priceType: 'free', priceAmount: 0,
  },
  {
    name: 'Riviera Mall',
    address: 'Mirzo Ulug\'bek ko\'chasi 56, Mirzo Ulug\'bek tumani, Toshkent',
    latitude: 41.3290, longitude: 69.3340,
    type: 'mall', priceType: 'paid', priceAmount: 3000,
  },
];

const SAMPLE_COMMENTS = [
  'Toza, qog\'oz bor edi. Tavsiya qilaman!',
  'Hammasi joyida, lekin biroz tor.',
  'Pulli bo\'lsa-da, qiymatiga arzigulik.',
  'Suv bosimi past edi, lekin umuman toza.',
  'Eng yaxshi joy! Albatta qayta kelaman.',
  'O\'rtacha, alohida nimasi yo\'q.',
  'Tualet qog\'ozi tugab qolibdi, ammo tozalik a\'lo.',
  'Bepul va toza — boshqa nima kerak?',
  'Atrof toza, xodimlar do\'stona.',
  'Boshqa iloj bo\'lmasa kirsa bo\'ladi.',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomRating(): number {
  const r = Math.random();
  if (r < 0.55) return 5;
  if (r < 0.85) return 4;
  return 3;
}

async function reset() {
  console.log('🧹 Jadvallar tozalanmoqda...');
  await prisma.review.deleteMany();
  await prisma.location.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('🌱 Toilet.uz seed boshlandi...');
  console.log(`   DATABASE: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@')}`);

  if (shouldReset) await reset();

  /* ──────────── Users ──────────── */
  console.log('👤 Foydalanuvchilar...');
  const users = await Promise.all(
    TEST_USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: u,
      })
    )
  );
  console.log(`   ${users.length} ta user (upsert)`);

  /* ──────────── Locations ──────────── */
  console.log('📍 Joylar...');
  const creator = users[0]!;
  const locations: { id: string; name: string }[] = [];
  for (const loc of TASHKENT_LOCATIONS) {
    const existing = await prisma.location.findFirst({
      where: { name: loc.name },
      select: { id: true, name: true },
    });
    if (existing) {
      locations.push(existing);
      continue;
    }
    const created = await prisma.location.create({
      data: { ...loc, createdById: creator.id },
      select: { id: true, name: true },
    });
    locations.push(created);
  }
  console.log(`   ${locations.length} ta joy mavjud`);

  /* ──────────── Reviews ──────────── */
  console.log('💬 Sharhlar...');
  let reviewsAdded = 0;
  for (const loc of locations) {
    const existingCount = await prisma.review.count({
      where: { locationId: loc.id },
    });
    if (existingCount > 0) continue;

    const reviewCount = 2 + Math.floor(Math.random() * 3); // 2-4 ta
    const ratings: number[] = [];

    for (let i = 0; i < reviewCount; i++) {
      const rating = randomRating();
      ratings.push(rating);
      await prisma.review.create({
        data: {
          locationId: loc.id,
          userId: pick(users).id,
          rating,
          comment: pick(SAMPLE_COMMENTS),
          images: [],
        },
      });
      reviewsAdded++;
    }

    const avg = ratings.reduce((s, x) => s + x, 0) / ratings.length;
    await prisma.location.update({
      where: { id: loc.id },
      data: { rating: avg, reviewCount },
    });
  }
  console.log(`   ${reviewsAdded} ta sharh qo'shildi`);

  console.log('\n✅ Seed tugadi!');
  console.log(`   • ${users.length} ta foydalanuvchi`);
  console.log(`   • ${locations.length} ta joy`);
  console.log(`   • ${reviewsAdded} ta yangi sharh`);

  console.log('\n🧪 Sinash:');
  console.log('   GET  http://localhost:3000/api/toilets/nearby?lat=41.3111&lng=69.2797&radius=5');
  console.log(`   GET  http://localhost:3000/api/toilets/${locations[0]?.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Seed muvaffaqiyatsiz:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
