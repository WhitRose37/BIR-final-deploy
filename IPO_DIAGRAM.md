# 🔄 Input-Process-Output (IPO) Model

This diagram outlines the data flow within the **Lumentum Part Generator** system.

## 📊 System Flow Diagram

### 1. INPUT (ข้อมูลนำเข้า)
The raw data provided by the user or external sources.
*   **User Prompts:** Natural language descriptions of the part (e.g., "M6 bolt, 20mm length, stainless steel").
*   **Source Documents:** Uploaded files (PDF, DOCX, TXT) containing technical specs or legacy data.
*   **Constraints & Parameters:** Specific requirements selected via UI (Material, Tolerance, Standards like ISO/DIN).
*   **User Context:** User role (Admin/User) and preferences from the profile.

### 2. PROCESS (กระบวนการทำงาน)
The core logic and transformation of data.
*   **Frontend Layer (Next.js):**
    *   Validates user input.
    *   Handles file uploads and converts to base64/binary.
*   **Backend Layer (API Routes):**
    *   **Authentication:** Verifies user identity and permissions.
    *   **Orchestration:** Manages data flow between services.
*   **Intelligence Engine:**
    *   **Document Processor (Python):** Extracts raw text from uploaded files using OCR/Text parsing.
    *   **AI Engine (OpenAI):** Analyzes text, identifies entities (dimensions, materials), and generates structured specifications based on engineering prompts.
*   **Data Persistence (Prisma/PostgreSQL):**
    *   Saves the generated part to the user's catalog.
    *   Logs usage history.

### 3. OUTPUT (ผลลัพธ์)
The final actionable data presented to the user.
*   **Structured Specification:** A detailed JSON object containing all part attributes (Name, Dimensions, Material, Grade).
*   **Visual Representation:**
    *   UI Cards displaying part details.
    *   (Future) 2D/3D Preview of the part.
*   **Exportable Files:**
    *   **PDF:** Formal specification sheet.
    *   **Excel/CSV:** Data list for inventory import.
*   **System Feedback:** Success/Error messages and usage quotas.

---

## 🧩 Visual Representation

```mermaid
graph LR
    subgraph INPUT [📥 INPUT]
        A[User Text Prompt]
        B[Uploaded Documents<br/>(PDF/Word)]
        C[Settings & Constraints]
    end

    subgraph PROCESS [⚙️ PROCESS]
        D[Next.js Frontend<br/>(Validation)]
        E[API Gateway]
        F[Document Processor<br/>(Extract Text)]
        G[AI Engine<br/>(Generate Specs)]
        H[Database<br/>(Store Data)]
    end

    subgraph OUTPUT [📤 OUTPUT]
        I[Part Specification<br/>(JSON/UI)]
        J[Export Files<br/>(PDF/Excel)]
        K[Catalog Entry]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    E --> G
    F --> G
    G --> H
    H --> I
    H --> J
    H --> K
```
