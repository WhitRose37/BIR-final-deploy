import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

function generateDetailedSpecPDF(data: any): string {
  const timestamp = new Date().toLocaleString("th-TH");
  const pageBreak = '<div style="page-break-after: always;"></div>';

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Technical Specification - ${data.part_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333; 
          background: white; 
          line-height: 1.8;
          font-size: 11pt;
        }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; }
        
        /* Header */
        .header {
          border-bottom: 3px solid #1a5490;
          padding-bottom: 20px;
          margin-bottom: 30px;
          text-align: center;
          page-break-after: avoid;
        }
        
        .header h1 {
          font-size: 24px;
          color: #1a5490;
          margin-bottom: 5px;
        }
        
        .gov-seal {
          display: inline-block;
          width: 70px;
          height: 70px;
          border: 2px solid #1a5490;
          border-radius: 50%;
          text-align: center;
          line-height: 70px;
          font-size: 36px;
          margin-bottom: 15px;
        }
        
        .header p {
          color: #666;
          font-size: 10px;
          margin: 3px 0;
        }
        
        /* Section */
        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .section-title {
          background: linear-gradient(135deg, #1a5490 0%, #0d2f4d 100%);
          color: white;
          padding: 12px 15px;
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 15px;
          border-left: 5px solid #0d2f4d;
          border-radius: 4px;
        }
        
        .section-subtitle {
          background: #e8f0f7;
          color: #1a5490;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 8px;
          border-left: 3px solid #1a5490;
        }
        
        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 15px;
        }
        
        .info-row {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #fafafa;
        }
        
        .info-label {
          font-weight: bold;
          color: #1a5490;
          font-size: 10px;
          text-transform: uppercase;
          margin-bottom: 3px;
          display: block;
        }
        
        .info-value {
          color: #333;
          font-size: 11px;
          line-height: 1.5;
          word-wrap: break-word;
        }
        
        /* Description Box */
        .description-box {
          background: #f9f9f9;
          border-left: 4px solid #1a5490;
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 4px;
          font-size: 11px;
          line-height: 1.8;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        /* Table */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
          font-size: 10px;
        }
        
        table th {
          background: #1a5490;
          color: white;
          padding: 8px;
          text-align: left;
          font-weight: bold;
        }
        
        table td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        
        table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        /* Specifications */
        .spec-item {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          font-size: 11px;
        }
        
        .spec-label {
          font-weight: bold;
          color: #1a5490;
        }
        
        .spec-value {
          color: #333;
          word-wrap: break-word;
        }
        
        /* Footer */
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #1a5490;
          font-size: 9px;
          color: #666;
          text-align: center;
          page-break-before: avoid;
        }
        
        .footer-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 20px;
          text-align: center;
        }
        
        .footer-col {
          padding-top: 30px;
        }
        
        .footer-col p {
          margin-bottom: 3px;
        }
        
        .footer-col .line {
          border-top: 1px solid #333;
          margin-top: 5px;
          padding-top: 3px;
        }
        
        .highlight {
          background: #fffacd;
          padding: 2px 4px;
        }
        
        .page-number {
          text-align: right;
          font-size: 9px;
          color: #999;
          margin-top: 10px;
        }
        
        @media print {
          body { padding: 0; }
          .container { padding: 15px; }
          .section { page-break-inside: avoid; }
          .footer { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Page 1: Header & Basic Info -->
        <div class="header">
          <div class="gov-seal">🏭</div>
          <h1>TECHNICAL SPECIFICATION SHEET</h1>
          <p>เอกสารข้อมูลจำเพาะทางเทคนิค</p>
          <p>Ministry of Industry - Standards Bureau</p>
          <p>สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม กระทรวงอุตสาหกรรม</p>
        </div>

        <!-- Part Identification -->
        <div class="section">
          <div class="section-title">📋 PART IDENTIFICATION / การระบุชิ้นส่วน</div>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Part Number</span>
              <span class="info-value"><span class="highlight">${data.part_number || "—"}</span></span>
            </div>
            <div class="info-row">
              <span class="info-label">Product Name</span>
              <span class="info-value">${data.product_name || data.common_name_en || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Common Name (EN)</span>
              <span class="info-value">${data.common_name_en || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Common Name (TH)</span>
              <span class="info-value">${data.common_name_th || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Project Name</span>
              <span class="info-value">${data.project_name || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Unit of Measure</span>
              <span class="info-value">${data.uom || "—"}</span>
            </div>
          </div>
        </div>

        <!-- Characteristics Section -->
        ${
          data.characteristics_of_material_en || data.characteristics_of_material_th
            ? `
        <div class="section">
          <div class="section-title">🏭 MATERIAL CHARACTERISTICS / คุณลักษณะของวัสดุ</div>
          ${data.characteristics_of_material_en ? `
          <div class="section-subtitle">English Description</div>
          <div class="description-box">${data.characteristics_of_material_en}</div>
          ` : ''}
          ${data.characteristics_of_material_th ? `
          <div class="section-subtitle">คำอธิบายภาษาไทย</div>
          <div class="description-box">${data.characteristics_of_material_th}</div>
          ` : ''}
        </div>
        `
            : ""
        }

        <!-- Function & Application -->
        ${
          data.function_en || data.function_th || data.where_used_en || data.where_used_th
            ? `
        <div class="section">
          <div class="section-title">⚙️ FUNCTION & APPLICATION / หน้าที่และการประยุกต์ใช้</div>
          <table>
            <thead>
              <tr>
                <th>Aspect</th>
                <th>English</th>
                <th>ไทย</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Function</b></td>
                <td>${data.function_en || "—"}</td>
                <td>${data.function_th || "—"}</td>
              </tr>
              <tr>
                <td><b>Where Used</b></td>
                <td>${data.where_used_en || "—"}</td>
                <td>${data.where_used_th || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        <!-- Detailed Description -->
        ${
          data.long_en || data.long_th
            ? `
        <div class="section">
          <div class="section-title">📝 DETAILED DESCRIPTION / คำอธิบายรายละเอียด</div>
          ${data.long_en ? `
          <div class="section-subtitle">English Version</div>
          <div class="description-box">${data.long_en}</div>
          ` : ''}
          ${data.long_th ? `
          <div class="section-subtitle">เวอร์ชั่นภาษาไทย</div>
          <div class="description-box">${data.long_th}</div>
          ` : ''}
        </div>
        `
            : ""
        }

        ${pageBreak}

        <!-- Specifications -->
        <div class="section">
          <div class="section-title">📊 TECHNICAL SPECIFICATIONS / ข้อกำหนดทางเทคนิค</div>
          <div class="spec-item">
            <div class="spec-label">Estimated Capacity</div>
            <div class="spec-value">${data.estimated_capacity_machine_year || "—"}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Quantity to Use</div>
            <div class="spec-value">${data.quantity_to_use || "—"}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">ECCN (Export Control)</div>
            <div class="spec-value">${data.eccn || "—"}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">HTS (Tariff Code)</div>
            <div class="spec-value">${data.hts || "—"}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">COO (Country of Origin)</div>
            <div class="spec-value">${data.coo || "—"}</div>
          </div>
        </div>

        <!-- Compliance -->
        <div class="section">
          <div class="section-title">✓ COMPLIANCE & STANDARDS / การปฏิบัติตามมาตรฐาน</div>
          <table>
            <thead>
              <tr>
                <th>Standard</th>
                <th>Code/Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Export Control Classification</td>
                <td>${data.eccn || "—"}</td>
                <td>✓ Verified</td>
              </tr>
              <tr>
                <td>Harmonized Tariff Schedule</td>
                <td>${data.hts || "—"}</td>
                <td>✓ Verified</td>
              </tr>
              <tr>
                <td>Country of Origin</td>
                <td>${data.coo || "—"}</td>
                <td>✓ Verified</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Document Info -->
        <div class="section">
          <div class="section-title">📄 DOCUMENT INFORMATION / ข้อมูลเอกสาร</div>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Generated Date</span>
              <span class="info-value">${timestamp}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Document Version</span>
              <span class="info-value">1.0</span>
            </div>
            <div class="info-row">
              <span class="info-label">Classification</span>
              <span class="info-value">Internal Use</span>
            </div>
            <div class="info-row">
              <span class="info-label">System</span>
              <span class="info-value">BIR Part Generator</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>This Technical Specification Sheet is generated by the BIR Part Generator System</p>
          <p>เอกสารนี้สร้างขึ้นโดยระบบ BIR Part Generator</p>
          
          <div class="footer-row">
            <div class="footer-col">
              <p><b>Prepared By</b></p>
              <div class="line">_____________________</div>
              <p style="margin-top: 2px; font-size: 9px;">Signature / ลายเซ็น</p>
            </div>
            <div class="footer-col">
              <p><b>Approved By</b></p>
              <div class="line">_____________________</div>
              <p style="margin-top: 2px; font-size: 9px;">Signature / ลายเซ็น</p>
            </div>
          </div>
          
          <p style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 8px;">
            Ministry of Industry - Standards Bureau<br>
            สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม กระทรวงอุตสาหกรรม
          </p>
          <div class="page-number">Page 1 of 1</div>
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
    const html = generateDetailedSpecPDF(body);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="spec-${body.part_number}.html"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
