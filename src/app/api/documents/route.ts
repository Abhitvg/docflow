import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/documents — list documents (owned + shared)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Owned documents
    const ownedDocs = await prisma.document.findMany({
      where: { ownerId: user.id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarColor: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarColor: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Shared with me
    const sharedDocs = await prisma.document.findMany({
      where: {
        shares: {
          some: { userId: user.id },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarColor: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarColor: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      owned: ownedDocs,
      shared: sharedDocs,
    });
  } catch (error) {
    console.error('Documents list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/documents — create a new document
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = body.title || 'Untitled Document';
    const content = body.content || {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    };

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

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Document create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
