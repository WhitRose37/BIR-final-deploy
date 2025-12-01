const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding test parts...')

  const testParts = [
    {
      partNumber: 'SEW-DRN100L4',
      productName: 'SEW-EURODRIVE Three-Phase AC Motor',
      commonNameEn: 'Three-Phase AC Motor',
      commonNameTh: 'มอเตอร์สามเฟส',
      uom: 'piece',
      characteristicsOfMaterialEn: '3-phase, 2.2kW, 1500 RPM, 380V, IP55',
      characteristicsOfMaterialTh: '3 เฟส, 2.2kW, 1500 RPM, 380V, IP55',
      functionEn: 'Convert electrical energy to mechanical rotation',
      functionTh: 'แปลงพลังงานไฟฟ้าเป็นการหมุน',
      whereUsedEn: 'Industrial machinery, conveyor systems',
      whereUsedTh: 'เครื่องจักรอุตสาหกรรม, ระบบสายพาน',
      imagesJson: ['https://via.placeholder.com/400x300?text=SEW+Motor'],
      tagsJson: ['motor', 'three-phase', 'SEW', '2.2kW'],
      createdById: 'admin',
      createdByName: 'System',
    },
    {
      partNumber: 'NSK-6000ZZ',
      productName: 'NSK Deep Groove Ball Bearing 6000ZZ',
      commonNameEn: 'Deep Groove Ball Bearing',
      commonNameTh: 'แบริ่งลูกปืนร่องลึก',
      uom: 'piece',
      characteristicsOfMaterialEn: 'ID 10mm, OD 26mm, Width 8mm, Shielded type',
      characteristicsOfMaterialTh: 'ขนาดใน 10mm, ขนาดนอก 26mm, หนา 8mm, มีฝาครอบ',
      functionEn: 'Reduce friction in rotating machinery',
      functionTh: 'ลดแรงเสียดทานในเครื่องจักรที่หมุน',
      whereUsedEn: 'Motors, pumps, industrial equipment',
      whereUsedTh: 'มอเตอร์, ปั๊ม, เครื่องจักรอุตสาหกรรม',
      imagesJson: ['https://via.placeholder.com/400x300?text=NSK+Bearing'],
      tagsJson: ['bearing', 'NSK', '6000ZZ', 'ball-bearing'],
      createdById: 'admin',
      createdByName: 'System',
    },
    {
      partNumber: 'OMRON-E3Z-T61',
      productName: 'OMRON Photoelectric Sensor E3Z-T61',
      commonNameEn: 'Photoelectric Sensor',
      commonNameTh: 'เซ็นเซอร์แสง',
      uom: 'piece',
      characteristicsOfMaterialEn: 'Through-beam, Detection distance 10m, NPN output, 12-24VDC',
      characteristicsOfMaterialTh: 'แบบทะลุ, ระยะตรวจจับ 10m, เอาท์พุต NPN, 12-24VDC',
      functionEn: 'Detect objects using light beam',
      functionTh: 'ตรวจจับวัตถุด้วยลำแสง',
      whereUsedEn: 'Automated production lines, packaging machines',
      whereUsedTh: 'สายการผลิตอัตโนมัติ, เครื่องบรรจุภัณฑ์',
      imagesJson: ['https://via.placeholder.com/400x300?text=OMRON+Sensor'],
      tagsJson: ['sensor', 'OMRON', 'photoelectric', 'E3Z'],
      createdById: 'admin',
      createdByName: 'System',
    },
  ]

  for (const part of testParts) {
    try {
      await prisma.savedPartGlobal.upsert({
        where: { partNumber: part.partNumber },
        update: part,
        create: part,
      })
      console.log(`✅ Created: ${part.partNumber}`)
    } catch (e) {
      console.error(`❌ Error creating ${part.partNumber}:`, e)
    }
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
