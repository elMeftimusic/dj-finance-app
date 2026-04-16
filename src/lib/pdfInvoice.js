// ─── Invoice PDF Generator ─────────────────────────────────────────────────
// Uses jsPDF to generate a professional German-style invoice PDF.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (n) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

export function generateInvoicePDF(invoice, ownerSettings = {}) {
  const {
    ownerName = "Moe [Your Last Name]",
    ownerAddress = "Musterstraße 1\n10115 Berlin",
    ownerEmail = "moe@example.com",
    ownerPhone = "+49 XXX XXXXXXX",
    taxNumber = "12/345/67890",  // Steuernummer
    bankName = "Musterbank",
    iban = "DE00 1234 5678 9012 3456 78",
    bic = "MUSTER22",
  } = ownerSettings;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 20;

  // ── Header bar ────────────────────────────────────────────────────────────
  doc.setFillColor(88, 28, 135); // purple-900
  doc.rect(0, 0, pageW, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("RECHNUNG / INVOICE", margin, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${invoice.id}`, pageW - margin, 12, { align: "right" });

  // ── Sender (top left) ─────────────────────────────────────────────────────
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${ownerName} · ${ownerAddress.replace("\n", ", ")} · ${ownerEmail}`, margin, 26);

  // ── Recipient (left block) ────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Rechnungsempfänger:", margin, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const clientLines = [invoice.client, invoice.clientAddress || ""].filter(Boolean);
  clientLines.forEach((line, i) => {
    doc.text(line, margin, 45 + i * 6);
  });

  // ── Invoice Details (right block) ─────────────────────────────────────────
  const rightX = 130;
  const detailRows = [
    ["Rechnungsnummer:", invoice.id],
    ["Rechnungsdatum:", invoice.date],
    ["Leistungsdatum:", invoice.date],
    ["Steuernummer:", taxNumber],
  ];
  doc.setFontSize(9);
  detailRows.forEach(([label, val], i) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, rightX, 38 + i * 6);
    doc.setFont("helvetica", "normal");
    doc.text(val, 175, 38 + i * 6, { align: "right" });
  });

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 68, pageW - margin, 68);

  // ── Subject ───────────────────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Rechnung für erbrachte Dienstleistungen", margin, 76);

  // ── Line Items Table ──────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 82,
    margin: { left: margin, right: margin },
    head: [["Pos.", "Beschreibung / Description", "Menge", "Einzelpreis", "Betrag"]],
    body: [
      ["1", invoice.description, "1", fmt(invoice.netAmount), fmt(invoice.netAmount)],
    ],
    headStyles: {
      fillColor: [88, 28, 135],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 80 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
    alternateRowStyles: { fillColor: [248, 245, 255] },
  });

  // ── Totals ────────────────────────────────────────────────────────────────
  const afterTable = doc.lastAutoTable.finalY + 5;
  const totalsX = 130;

  const totalsData = [
    ["Nettobetrag:", fmt(invoice.netAmount)],
    ["MwSt. 19%:", fmt(invoice.vat)],
  ];
  totalsData.forEach(([label, val], i) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(label, totalsX, afterTable + i * 7);
    doc.text(val, pageW - margin, afterTable + i * 7, { align: "right" });
  });

  // Total box
  const totalY = afterTable + totalsData.length * 7 + 2;
  doc.setFillColor(88, 28, 135);
  doc.roundedRect(totalsX - 2, totalY - 5, pageW - margin - totalsX + 2, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Gesamtbetrag:", totalsX + 2, totalY + 1.5);
  doc.text(fmt(invoice.total), pageW - margin - 2, totalY + 1.5, { align: "right" });

  // ── Payment Info ──────────────────────────────────────────────────────────
  const payY = totalY + 18;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, payY - 4, pageW - margin, payY - 4);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Bankverbindung / Payment Details", margin, payY + 2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const bankLines = [
    `Bank: ${bankName}`,
    `IBAN: ${iban}`,
    `BIC: ${bic}`,
    `Verwendungszweck / Reference: ${invoice.id}`,
  ];
  bankLines.forEach((line, i) => {
    doc.text(line, margin, payY + 9 + i * 5.5);
  });

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `${ownerName} · ${ownerAddress.replace("\n", ", ")} · ${ownerPhone} · ${ownerEmail}`,
    pageW / 2,
    285,
    { align: "center" }
  );

  doc.save(`${invoice.id}_${invoice.client.replace(/\s+/g, "_")}.pdf`);
}
