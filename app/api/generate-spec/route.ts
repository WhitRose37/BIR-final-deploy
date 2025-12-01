import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

function generateSpecHTML(data: any): string {
  const timestamp = new Date().toLocaleString("th-TH");

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Technical Specification - ${data.part_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', 'Tahoma', sans-serif; color: #333; background: white; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; padding: 40px; }
        
        /* Header */
        .header {
          border-bottom: 3px solid #1a5490;
          padding-bottom: 20px;
          margin-bottom: 30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          color: #1a5490;
          margin-bottom: 5px;
        }
        
        .header p {
          color: #666;
          font-size: 12px;
          margin: 5px 0;
        }
        
        .gov-seal {
          display: inline-block;
          width: 80px;
          height: 80px;
          border: 2px solid #1a5490;
          border-radius: 50%;
          text-align: center;
          line-height: 80px;
          font-size: 40px;
          margin-bottom: 15px;
        }
        
        /* Section */
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .section-title {
          background: #1a5490;
          color: white;
          padding: 12px 15px;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          border-left: 5px solid #0d2f4d;
        }
        
        .section-subtitle {
          background: #e8f0f7;
          color: #1a5490;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 10px;
          border-left: 3px solid #1a5490;
        }
        
        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .info-row {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .info-label {
          font-weight: bold;
          color: #1a5490;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 5px;
          display: block;
        }
        
        .info-value {
          color: #333;
          font-size: 13px;
          line-height: 1.5;
        }
        
        /* Description Box */
        .description-box {
          background: #f9f9f9;
          border-left: 4px solid #1a5490;
          padding: 15px;
          margin-bottom: 15px;
          border-radius: 4px;
          font-size: 13px;
          line-height: 1.7;
        }
        
        /* Table */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        
        table th {
          background: #1a5490;
          color: white;
          padding: 10px;
          text-align: left;
          font-size: 12px;
          font-weight: bold;
        }
        
        table td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
          font-size: 12px;
        }
        
        table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        /* Specifications */
        .spec-item {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 15px;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
          font-size: 12px;
        }
        
        .spec-label {
          font-weight: bold;
          color: #1a5490;
        }
        
        .spec-value {
          color: #333;
        }
        
        /* Footer */
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #1a5490;
          font-size: 10px;
          color: #666;
          text-align: center;
        }
        
        .footer-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-top: 30px;
          text-align: center;
        }
        
        .footer-col {
          padding-top: 40px;
        }
        
        .footer-col p {
          margin-bottom: 5px;
        }
        
        .footer-col .line {
          border-top: 1px solid #333;
          margin-top: 10px;
          padding-top: 5px;
        }
        
        /* Print Styles */
        @media print {
          body { padding: 0; }
          .container { padding: 20px; }
          .section { page-break-inside: avoid; }
          .footer { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="gov-seal">🏭</div>
          <h1>TECHNICAL SPECIFICATION SHEET</h1>
          <p>เอกสารข้อมูลจำเพาะทางเทคนิค</p>
          <p>Ministry of Industry - Standards Bureau</p>
          <p>สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม กระทรวงอุตสาหกรรม</p>
        </div>

        <!-- Part Information Section -->
        <div class="section">
          <div class="section-title">📋 PART INFORMATION / ข้อมูลชิ้นส่วน</div>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Part Number</span>
              <span class="info-value">${data.part_number || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Product Name (EN)</span>
              <span class="info-value">${data.product_name || data.common_name_en || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Product Name (TH)</span>
              <span class="info-value">${data.common_name_th || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Common Name (EN)</span>
              <span class="info-value">${data.common_name_en || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Project Name</span>
              <span class="info-value">${data.project_name || "—"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Unit of Measure (UOM)</span>
              <span class="info-value">${data.uom || "—"}</span>
            </div>
          </div>
        </div>

        <!-- Characteristics Section -->
        ${
          data.characteristics_of_material_en || data.characteristics_of_material_th
            ? `
        <div class="section">
          <div class="section-title">🏭 CHARACTERISTICS OF MATERIAL / คุณลักษณะของวัสดุ</div>
          <div class="section-subtitle">English Description</div>
          <div class="description-box">
            ${data.characteristics_of_material_en || "No information available"}
          </div>
          <div class="section-subtitle">คำอธิบายภาษาไทย</div>
          <div class="description-box">
            ${data.characteristics_of_material_th || "No information available"}
          </div>
        </div>
        `
            : ""
        }

        <!-- Function & Usage Section -->
        ${
          data.long_en || data.long_th
            ? `
        <div class="section">
          <div class="section-title">🔧 FUNCTION & USAGE / หน้าที่และการใช้งาน</div>
          <div class="section-subtitle">Function (English)</div>
          <div class="description-box">
            ${data.long_en || "No information available"}
          </div>
          <div class="section-subtitle">หน้าที่ (ภาษาไทย)</div>
          <div class="description-box">
            ${data.long_th || "No information available"}
          </div>
        </div>
        `
            : ""
        }

        <!-- Specifications Section -->
        <div class="section">
          <div class="section-title">📊 SPECIFICATIONS / ข้อกำหนด</div>
          <div class="spec-item">
            <div class="spec-label">Capacity/Machine Year</div>
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
            <div class="spec-label">HTS (Harmonized Tariff)</div>
            <div class="spec-value">${data.hts || "—"}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">COO (Country of Origin)</div>
            <div class="spec-value">${data.coo || "—"}</div>
          </div>
        </div>

        <!-- Compliance Section -->
        <div class="section">
          <div class="section-title">✓ COMPLIANCE & STANDARDS / การปฏิบัติตามมาตรฐาน</div>
          <table>
            <thead>
              <tr>
                <th>Standard Type</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Export Control Classification (ECCN)</td>
                <td>${data.eccn || "—"}</td>
                <td>Verified</td>
              </tr>
              <tr>
                <td>Harmonized Tariff Schedule (HTS)</td>
                <td>${data.hts || "—"}</td>
                <td>Verified</td>
              </tr>
              <tr>
                <td>Country of Origin (COO)</td>
                <td>${data.coo || "—"}</td>
                <td>Verified</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Document Information -->
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
              <p><strong>Prepared By / เตรียมโดย</strong></p>
              <div class="line">_____________________</div>
              <p style="margin-top: 5px; font-size: 10px;">Signature / ลายเซ็น</p>
            </div>
            <div class="footer-col">
              <p><strong>Approved By / อนุมัติโดย</strong></p>
              <div class="line">_____________________</div>
              <p style="margin-top: 5px; font-size: 10px;">Signature / ลายเซ็น</p>
            </div>
          </div>
          
          <p style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px;">
            Ministry of Industry - Standards Bureau<br>
            สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม กระทรวงอุตสาหกรรม
          </p>
        </div>
      </div>
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

    const html = generateSpecHTML(body);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
