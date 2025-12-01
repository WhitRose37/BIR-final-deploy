// lib/types.ts
export type PartOut = {
  part_number: string;

  product_name?: string;                 // Product Name
  common_name_en?: string;               // Common Name in EN
  common_name_th?: string;               // Common Name in TH
  uom?: string;                          // UOM

  characteristics_of_material_en?: string;
  characteristics_of_material_th?: string;

  estimated_capacity_machine_year?: string; // Estimated Capacity/Machine/Year
  quantity_to_use?: string;                 // Quantity To Use

  // ✅ เพิ่มฟิลด์ที่หายไป
  function_en?: string;                    // Function (EN)
  function_th?: string;                    // Function (TH)
  where_used_en?: string;                  // Where Used (EN)
  where_used_th?: string;                  // Where Used (TH)

  long_th?: string; // Function/Where/Char/How/Purpose (TH)
  long_en?: string; // Function/Where/Char/How/Purpose (EN)

  eccn?: string;                           // ECCN
  hts?: string;                            // HTS
  coo?: string;                            // COO

  tags?: string[];
  images: string[];
  sources: { name: string; url?: string }[];

  source_confidence: "authoritative" | "derived" | "ai_guess" | "no_source_strict";
  no_authoritative_source?: boolean;
  tokens?: { prompt: number; completion: number; total: number; model?: string };
};
