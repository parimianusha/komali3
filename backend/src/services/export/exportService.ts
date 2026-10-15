import { DocumentRecord } from '../../shared/index.js';

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '';

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // CSV injection mitigation: neutralise active formula prefixes
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If contains commas, double quotes, or newlines, wrap in quotes and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function exportDocumentsAsJson(documents: DocumentRecord[]): string {
  const sanitized = documents.map((doc) => {
    const extraction = doc.latest_extraction?.result;
    return {
      id: doc.id,
      original_name: doc.original_name,
      mime_type: doc.mime_type,
      size_bytes: doc.size_bytes,
      category: doc.category,
      custom_category: doc.custom_category,
      status: doc.status,
      created_at: doc.created_at,
      processed_at: doc.processed_at,
      tags: doc.tags || [],
      ai_summary: extraction?.summary || null,
      extracted_fields: extraction?.fields || [],
      warnings: extraction?.warnings || [],
      reviews: (doc.reviews || []).map((r) => ({
        field_key: r.field_key,
        original_value: r.original_value,
        corrected_value: r.corrected_value,
        verified: r.verified,
        note: r.note,
        updated_at: r.updated_at,
      })),
    };
  });

  return JSON.stringify(sanitized, null, 2);
}

export function exportDocumentsAsCsv(documents: DocumentRecord[]): string {
  const headers = [
    'Document ID',
    'Document Name',
    'Category',
    'Status',
    'Size (Bytes)',
    'Uploaded At',
    'Processed At',
    'AI Summary',
    'Field Key',
    'Field Label',
    'AI Value',
    'AI Confidence',
    'AI Evidence',
    'User Corrected Value',
    'Verified',
    'Review Note',
  ];

  const rows: string[][] = [];

  for (const doc of documents) {
    const extraction = doc.latest_extraction?.result;
    const fields = extraction?.fields || [];
    const reviewsMap = new Map<string, any>();
    for (const r of doc.reviews || []) {
      reviewsMap.set(r.field_key, r);
    }

    if (fields.length === 0) {
      // Single row without fields
      rows.push([
        doc.id,
        doc.original_name,
        doc.category,
        doc.status,
        String(doc.size_bytes),
        doc.created_at,
        doc.processed_at || '',
        extraction?.summary || '',
        '',
        '',
        '',
        '',
        '',
        '',
        'false',
        '',
      ]);
    } else {
      for (const f of fields) {
        const review = reviewsMap.get(f.key);
        rows.push([
          doc.id,
          doc.original_name,
          doc.category,
          doc.status,
          String(doc.size_bytes),
          doc.created_at,
          doc.processed_at || '',
          extraction?.summary || '',
          f.key,
          f.label,
          f.value || '',
          f.confidence !== null && f.confidence !== undefined ? f.confidence.toFixed(2) : '',
          f.evidence || '',
          review ? String(review.corrected_value ?? '') : '',
          review ? String(review.verified) : 'false',
          review?.note || '',
        ]);
      }
    }
  }

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  return csvContent;
}
