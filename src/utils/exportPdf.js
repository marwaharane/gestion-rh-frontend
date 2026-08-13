import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPdf(columns, rows, title, filename) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 21);

  autoTable(doc, {
    startY: 26,
    head: [columns],
    body: rows,
    headStyles: { fillColor: [30, 58, 95] },
    styles: { fontSize: 9 },
  });

  doc.save(`${filename}_${new Date().toISOString().slice(0, 10)}.pdf`);
}