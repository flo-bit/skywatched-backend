import { SQLQueryBindings } from "bun:sqlite";
import { db } from ".";
import { getAllRated, getProfile } from "../atp";
import { getFormattedDetails } from "../tmdb";
import { SWPostRecord, type SWPost } from "../types";

export function createPostsTable() {
  db.run(`
	CREATE TABLE IF NOT EXISTS posts (
		uri TEXT PRIMARY KEY,
		cid TEXT NOT NULL,

		author_did TEXT NOT NULL,
		author_handle TEXT NOT NULL,
		author_displayName TEXT,
		author_avatar TEXT,

		indexedAt TEXT NOT NULL,

		record_type TEXT NOT NULL,
		record_item TEXT NOT NULL,

		record_createdAt TEXT,
		record_updatedAt TEXT,

		record_title TEXT,
		record_text TEXT,

		record_rating INTEGER,

		record_crosspost_uri TEXT,

		crosspost_likes INTEGER,
		crosspost_reposts INTEGER,
		crosspost_replies INTEGER,

		record_likes INTEGER
	);

	CREATE INDEX IF NOT EXISTS idx_uri ON posts (uri);
	CREATE INDEX IF NOT EXISTS idx_author_did ON posts (author_did);
	CREATE INDEX IF NOT EXISTS idx_indexedAt ON posts (indexedAt);

	CREATE INDEX IF NOT EXISTS idx_item ON posts (record_item);
	CREATE INDEX IF NOT EXISTS idx_crosspost_uri ON posts (record_crosspost_uri);
	CREATE INDEX IF NOT EXISTS idx_likes ON posts (record_likes);
	`);
}

function transformPostRecordToPost(record: SWPostRecord): SWPost {
  return {
    post: {
      uri: record.uri,
      cid: record.cid,
      indexedAt: record.indexedAt,

      author: {
        did: record.author_did,
        handle: record.author_handle,
        displayName: record.author_displayName,
        avatar: record.author_avatar,
      },

      record: {
        $type: record.record_type,
        item: record.record_item,
        title: record.record_title,
        text: record.record_text,
        rating: record.record_rating,
      },
      crosspost: record.record_crosspost_uri
        ? {
            uri: record.record_crosspost_uri,
          }
        : undefined,
    },
  };
}

export function getPost(uri: string): SWPost | null {
  const row = db.query("SELECT * FROM posts WHERE uri = ?").get(uri) as
    | SWPostRecord
    | undefined;
  return row ? transformPostRecordToPost(row) : null;
}

// get the most recent created posts with pagination
export function getMostRecentPosts(
  limit: number = 100,
  cursor: string | null = null
): SWPost[] {
  let sql = "SELECT * FROM posts WHERE 1=1";
  const params: (string | number)[] = [];

  if (cursor) {
    sql += " AND createdAt < ?";
    params.push(cursor);
  }

  sql += " ORDER BY createdAt DESC LIMIT ?";
  params.push(limit);

  const rows = db.query(sql).all(...params) as SWPostRecord[];
  return rows.map((row) => transformPostRecordToPost(row));
}

// get the most recent posts for a specific user
export function getAuthorFeed(
  user_did: string,
  limit: number = 100,
  cursor: string | null = null
): SWPost[] {
  let sql = "SELECT * FROM posts WHERE author_did = ?";
  const params: (string | number)[] = [user_did];

  if (cursor) {
    sql += " AND createdAt < ?";
    params.push(cursor);
  }

  sql += " ORDER BY createdAt DESC LIMIT ?";
  params.push(limit);

  const rows = db.query(sql).all(...params) as SWPostRecord[];
  return rows.map((row) => transformPostRecordToPost(row));
}

