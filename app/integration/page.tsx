"use client";

import React, { useState, useEffect } from "react";

export default function IntegrationPage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // The Bookmarklet Code
  // Note: We use `encodeURIComponent` to safely embed the script.
  // The script prompts for a part number, calls the API, and then finds inputs by label.
  const bookmarkletCode = `
    javascript:(function(){
      var pn = prompt("Enter Part Number to Auto-Fill:");
      if(!pn) return;
      
      var apiUrl = "${origin}/api/generate";
      
      // Helper to find input by label text
      function setVal(labelStr, val) {
        if(!val) return;
        // Try to find label containing text
        var labels = document.getElementsByTagName('label');
        for(var i=0; i<labels.length; i++) {
          if(labels[i].innerText.includes(labelStr)) {
            // Found label, look for input/textarea
            // 1. Check 'for' attribute
            var forId = labels[i].getAttribute('for');
            if(forId) {
              var inp = document.getElementById(forId);
              if(inp) { inp.value = val; inp.dispatchEvent(new Event('input', { bubbles: true })); return; }
            }
            // 2. Check if input is inside label
            var inpInside = labels[i].querySelector('input, textarea');
            if(inpInside) { inpInside.value = val; inpInside.dispatchEvent(new Event('input', { bubbles: true })); return; }
            
            // 3. Check next sibling (common in table layouts or grid)
            // Traverse up to parent (e.g. td or div) and find input in next sibling container
            // Simple approach: look for input in the parent's next sibling
            var parent = labels[i].parentElement;
            if(parent) {
               var inputs = parent.querySelectorAll('input, textarea');
               if(inputs.length > 0) { inputs[0].value = val; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); return; }
               
               // Try next sibling of parent (e.g. <td>Label</td> <td><input></td>)
               var next = parent.nextElementSibling;
               if(next) {
                 var nextInp = next.querySelector('input, textarea');
                 if(nextInp) { nextInp.value = val; nextInp.dispatchEvent(new Event('input', { bubbles: true })); return; }
               }
            }
          }
        }
        console.log("Could not find input for label: " + labelStr);
      }

      // Show loading
      var notif = document.createElement('div');
      notif.style.position='fixed'; notif.style.top='10px'; notif.style.right='10px';
      notif.style.background='#333'; notif.style.color='#fff'; notif.style.padding='10px';
      notif.style.zIndex='99999'; notif.innerText = 'Generating data for ' + pn + '...';
      document.body.appendChild(notif);

      fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ part_number: pn, withImage: false })
      })
      .then(res => res.json())
      .then(data => {
        notif.innerText = 'Filling form...';
        setTimeout(() => notif.remove(), 2000);
        
        if(data.error) { alert('Error: ' + data.error); return; }
        
        // MAPPING LOGIC based on user screenshot
        setVal("Project Name", data.project_name);
        setVal("Product Name", data.product_name);
        setVal("Common Name in EN", data.common_name_en);
        setVal("Common Name in Thai", data.common_name_th);
        setVal("UOM", data.uom);
        
        setVal("Characteristics of Material", data.characteristics_of_material_en);
        
        // Function TH
        setVal("purpose (TH)", data.function_th + "\\n" + data.where_used_th);
        
        // Function EN
        setVal("purpose (EN)", data.function_en + "\\n" + data.where_used_en);
        
        // Trade fields if exist
        // setVal("ECCN", data.eccn);
        // setVal("HTS", data.hts);
        
      })
      .catch(err => {
        notif.innerText = 'Error!';
        alert('Failed to fetch data: ' + err);
      });
    })();
  `;

  // Minify simply by removing newlines/extra spaces for the href
  const hrefCode = bookmarkletCode.replace(/\s+/g, ' ').trim();

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", WebkitBackgroundClip: "text", color: "transparent" }}>
        🧩 Browser Integration
      </h1>

      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Auto-Fill Bookmarklet</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
          Drag the button below to your browser's bookmarks bar. When you are on the BIR form page, click this bookmark to automatically generate and fill data for a part number.
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <a
            href={hrefCode}
            style={{
              background: "var(--accent)",
              color: "#fff",
              padding: "12px 24px",
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: "none",
              cursor: "grab",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <span>⚡ Auto-Fill BIR Form (Drag to Bookmarks)</span>
          </a>

          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            or copy the code below and create a bookmark manually:
          </div>

          <div style={{
            background: "var(--surface)",
            padding: 12,
            borderRadius: 8,
            border: "1px solid var(--border)",
            width: "100%",
            maxWidth: 600,
            position: "relative"
          }}>
            <code style={{
              display: "block",
              overflowX: "auto",
              whiteSpace: "nowrap",
              fontFamily: "monospace",
              fontSize: 11,
              color: "var(--text)"
            }}>
              {hrefCode}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(hrefCode);
                alert("Code copied to clipboard!");
              }}
              style={{
                position: "absolute",
                right: 8,
                top: 8,
                background: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "4px 8px",
                fontSize: 10,
                cursor: "pointer"
              }}
            >
              Copy
            </button>
          </div>
        </div>

        <div style={{ background: "var(--surface)", padding: 16, borderRadius: 8, fontSize: 13, color: "var(--muted)" }}>
          <strong>How to use:</strong>
          <ol style={{ paddingLeft: 20, marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>Drag the button above to your Bookmarks Bar (Ctrl+Shift+B to show bar).</li>
            <li>Go to the external website with the form.</li>
            <li>Click the "Auto-Fill BIR Form" bookmark.</li>
            <li>Enter the Part Number when prompted.</li>
            <li>Wait for the AI to generate data and fill the fields automatically.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
