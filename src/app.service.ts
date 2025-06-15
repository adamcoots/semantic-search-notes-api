import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from 'drizzle/db';
import { NoteTable } from 'drizzle/schema';
import { OpenAI } from 'openai';

@Injectable()
export class AppService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  getHello(): string {
    return 'Hello Notes!';
  }

  async createNote({ content }: { content: string }) {
    const resp = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content,
    });

    const embedding = resp.data[0].embedding;

    return db.insert(NoteTable).values({ content, embedding }).returning();
  }

  async search(query: string, k = 5, similarityThreshold: number = 0.4) {
    // 1. embed the query
    const resp = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    const qVec = resp.data[0].embedding;
    const qVecString = JSON.stringify(qVec);

    // 2. k‑NN search via the `<->` operator (cosine distance)
    const results = await db
      .select()
      .from(NoteTable)
      .where(
        sql`${NoteTable.embedding} <-> ${qVecString}::vector <= ${1 - similarityThreshold}`,
      )
      .orderBy(sql`${NoteTable.embedding} <-> ${qVecString}::vector`)
      .limit(k);

    return results;
  }
}
