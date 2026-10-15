import pdf from 'pdf-parse';

export async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string; pages: number; error?: string }> {
  try {
    const data = await pdf(buffer);
    return {
      text: data.text || '',
      pages: data.numpages || 1,
    };
  } catch (err: any) {
    return {
      text: '',
      pages: 0,
      error: err?.message || 'Failed to extract text from PDF',
    };
  }
}
