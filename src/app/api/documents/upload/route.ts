import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { convertTxtToTiptap, convertMdToHtml, convertDocxToHtml, convertPdfToTiptap, htmlToTiptapWrapper } from '@/lib/fileConverter';

// POST /api/documents/upload — upload file and create document
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['.txt', '.md', '.docx', '.pdf'];
    const fileName = file.name.toLowerCase();
    const ext = '.' + fileName.split('.').pop();

    if (!allowedTypes.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size: 10MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let content: any;
    let importHtml: string | undefined;
    const title = file.name.replace(/\.[^/.]+$/, ''); // Remove extension

    switch (ext) {
      case '.txt':
        content = convertTxtToTiptap(buffer.toString('utf-8'));
        break;
      case '.md': {
        const html = await convertMdToHtml(buffer.toString('utf-8'));
        const wrapper = htmlToTiptapWrapper(html);
        importHtml = wrapper.__importHtml;
        content = { type: 'doc', content: [{ type: 'paragraph' }] };
        break;
      }
      case '.docx': {
        const html = await convertDocxToHtml(buffer);
        const wrapper = htmlToTiptapWrapper(html);
        importHtml = wrapper.__importHtml;
        content = { type: 'doc', content: [{ type: 'paragraph' }] };
        break;
      }
      case '.pdf':
        content = await convertPdfToTiptap(buffer);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        title,
        content,
        ownerId: user.id,
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarColor: true } },
      },
    });

    return NextResponse.json({
      document,
      importHtml, // Frontend will use this to set editor content from HTML
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
