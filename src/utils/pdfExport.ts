import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PDFColumn<T = any> {
  headerAr: string;
  headerEn?: string;
  accessor: keyof T | ((row: T) => any);
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface PDFSummaryItem {
  labelAr: string;
  labelEn?: string;
  value: string | number;
  highlight?: boolean;
}

export interface PDFExportOptions<T = any> {
  titleAr: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  filename?: string;
  isRTL?: boolean;
  columns: PDFColumn<T>[];
  data: T[];
  summaryItems?: PDFSummaryItem[];
  companyNameAr?: string;
  companyNameEn?: string;
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'a4' | 'letter';
  onProgress?: (status: string) => void;
}

/**
 * Global utility function to export any active table or dataset to a PDF report.
 * Respects Arabic (RTL) and English (LTR) layouts, typography, and styling.
 */
export async function exportTableToPDF<T = any>(options: PDFExportOptions<T>): Promise<boolean> {
  const {
    titleAr,
    titleEn = 'Official ERP Report',
    subtitleAr = 'تقرير صادر من النظام الإداري الموحد - شركة الأوناش المصرية',
    subtitleEn = 'Generated Official ERP Document',
    filename = 'erp-report',
    isRTL = true,
    columns,
    data,
    summaryItems = [],
    companyNameAr = 'شركة الأوناش المصرية والأعمال اللوجستية ش.م.م',
    companyNameEn = 'Egypt Cranes & Logistics S.A.E',
    orientation = 'landscape', // Landscape is preferred for multi-column tables
    onProgress
  } = options;

  try {
    if (onProgress) onProgress(isRTL ? 'جاري تجهيز بيانات التقرير...' : 'Preparing report data...');

    // 1. Create off-screen container for crisp HTML rendering
    const container = document.createElement('div');
    container.id = 'pdf-export-render-container';
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = orientation === 'landscape' ? '1120px' : '794px';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#0f172a';
    container.style.fontFamily = 'Cairo, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    container.dir = isRTL ? 'rtl' : 'ltr';

    // Current Date Formatted
    const now = new Date();
    const dateFormattedStr = now.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeFormattedStr = now.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const refCode = `REP-${Math.floor(100000 + Math.random() * 900000)}`;

    // Build HTML template
    let summaryCardsHTML = '';
    if (summaryItems.length > 0) {
      summaryCardsHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
          ${summaryItems.map(item => `
            <div style="
              flex: 1;
              min-width: 140px;
              padding: 10px 14px;
              background-color: ${item.highlight ? '#eff6ff' : '#f8fafc'};
              border: 1px solid ${item.highlight ? '#bfdbfe' : '#e2e8f0'};
              border-radius: 8px;
              text-align: ${isRTL ? 'right' : 'left'};
            ">
              <div style="font-size: 11px; font-weight: 700; color: ${item.highlight ? '#1e40af' : '#64748b'}; margin-bottom: 4px;">
                ${isRTL ? item.labelAr : (item.labelEn || item.labelAr)}
              </div>
              <div style="font-size: 15px; font-weight: 900; color: ${item.highlight ? '#1e3a8a' : '#0f172a'};">
                ${item.value}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Build Table Headers
    const headersHTML = columns.map(col => `
      <th style="
        padding: 10px 12px;
        background-color: #0F4C81;
        color: #ffffff;
        font-size: 11px;
        font-weight: 800;
        text-align: ${col.align || (isRTL ? 'right' : 'left')};
        border-bottom: 2px solid #0a355c;
        white-space: nowrap;
        width: ${col.width || 'auto'};
      ">
        ${isRTL ? col.headerAr : (col.headerEn || col.headerAr)}
      </th>
    `).join('');

    // Build Table Rows
    const rowsHTML = data.map((row, idx) => {
      const isEven = idx % 2 === 0;
      return `
        <tr style="background-color: ${isEven ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
          ${columns.map(col => {
            let val = '';
            if (typeof col.accessor === 'function') {
              val = String(col.accessor(row) ?? '');
            } else {
              const raw = row[col.accessor as keyof T];
              val = raw !== undefined && raw !== null ? String(raw) : '-';
            }
            return `
              <td style="
                padding: 9px 12px;
                font-size: 11px;
                color: #1e293b;
                text-align: ${col.align || (isRTL ? 'right' : 'left')};
                vertical-align: middle;
                font-weight: 600;
                line-height: 1.4;
              ">
                ${val}
              </td>
            `;
          }).join('')}
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div style="padding: 28px 32px; background: #ffffff;">
        
        <!-- HEADER TOP BAR -->
        <div style="
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          padding-bottom: 16px; 
          border-bottom: 3px solid #0F4C81;
          margin-bottom: 20px;
        ">
          <!-- Right Logo/Company Title -->
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="
              width: 48px; 
              height: 48px; 
              background: linear-gradient(135deg, #0F4C81 0%, #1e293b 100%);
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #f7941d;
              font-weight: 900;
              font-size: 22px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            ">
              🏗️
            </div>
            <div>
              <h1 style="font-size: 16px; font-weight: 900; color: #0F4C81; margin: 0; line-height: 1.2;">
                ${companyNameAr}
              </h1>
              <p style="font-size: 11px; font-weight: 700; color: #64748b; margin: 3px 0 0 0;">
                ${companyNameEn}
              </p>
            </div>
          </div>

          <!-- Left Report Meta Stamp -->
          <div style="text-align: ${isRTL ? 'left' : 'right'};">
            <div style="
              display: inline-block; 
              padding: 4px 10px; 
              background-color: #f1f5f9; 
              border-radius: 6px; 
              border: 1px solid #cbd5e1;
              font-size: 11px;
              font-weight: 800;
              color: #334155;
            ">
              ${refCode}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 5px; font-weight: 600;">
              تاريخ التصدير: ${dateFormattedStr} (${timeFormattedStr})
            </div>
          </div>
        </div>

        <!-- REPORT TITLE BLOCK -->
        <div style="
          margin-bottom: 20px;
          background: linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 14px 18px;
          border-radius: 10px;
          border-${isRTL ? 'right' : 'left'}: 5px solid #F7941D;
        ">
          <h2 style="font-size: 18px; font-weight: 900; color: #0F4C81; margin: 0 0 4px 0;">
            ${titleAr}
          </h2>
          <p style="font-size: 11px; font-weight: 700; color: #475569; margin: 0;">
            ${titleEn} • ${subtitleAr}
          </p>
        </div>

        <!-- SUMMARY CARDS IF ANY -->
        ${summaryCardsHTML}

        <!-- DATA TABLE -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                ${headersHTML}
              </tr>
            </thead>
            <tbody>
              ${rowsHTML.length > 0 ? rowsHTML : `
                <tr>
                  <td colspan="${columns.length}" style="text-align: center; padding: 24px; color: #94a3b8; font-weight: 700; font-size: 12px;">
                    لا توجد بيانات متاحة في هذا التقرير
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>

        <!-- REPORT FOOTER & STAMP -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          font-size: 10px;
          color: #64748b;
          font-weight: 700;
        ">
          <div>
            إجمالي السجلات المسجلة: <strong>${data.length}</strong> سجل • صادر آلياً من نظام إدارة أسطول الأوناش والخدمات اللوجستية
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #10b981;">✓ التقرير معتمد وموقع إلكترونياً</span>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(container);

    if (onProgress) onProgress(isRTL ? 'جاري تحويل التقرير إلى صورة دقيقة...' : 'Rendering high-DPI graphics...');

    // 2. Render to Canvas with high scale for high resolution
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Remove temp node
    document.body.removeChild(container);

    if (onProgress) onProgress(isRTL ? 'جاري إنشاء ملف الـ PDF وتنسيق الصفحات...' : 'Building PDF file...');

    // 3. Convert Canvas to PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 5; // Top margin

    const renderHeight = imgHeight * ratio;

    // Check if multi-page needed
    if (renderHeight <= pdfHeight - 10) {
      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, renderHeight);
    } else {
      // Multi-page slicing logic
      let heightLeft = renderHeight;
      let position = imgY;

      pdf.addImage(imgData, 'JPEG', imgX, position, imgWidth * ratio, renderHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - renderHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', imgX, position, imgWidth * ratio, renderHeight);
        heightLeft -= pdfHeight;
      }
    }

    // 4. Trigger Download
    const cleanFilename = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${now.toISOString().slice(0, 10)}.pdf`;
    pdf.save(cleanFilename);

    if (onProgress) onProgress(isRTL ? 'تم حفظ ملف الـ PDF بنجاح!' : 'PDF downloaded successfully!');
    return true;

  } catch (error) {
    console.error('Error generating PDF report:', error);
    if (onProgress) onProgress(isRTL ? 'حدث خطأ أثناء تصدير الـ PDF' : 'Error generating PDF');
    
    // Clean up if node left
    const orphan = document.getElementById('pdf-export-render-container');
    if (orphan) document.body.removeChild(orphan);

    return false;
  }
}

/**
 * Capture an existing HTML Element (like a rendered table on screen) and export it to PDF
 */
export async function exportElementToPDF(
  elementIdOrRef: string | HTMLElement,
  options: {
    titleAr: string;
    filename?: string;
    isRTL?: boolean;
    orientation?: 'portrait' | 'landscape';
    onProgress?: (status: string) => void;
  }
): Promise<boolean> {
  const { titleAr, filename = 'exported-table', isRTL = true, orientation = 'landscape', onProgress } = options;

  const targetEl = typeof elementIdOrRef === 'string' ? document.getElementById(elementIdOrRef) : elementIdOrRef;
  if (!targetEl) {
    console.error('Target element for PDF export not found:', elementIdOrRef);
    return false;
  }

  try {
    if (onProgress) onProgress(isRTL ? 'جاري التقاط الجدول الحالي...' : 'Capturing table view...');

    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

    const cleanFilename = `${filename}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(cleanFilename);

    if (onProgress) onProgress(isRTL ? 'تم تصدير الـ PDF بنجاح!' : 'Export complete!');
    return true;
  } catch (err) {
    console.error('Failed to export element to PDF', err);
    return false;
  }
}
