import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.createMany({
    data: [
      { nama: "Owner Demo", email: "owner@demo.test", passwordHash, role: "OWNER" },
      { nama: "Admin Demo", email: "admin@demo.test", passwordHash, role: "ADMIN" },
      { nama: "Kasir Demo", email: "kasir@demo.test", passwordHash, role: "KASIR" },
      { nama: "Gudang Demo", email: "gudang@demo.test", passwordHash, role: "GUDANG" },
    ],
    skipDuplicates: true,
  });

  const sembako = await prisma.kategori.upsert({
    where: { nama: "Sembako" },
    update: {},
    create: { nama: "Sembako" },
  });

  const minuman = await prisma.kategori.upsert({
    where: { nama: "Minuman" },
    update: {},
    create: { nama: "Minuman" },
  });

  await prisma.produk.upsert({
    where: { sku: "SKU-0001" },
    update: {},
    create: {
      sku: "SKU-0001",
      barcode: "8990000000017",
      nama: "Beras Premium 5kg",
      kategoriId: sembako.id,
      satuan: "karung",
      hpp: 62000,
      hargaRitel: 68000,
      hargaGrosir: 65000,
      minQtyGrosir: 5,
      stok: 100,
      stokMinimum: 10,
    },
  });

  await prisma.produk.upsert({
    where: { sku: "SKU-0002" },
    update: {},
    create: {
      sku: "SKU-0002",
      barcode: "8990000000024",
      nama: "Minyak Goreng 1L",
      kategoriId: sembako.id,
      satuan: "botol",
      hpp: 15000,
      hargaRitel: 17000,
      hargaGrosir: 16000,
      minQtyGrosir: 12,
      stok: 200,
      stokMinimum: 20,
    },
  });

  await prisma.produk.upsert({
    where: { sku: "SKU-0003" },
    update: {},
    create: {
      sku: "SKU-0003",
      barcode: "8990000000031",
      nama: "Air Mineral 600ml",
      kategoriId: minuman.id,
      satuan: "botol",
      hpp: 2000,
      hargaRitel: 3000,
      hargaGrosir: 2500,
      minQtyGrosir: 24,
      stok: 500,
      stokMinimum: 50,
    },
  });

  await prisma.supplier.upsert({
    where: { id: "supplier-demo" },
    update: {},
    create: {
      id: "supplier-demo",
      nama: "PT Sumber Rejeki Distribusi",
      kontakPerson: "Budi Santoso",
      telepon: "081234567890",
      alamat: "Jl. Industri No. 10, Jakarta",
    },
  });

  await prisma.member.upsert({
    where: { noHp: "081200000001" },
    update: {},
    create: {
      kodeMember: "MBR-000001",
      nama: "Siti Rahayu",
      noHp: "081200000001",
      email: "siti.rahayu@demo.test",
    },
  });

  console.log("Seed data Fase 1 & 2 selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
