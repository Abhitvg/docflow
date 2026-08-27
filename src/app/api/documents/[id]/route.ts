import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// Check if user has access to document
async function checkAccess(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      shares: true,
      owner: { select: { id: true, name: true, email: true, avatarColor: true } },
    },
  });

  if (!doc) return { doc: null, permission: null };

  if (doc.ownerId === userId) {
    return { doc, permission: 'owner' as const };
  }

  const share = doc.shares.find((s) => s.userId === userId);
  if (share) {
    return { doc, permission: share.permission };
  }

  return { doc: null, permission: null };
}

// GET /api/documents/[id]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { doc, permission } = await checkAccess(id, user.id);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarColor: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarColor: true } },
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    return NextResponse.json({ document, permission });
  } catch (error) {
    console.error('Document get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/documents/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { doc, permission } = await checkAccess(id, user.id);

    if (!doc) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    if (permission === 'view') {
      return NextResponse.json({ error: 'View-only access' }, { status: 403 });
    }

    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;

    // Save version if content changed
    if (body.content !== undefined && body.saveVersion) {
      await prisma.documentVersion.create({
        data: {
          documentId: id,
          title: doc.title,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: doc.content as any,
          createdBy: user.id,
        },
      });
    }

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true, avatarColor: true } },
      },
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Document update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/documents/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await prisma.document.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the owner can delete' }, { status: 403 });
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
