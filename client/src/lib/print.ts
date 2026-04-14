/**
 * Print utilities for optimized page printing
 */

/**
 * List of element classes that should be hidden during printing
 */
export const PRINT_HIDE_CLASSES = [
  'no-print',
  'print-hide',
  'print-exclude'
];

/**
 * Print CSS rules for consistent formatting across all pages
 */
export const PRINT_STYLES = `
  @page {
    size: A4;
    margin: 10mm;
  }

  @media print {
    /* Hide non-print elements */
    ${PRINT_HIDE_CLASSES.map(cls => `.${cls}`).join(', ')} {
      display: none !important;
    }

    /* Ensure color preservation */
    * {
      background-color: white !important;
      color: black !important;
      border-color: currentColor !important;
      print-color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
      -webkit-filter: none !important;
      filter: none !important;
    }

    /* Page break rules */
    .print-page-break {
      page-break-after: always;
      break-after: page;
    }

    .print-avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Text optimization */
    body {
      font-size: 11px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }

    /* Header/Footer */
    .print-header {
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }

    .print-footer {
      margin-top: 20px;
      border-top: 1px solid #ccc;
      padding-top: 10px;
      text-align: center;
      font-size: 10px;
      color: #666;
    }

    /* Table printing */
    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead {
      display: table-header-group;
      border-bottom: 2px solid #000;
    }

    tbody tr:nth-child(odd) {
      background-color: #f5f5f5;
    }

    td, th {
      border: 1px solid #ccc;
      padding: 6px;
      text-align: left;
    }

    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }

    /* Ensure images print */
    img {
      max-width: 100%;
      page-break-inside: avoid;
    }

    /* Links should not print */
    a[href]:after {
      content: none !important;
    }

    /* Prevent orphans and widows */
    p, h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      page-break-inside: avoid;
      orphans: 3;
      widows: 3;
    }
  }
`;

/**
 * Trigger browser print dialog
 * @param title - Document title for the print dialog
 */
export function triggerPrint(title: string = 'Document') {
  const originalTitle = document.title;
  document.title = title;
  window.print();
  document.title = originalTitle;
}

/**
 * Utility class for managing print states
 */
export class PrintManager {
  private static readonly PRINT_CLASS = 'is-printing';

  static get isPrinting(): boolean {
    return document.body.classList.contains(this.PRINT_CLASS);
  }

  static enablePrintMode(): void {
    document.body.classList.add(this.PRINT_CLASS);
  }

  static disablePrintMode(): void {
    document.body.classList.remove(this.PRINT_CLASS);
  }

  static injectPrintStyles(id: string = '__print-styles__'): void {
    if (document.getElementById(id)) return;

    const style = document.createElement('style');
    style.id = id;
    style.textContent = PRINT_STYLES;
    document.head.appendChild(style);
  }
}

/**
 * Print options interface
 */
export interface PrintOptions {
  title?: string;
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  paperSize?: 'A4' | 'Letter' | 'A5';
  orientation?: 'portrait' | 'landscape';
  hideElements?: string[];
}

/**
 * Advanced print configuration
 */
export function configurePrinting(options: PrintOptions): void {
  const { margins = {}, paperSize = 'A4', orientation = 'portrait' } = options;
  const { top = 10, right = 10, bottom = 10, left = 10 } = margins;

  const pageStyle = document.createElement('style');
  pageStyle.id = '__page-config__';
  pageStyle.textContent = `
    @page {
      size: ${paperSize} ${orientation};
      margin: ${top}mm ${right}mm ${bottom}mm ${left}mm;
    }
  `;

  const existing = document.getElementById('__page-config__');
  if (existing) existing.remove();
  document.head.appendChild(pageStyle);

  // Hide specified elements
  if (options.hideElements) {
    const hideStyle = document.createElement('style');
    hideStyle.id = '__hide-elements__';
    hideStyle.textContent = options.hideElements
      .map(selector => `${selector} { display: none !important; }`)
      .join('\n');
    document.head.appendChild(hideStyle);
  }
}

/**
 * Format page number in print footer
 */
export function getPageNumberScript(): string {
  return `
    <script>
      function addPageNumbers() {
        let pageNum = 1;
        const pages = document.querySelectorAll('.page-break');
        pages.forEach((page, index) => {
          const footer = document.createElement('div');
          footer.className = 'print-footer';
          footer.textContent = 'Page ' + (index + 1) + ' of ' + pages.length;
          page.appendChild(footer);
        });
      }
      addPageNumbers();
    </script>
  `;
}
