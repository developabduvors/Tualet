# Toilet.uz Backend

Bu papka `Toilet.uz` loyihadagi backendga tegishli fayllarning alohida nusxasi.
Asl loyiha Next.js ichida ishlaydi, shuning uchun production'da root `my-app` dan ishga tushadi.

## Nimalar backendga kiradi

- `app/api/` - API route'lar
- `lib/auth.ts` - NextAuth sozlamasi
- `lib/prisma.ts` - Prisma client
- `lib/geo.ts` - nearby qidiruv logikasi
- `lib/validation.ts` - Zod validatsiya
- `lib/api.ts` - API response helperlar
- `prisma/` - schema va seed

## Muhim eslatma

Bu papka backend kodni alohida ko'rish va tartiblash uchun ajratildi.
Ishga tushirish hali ham loyiha ildizidan amalga oshiriladi:

```bash
cd C:\Users\admin\Desktop\Toilet.uz\my-app
npm run dev
```

API route'larning asl ishchi joyi:

- `app/api/auth/[...nextauth]/route.ts`
- `app/api/toilets/nearby/route.ts`
- `app/api/toilets/[id]/route.ts`
- `app/api/reviews/route.ts`
