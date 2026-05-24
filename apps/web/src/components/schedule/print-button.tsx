"use client";

import React from "react";

export function PrintButton() {
    return (
        <button className="print-btn" onClick={() => window.print()}>
            🖨 Print / Save as PDF
        </button>
    );
}
