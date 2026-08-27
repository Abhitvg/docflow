import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/documents/[id]/share — list shares
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await prisma.document.findUnique({ where: { id } });

    if (!doc || doc.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the owner can manage sharing' }, { status: 403 });
    }

    const shares = await prisma.share.findMany({
      where: { documentId: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarColor: true } },
      },
    });

    return NextResponse.json({ shares });
  } catch (error) {
    console.error('Share list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/documents/[id]/share — share with a user
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await prisma.document.findUnique({ where: { id } });

    if (!doc || doc.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the owner can share' }, { status: 403 });
    }

    const { email, permission = 'edit' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!['view', 'edit'].includes(permission)) {
      return NextResponse.json({ error: 'Permission must be "view" or "edit"' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
    }

    // Upsert share
    const share = await prisma.share.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: targetUser.id,
        },
      },
      update: { permission },
      create: {
        documentId: id,
        userId: targetUser.id,
        permission,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarColor: true } },
      },
    });

    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    console.error('Share create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/documents/[id]/share — remove a share
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const doc = await prisma.document.findUnique({ where: { id } });

    if (!doc || doc.ownerId !== user.id) {
      return NextResponse.json({ error: 'Only the owner can manage sharing' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await prisma.share.delete({
      where: {
        documentId_userId: {
          documentId: id,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Share delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
