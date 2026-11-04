/**
 * Export a DOM element to PDF using html2pdf or fallback to window.print
 */
export async function exportReportToPdf(elementId, filename = 'AquaNet_Vision_Water_Quality_Report.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Report container element not found');
  }

  try {
    // Dynamically import html2pdf.js if available in browser
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    return await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.warn('html2pdf export failed or not supported, falling back to window.print()', error);
    window.print();
  }
}