export function getItemFeed(
  item_ref: string,
  item_value: string,
  limit: number = 100,
  cursor: string | null = null
): SWPost[] {
  let sql = "SELECT * FROM posts WHERE record_item_ref = ? AND record_item = ?";
  const params: (string | number)[] = [item_ref, item_value];

  if (cursor) {
    sql += " AND createdAt < ?";
    params.push(cursor);
  }

  sql += " ORDER BY createdAt DESC LIMIT ?";
  params.push(limit);

  const rows = db.query(sql).all(...params) as SWPostRecord[];
  return rows.map((row) => transformPostRecordToPost(row));
}

export function getActorsHavingPosts(): string[] {
  const rows = db.query("SELECT DISTINCT author_did FROM posts").all() as {
    author_did: string;
  }[];
  return rows.map((row) => row.author_did);
}

export function deleteAllPostsOfActor(user_did: string): void {
  const sql = "DELETE FROM posts WHERE author_did = ?";
  db.query(sql).run(user_did);
}

export function createPost(record: SWPost): void {
  const sql = `
    INSERT INTO posts (
      uri, cid, 
      
      author_did, author_handle, author_displayName, author_avatar, 
      
      indexedAt, createdAt, updatedAt,
      
      record_type, 
      
      record_item_ref, record_item_value,
      
      record_note_value, record_note_createdAt, record_note_updatedAt,
      
      record_rating_value, record_rating_createdAt,
      
      record_metadata_title, record_metadata_poster_path, record_metadata_backdrop_path, record_metadata_tagline, record_metadata_overview, record_metadata_genres, record_metadata_release_date,
      
      record_crosspost_uri, record_crosspost_likes, record_crosspost_reposts, record_crosspost_replies
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  const params = [
    record.uri,
    record.cid,
    record.author.did,
    record.author.handle,
    record.author.displayName,
    record.author.avatar,
    record.indexedAt,
    record.createdAt,
    record.updatedAt,
    record.record.$type,
    record.record.item.ref,
    record.record.item.value,
    record.record.note?.value ?? null,
    record.record.note?.createdAt ?? null,
    record.record.note?.updatedAt ?? null,
    record.record.rating?.value ?? null,
    record.record.rating?.createdAt ?? null,

    record.record.metadata?.title ?? null,
    record.record.metadata?.poster_path ?? null,
    record.record.metadata?.backdrop_path ?? null,
    record.record.metadata?.tagline ?? null,
    record.record.metadata?.overview ?? null,
    record.record.metadata?.genres?.join(",") ?? null,
    record.record.metadata?.release_date ?? null,

    record.record.crosspost?.uri ?? null,
    record.record.crosspost?.likes ?? null,
    record.record.crosspost?.reposts ?? null,
    record.record.crosspost?.replies ?? null,
  ];
  db.query(sql).run(...(params as SQLQueryBindings[]));
}

export async function backfillUserIfNecessary(did: string): Promise<void> {
  // check if at least one record exists for this user
  const records = getAuthorFeed(did, 1);
  if (records.length !== 0) return;

  const items = await getAllRated({ did });
  const profile = await getProfile({ did });

  for (const item of items) {
    if (item.value.item.ref !== "tmdb:s" && item.value.item.ref !== "tmdb:m") {
      continue;
    }

    const metadata = await getFormattedDetails(
      item.value.item.value,
      item.value.item.ref
    );

    createPost({
      uri: item.uri,
      cid: item.cid,
      author: {
        did: did,
        handle: profile.handle,
        displayName: profile.displayName,
        avatar: profile.avatar,
      },
      indexedAt:
        item.value.note?.createdAt ??
        item.value.rating?.createdAt ??
        new Date().toISOString(),
      createdAt:
        item.value.note?.createdAt ??
        item.value.rating?.createdAt ??
        new Date().toISOString(),
      updatedAt:
        item.value.note?.updatedAt ??
        item.value.rating?.createdAt ??
        new Date().toISOString(),
      record: {
        $type: item.value.$type,
        item: item.value.item,
        rating: item.value.rating,
        note: item.value.note,
        metadata,
      },
    });
  }
}
