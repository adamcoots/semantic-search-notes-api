import {
  pgTable,
  timestamp,
  uuid,
  text,
  vector,
  index,
  integer,
} from 'drizzle-orm/pg-core';

const createdAt = timestamp('created_at', { withTimezone: true })
  .notNull()
  .defaultNow();

const updatedAt = timestamp('updated_at', { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

export const NoteTable = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  createdAt,
  updatedAt,
});

export const NoteEmbeddingTable = pgTable(
  'note_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    noteId: uuid('note_id')
      .notNull()
      .references(() => NoteTable.id, { onDelete: 'cascade' }),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
    content: text('content').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index('note_embeddings_embedding_idx')
      .using('ivfflat', table.embedding.op('vector_cosine_ops'))
      .with({ lists: 100 }),
  ],
);
