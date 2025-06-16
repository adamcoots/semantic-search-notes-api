import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from 'drizzle/db';
import { NoteEmbeddingTable, NoteTable } from 'drizzle/schema';
import { OpenAI } from 'openai';
import { chunk } from './shared/utils/chunk';

const EMBEDDING_MODEL = 'text-embedding-3-small';

@Injectable()
export class AppService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  getHello(): string {
    return 'Hello Notes!';
  }

  async createNote({ content }: { content: string }) {
    const [note] = await db.insert(NoteTable).values({ content }).returning();

    const chunks = chunk(content);

    const embedPromises = chunks.map((chunk) =>
      this.openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: chunk,
      }),
    );
    const embedResponses = await Promise.all(embedPromises);

    const chunkRows = chunks.map((chunk, idx) => ({
      noteId: note.id,
      embedding: normalize(embedResponses[idx].data[0].embedding),
      content: chunk,
      chunkIndex: idx,
    }));

    await db.insert(NoteEmbeddingTable).values(chunkRows);

    return note;
  }

  async search(query: string, k = 20, maxDistance: number = 0.8) {
    if (!query) {
      return [];
    }

    const resp = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    const qVec = resp.data[0].embedding;
    const normalized = normalize(qVec);
    const qVecString = JSON.stringify(normalized);

    const qVecSql = sql.raw(`'${qVecString}'::vector`);
    const distanceExpr = sql<number>`
      ${NoteEmbeddingTable.embedding} <=> ${qVecSql}
    `;

    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const patterns = keywords.map((kw) => `%${kw}%`);

    const keywordMatchExpr = sql`
      ${NoteEmbeddingTable.content} ILIKE ANY (
        ARRAY[${sql.join(
          patterns.map((p) => sql`${p}`),
          sql`, `,
        )}]
      )
    `;

    const filterExpr = sql<boolean>`
      ${distanceExpr} <= ${maxDistance}
      OR
      ${keywordMatchExpr}
    `;

    const chunkResults = await db
      .select({
        noteId: NoteEmbeddingTable.noteId,
        chunkIndex: NoteEmbeddingTable.chunkIndex,
        content: NoteEmbeddingTable.content,
        distance: distanceExpr,
        keywordMatch: keywordMatchExpr,
      })
      .from(NoteEmbeddingTable)
      .where(filterExpr)
      .orderBy(sql`${keywordMatchExpr} DESC`, distanceExpr)
      .limit(k);

    const bestByNote = new Map<string, (typeof chunkResults)[0]>();
    for (const row of chunkResults) {
      const prev = bestByNote.get(row.noteId);
      if (!prev || row.distance < prev.distance) {
        bestByNote.set(row.noteId, row);
      }
    }

    const noteIds = Array.from(bestByNote.keys());

    if (noteIds.length === 0) {
      // no chunks matched → no notes to fetch
      return [];
    }

    const notePromises = noteIds.map((id) =>
      db
        .select()
        .from(NoteTable)
        .where(sql`id = ${id}`),
    );

    const noteResults = await Promise.all(notePromises);

    return noteResults.map(([note]) => {
      const { distance, keywordMatch, content } = bestByNote.get(note.id)!;
      return {
        // ...note,
        snippet: content,
        confidence: keywordMatch
          ? Confidence.HIGH
          : getConfidenceRating(distance),
        distance,
      };
    });
  }
}

export enum Confidence {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

function getConfidenceRating(distance: number): Confidence {
  if (distance < 0.6) {
    return Confidence.HIGH;
  }
  if (distance < 0.7) {
    return Confidence.MEDIUM;
  }
  return Confidence.LOW;
}

function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
  return vector.map((x) => x / norm);
}
