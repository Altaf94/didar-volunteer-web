import jsPDF from "jspdf";

const REQUIRED_FIELDS = ["field1", "field2", "field3", "field4", "field5"];

/**
 * CSV ki jagah list of objects aayegi
 * Har object mein field1-field6 hone chahiye
 *
 * @param {Array<Object>} data - e.g. [{ field1: "abc", field2: "xyz", ... }, ...]
 * @returns {Array<Array<string>>} - stickers array
 */
function readData(data) {
  const stickers = [];

  const missing = REQUIRED_FIELDS.filter(
    (field) => !(field in (data[0] || {}))
  );
  if (missing.length > 0) {
    throw new Error(`Missing columns: ${missing}`);
  }

  for (const row of data) {
    stickers.push(REQUIRED_FIELDS.map((field) => (row[field] || "").trim()));
  }

  return stickers;
}

function fitFontSize(pdf, lines, maxWidth, startingSize = 16, minSize = 8) {
  const fontName = "Helvetica";

  for (let size = startingSize; size >= minSize; size--) {
    const allFit = lines.every((line) => {
      pdf.setFont(fontName, "bold");
      pdf.setFontSize(size);
      return pdf.getStringUnitWidth(line) * size * (25.4 / 72) <= maxWidth;
    });
    if (allFit) {
      return size;
    }
  }

  return minSize;
}

function drawSticker(pdf, pageWidth, pageHeight, lines) {
  // Center point of sticker
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;

  // Usable text area after rotation (page width becomes available height for rotated text)
  const usableHeight = pageWidth * 0.80;

  // Auto-fit font size
  const fontSize = fitFontSize(pdf, lines, usableHeight, 15, 8);

  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(fontSize);

  // Line spacing: convert from points to mm (matching Python's point-based spacing)
  const lineGapMM = (fontSize + 8) * (25.4 / 72);

  const totalWidthMM = lineGapMM * (lines.length - 1);

  // Horizontal centering of all lines (spread left to right)
  const startX = centerX - totalWidthMM / 2;

  // Draw each line rotated 90 degrees CCW, spread horizontally
  for (let i = 0; i < lines.length; i++) {
    // Each line at a different x position (left to right)
    // Add extra gap before field5 (index 4) for line break
    const isLast = i === lines.length - 1;
    let posX = startX + i * lineGapMM;
    if (isLast) {
      posX += lineGapMM * 0.6; // extra spacing before the final (small/italic) field
    }

    // Last field: smaller, italic font. Others remain bold.
    if (isLast) {
      pdf.setFont("Helvetica", "italic");
      pdf.setFontSize(fontSize - 4);
    } else {
      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(fontSize);
    }

    // Calculate text width in mm for vertical centering
    const currentSize = isLast ? fontSize - 2 : fontSize;
    const textWidthMM =
      (pdf.getStringUnitWidth(lines[i]) * currentSize * 25.4) / 72;

    // With angle=90, text flows upward from anchor point
    // To center vertically: place anchor at centerY + textWidth/2
    const posY = centerY + textWidthMM / 2;

    pdf.text(lines[i], posX, posY, {
      angle: 90,
    });
  }

  // Reset font
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(fontSize);
}

/**
 * Generate sticker PDF from list of objects
 *
 * @param {Array<Object>} data - list of objects with field1-field6
 * @param {string} [outputFilename] - download filename (auto-generated if not provided)
 */
export function generatePdf(data, outputFilename) {
  if (!outputFilename) {
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    outputFilename = `stickers_${timestamp}.pdf`;
  }
  const stickers = readData(data);

  // 2.5 x 2.0 inch in mm
  const pageWidth = 2.5 * 25.4; // 63.5 mm
  const pageHeight = 2.0 * 25.4; // 50.8 mm

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pageWidth, pageHeight],
  });

  for (let i = 0; i < stickers.length; i++) {
    if (i > 0) {
      pdf.addPage([pageWidth, pageHeight]);
    }
    // Prepare lines for this sticker. If field2 (index 1) is long, split into two lines.
    const rawLines = stickers[i].slice();

    if (rawLines[1] && typeof rawLines[1] === 'string') {
      const field2 = rawLines[1].trim();

      // Simple heuristic: split into two lines if longer than 18 chars and contains spaces
      if (field2.length > 18 && field2.includes(' ')) {
        const words = field2.split(/\s+/);
        if (words.length > 1) {
          const totalChars = field2.length;
          let first = '';
          let second = '';

          for (let w of words) {
            if ((first + ' ' + w).trim().length <= Math.ceil(totalChars / 2) || first === '') {
              first = (first + ' ' + w).trim();
            } else {
              second = (second + ' ' + w).trim();
            }
          }

          // Fallback: if second ended empty, split by half of string
          if (!second) {
            const mid = Math.floor(field2.length / 2);
            const splitAt = Math.max(field2.lastIndexOf(' ', mid), mid);
            first = field2.slice(0, splitAt).trim();
            second = field2.slice(splitAt).trim();
          }

          // Replace field2 with two lines (inserting at index 1)
          rawLines.splice(1, 1, first, second);
        }
      }
    }

    drawSticker(pdf, pageWidth, pageHeight, rawLines);
  }

  pdf.save(outputFilename);
}

export default generatePdf;
