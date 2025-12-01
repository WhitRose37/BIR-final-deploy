import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 120;

async function searchDetailedInfo(partNumber: string, partName: string): Promise<string> {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      console.error("OPENAI_API_KEY not found");
      return "";
    }

    console.log(`🔍 Searching for: ${partName} (${partNumber})`);

    const prompt = `ค้นหาข้อมูลละเอียดเกี่ยวกับ: "${partName}" (Part Number: ${partNumber})

กรุณาจัดรูปแบบตามโครงสร้างนี้ (ถ้ามีข้อมูล):

📘 1. คำอธิบายสั้น (Overview)
- อธิบายว่าสินค้าคืออะไร ใช้ทำอะไร

⚙️ 2. คุณสมบัติเด่น (Key Features)
- ข้อดี/ข้อเด่น 4-6 ข้อ

📊 3. ข้อมูลทางเทคนิค (Technical Specifications)
- แยกหมวด เช่น แรงดัน, กำลัง, วัสดุ, อุณหภูมิ ฯลฯ

🧰 4. การใช้งาน (Applications)
- อุตสาหกรรมหรือสถานการณ์ที่ใช้

🔄 5. รุ่นที่เกี่ยวข้อง (Model Variants)
- รุ่นต่างๆ (ถ้ามี)

🪛 6. วิธีติดตั้ง/ใช้งาน (Setup / Operation)
- ขั้นตอนสั้นๆ 3-6 ขั้น

🧽 7. การดูแลรักษา (Maintenance & Safety)

💵 8. ข้อมูลเพิ่มเติม (Price / Source)

ให้คำตอบเป็นภาษาไทย ชัดเจน ครบถ้วน`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // หรือ "gpt-4" ตามต้องการ
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Perplexity API error:", res.status, errorText);
      return "";
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    console.log("✅ Search completed, content length:", content.length);
    return content;
  } catch (e: any) {
    console.error("❌ Search detailed info error:", e?.message);
    return "";
  }
}

function generateTechSpecHTML(data: any, detailedInfo: string): string {
  const timestamp = new Date().toLocaleString("th-TH");

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tech Spec - ${data.part_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333; 
          background: #f5f5f5;
          line-height: 1.7;
        }
        .container { 
          max-width: 950px; 
          margin: 0 auto; 
          background: white;
          padding: 40px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #1a5490;
          padding-bottom: 15px;
        }
        
        .header h1 {
          font-size: 14px;
          color: #333;
          margin-bottom: 8px;
          font-weight: normal;
          letter-spacing: 1px;
        }
        
        .part-number {
          font-size: 20px;
          font-weight: bold;
          color: #d9534f;
          margin: 5px 0;
          font-family: 'Courier New', monospace;
        }
        
        .product-name {
          font-size: 13px;
          color: #666;
          margin-top: 8px;
          font-style: italic;
        }
        
        .content-box {
          background: #fafafa;
          padding: 15px;
          border-radius: 4px;
          line-height: 1.8;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-size: 12px;
          margin-bottom: 15px;
          border-left: 4px solid #1a5490;
        }
        
        .section-title {
          font-size: 13px;
          font-weight: bold;
          color: #1a5490;
          margin-top: 20px;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ddd;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 12px;
        }
        
        table td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        
        table td:first-child {
          font-weight: bold;
          color: #1a5490;
          width: 30%;
        }
        
        table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          font-size: 10px;
          color: #999;
          text-align: center;
        }
        
        .highlight {
          background: #fffacd;
          padding: 2px 5px;
          border-radius: 2px;
        }
        
        @media print {
          body { background: white; }
          .container { box-shadow: none; padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>📋 TECHNICAL SPECIFICATION</h1>
          <div class="part-number">[${data.part_number}]</div>
          <div class="product-name">${data.common_name_en || data.product_name || "Product Information"}</div>
        </div>

        <!-- Quick Info -->
        <table>
          <tr>
            <td>ชื่อภาษาไทย</td>
            <td>${data.common_name_th || "—"}</td>
          </tr>
          <tr>
            <td>ชื่อภาษาอังกฤษ</td>
            <td>${data.common_name_en || data.product_name || "—"}</td>
          </tr>
          <tr>
            <td>หน่วยนับ</td>
            <td>${data.uom || "—"}</td>
          </tr>
          <tr>
            <td>โครงการ</td>
            <td>${data.project_name || "—"}</td>
          </tr>
        </table>

        <!-- Main Content from Search -->
        ${
          detailedInfo
            ? `
        <div class="section-title">📊 ข้อมูลจากการค้นหา (Searched Information)</div>
        <div class="content-box">${detailedInfo}</div>
        `
            : `
        <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #ffc107;">
          <strong>⚠️ หมายเหตุ:</strong> ไม่สามารถค้นหาข้อมูลเพิ่มเติมได้ โปรดตรวจสอบการเชื่อมต่อ API
        </div>
        `
        }

        <!-- Generated Data Summary -->
        <div class="section-title">📝 ข้อมูลจากการ Generate (Generated Data)</div>
        <table>
          <tr>
            <td>Characteristics</td>
            <td>${data.characteristics_of_material_th || data.characteristics_of_material_en || "—"}</td>
          </tr>
          <tr>
            <td>Function</td>
            <td>${data.function_th || data.function_en || "—"}</td>
          </tr>
          <tr>
            <td>Where Used</td>
            <td>${data.where_used_th || data.where_used_en || "—"}</td>
          </tr>
          <tr>
            <td>Capacity/Year</td>
            <td>${data.estimated_capacity_machine_year || "—"}</td>
          </tr>
          <tr>
            <td>Quantity</td>
            <td>${data.quantity_to_use || "—"}</td>
          </tr>
          <tr>
            <td>ECCN</td>
            <td><span class="highlight">${data.eccn || "—"}</span></td>
          </tr>
          <tr>
            <td>HTS</td>
            <td><span class="highlight">${data.hts || "—"}</span></td>
          </tr>
          <tr>
            <td>COO</td>
            <td><span class="highlight">${data.coo || "—"}</span></td>
          </tr>
        </table>

        <!-- Description -->
        ${
          data.long_th || data.long_en
            ? `
        <div class="section-title">📄 คำอธิบายรายละเอียด</div>
        <div class="content-box">${data.long_th || data.long_en}</div>
        `
            : ""
        }

        <!-- Footer -->
        <div class="footer">
          <p>Generated by BIR Part Generator | ${timestamp}</p>
          <p>Part Code: <span class="highlight">${data.part_number}</span></p>
        </div>
      </div>

      <script>
        window.addEventListener('load', () => {
          window.print();
        });
      </script>
    </body>
    </html>
  `;
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { part_number, common_name_en, common_name_th } = body;

    console.log("🔧 Generating Tech Spec for:", part_number);

    // ค้นหาข้อมูลละเอียด
    const detailedInfo = await searchDetailedInfo(
      part_number,
      common_name_en || common_name_th || part_number
    );

    console.log("📄 Generating HTML...");

    const html = generateTechSpecHTML(body, detailedInfo);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (e: any) {
    console.error("❌ Generate tech spec error:", e?.message);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
