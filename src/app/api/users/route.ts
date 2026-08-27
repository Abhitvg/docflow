import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/users — list all users (for sharing UI)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatarColor: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
