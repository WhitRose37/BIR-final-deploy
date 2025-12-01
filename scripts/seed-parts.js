const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding test parts...')

  const parts = [
    {
      partNumber: 'SEW-EURODRIVE-DRN100L4',
      productName: 'SEW-EURODRIVE Three-Phase AC Motor',
      commonNameEn: 'Three-Phase AC Motor',
      commonNameTh: 'มอเตอร์สามเฟส',
      uom: 'piece',
      characteristicsOfMaterialEn: '3-phase, 2.2kW, 1500 RPM, 380V',
      characteristicsOfMaterialTh: '3 เฟส, 2.2kW, 1500 RPM, 380V',
      imagesJson: ['https://via.placeholder.com/400x300?text=SEW+Motor'],
      createdById: 'admin',
      createdByName: 'Admin User',
    },
    {
      partNumber: 'NSK-6000ZZ',
      productName: 'NSK Deep Groove Ball Bearing',
      commonNameEn: 'Ball Bearing',
      commonNameTh: 'แบริ่ง',
      uom: 'piece',
      characteristicsOfMaterialEn: 'Deep groove, Shielded, ID 10mm, OD 26mm',
      characteristicsOfMaterialTh: 'แบบร่องลึก, มีฝาครอบ, ID 10mm, OD 26mm',
      imagesJson: ['https://via.placeholder.com/400x300?text=NSK+Bearing'],
      createdById: 'admin',
      createdByName: 'Admin User',
    },
    {
      partNumber: 'OMRON-E3Z-T61',
      productName: 'OMRON Photoelectric Sensor',
      commonNameEn: 'Photoelectric Sensor',
      commonNameTh: 'เซ็นเซอร์แสง',
      uom: 'piece',
      characteristicsOfMaterialEn: 'Through-beam type, Detection distance 10m, NPN output',
      characteristicsOfMaterialTh: 'แบบทะลุ, ระยะตรวจจับ 10m, เอาท์พุต NPN',
      imagesJson: ['https://via.placeholder.com/400x300?text=OMRON+Sensor'],
      createdById: 'admin',
      createdByName: 'Admin User',
    },
  ]

  for (const part of parts) {
    await prisma.savedPartGlobal.upsert({
      where: { partNumber: part.partNumber },
      update: part,
      create: part,
    })
    console.log(`✅ Created: ${part.partNumber}`)
  }

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
