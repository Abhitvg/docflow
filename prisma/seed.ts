import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.documentVersion.deleteMany();
  await prisma.share.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();

  // Create seeded users
  const alice = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@docflow.dev',
      avatarColor: '#6366f1', // Indigo
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Williams',
      email: 'bob@docflow.dev',
      avatarColor: '#ec4899', // Pink
    },
  });

  const charlie = await prisma.user.create({
    data: {
      name: 'Charlie Brown',
      email: 'charlie@docflow.dev',
      avatarColor: '#14b8a6', // Teal
    },
  });

  // Create sample documents
  const doc1 = await prisma.document.create({
    data: {
      title: 'Project Kickoff Notes',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Project Kickoff Notes' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Welcome to the ' },
              { type: 'text', marks: [{ type: 'bold' }], text: 'DocFlow' },
              { type: 'text', text: ' project! This document was created as a sample to demonstrate the editing capabilities.' },
            ],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Key Features' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rich text editing with formatting toolbar' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Document sharing between users' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'File upload and conversion' }] }],
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', marks: [{ type: 'italic' }], text: 'Try editing this document to explore the features!' },
            ],
          },
        ],
      },
      ownerId: alice.id,
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      title: 'Meeting Agenda — Q3 Planning',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Q3 Planning Meeting' }],
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Agenda' }],
          },
          {
            type: 'orderedList',
            content: [
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Review Q2 results' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Set Q3 objectives' }] }],
              },
              {
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Assign team leads' }] }],
              },
            ],
          },
        ],
      },
      ownerId: bob.id,
    },
  });

  // Share doc1 with Bob (edit) and Charlie (view)
  await prisma.share.create({
    data: {
      documentId: doc1.id,
      userId: bob.id,
      permission: 'edit',
    },
  });

  await prisma.share.create({
    data: {
      documentId: doc1.id,
      userId: charlie.id,
      permission: 'view',
    },
  });

  // Share doc2 with Alice
  await prisma.share.create({
    data: {
      documentId: doc2.id,
      userId: alice.id,
      permission: 'edit',
    },
  });

  console.log('✅ Seeded 3 users, 2 documents, 3 shares');
  console.log(`   Alice: ${alice.id} (${alice.email})`);
  console.log(`   Bob:   ${bob.id} (${bob.email})`);
  console.log(`   Charlie: ${charlie.id} (${charlie.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
