// app/api/active-users/route.ts
let activeUsers = 0;

export async function GET() {
  return Response.json({ activeUsers });
}

// เมื่อมี client เข้าเรียก POST → เพิ่มจำนวน
export async function POST() {
  activeUsers++;
  setTimeout(() => {
    activeUsers = Math.max(0, activeUsers - 1);
  }, 5 * 60 * 1000); // ลดหลังผ่านไป 5 นาที

  return Response.json({ ok: true, activeUsers });
}
