import mammoth from 'mammoth';
import { marked } from 'marked';

// Convert plain text to Tiptap JSON
export function convertTxtToTiptap(text: string) {
  const lines = text.split('\n');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [];

  for (const line of lines) {
    if (line.trim() === '') {
      content.push({ type: 'paragraph' });
    } else {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      });
    }
  }

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
}

// Convert Markdown to Tiptap-compatible HTML (then let frontend parse it)
export async function convertMdToHtml(markdown: string): Promise<string> {
  const html = await marked(markdown, { async: true });
  return html;
}

// Convert .docx buffer to HTML
export async function convertDocxToHtml(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer });
  return result.value;
}

// Convert PDF to text (basic extraction)
export async function convertPdfToTiptap(buffer: Buffer) {
  // Dynamic import to handle pdf-parse's node-specific dependencies
  const pdfParseModule = await import('pdf-parse');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;
  const data = await pdfParse(buffer);
  return convertTxtToTiptap(data.text);
}

// Convert HTML string to a basic Tiptap JSON structure
// This is a simplified version - the frontend will do final parsing via editor.commands.setContent
export function htmlToTiptapWrapper(html: string) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '__HTML_IMPORT__',
          },
        ],
      },
    ],
    __importHtml: html,
  };
}
