import { db, getRecord } from "../database";

type LikeRecord = {
  uri: string;
  author_did: string;
  subject_cid: string;
  subject_uri: string;
  createdAt: string;
};

export function createLikesTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      uri TEXT PRIMARY KEY,
      author_did TEXT NOT NULL,
      subject_cid TEXT NOT NULL,
      subject_uri TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_uri ON likes (uri);
    CREATE INDEX IF NOT EXISTS idx_author_did ON likes (author_did);
    CREATE INDEX IF NOT EXISTS idx_subject_uri ON likes (subject_uri);
    CREATE INDEX IF NOT EXISTS idx_createdAt ON likes (createdAt);
  `);
}

export function saveLikeToDatabase(json: LikeRecord) {
  // first check if the like already exists
  const existingLike = db
    .query("SELECT * FROM likes WHERE author_did = ? AND subject_uri = ?")
    .get(json.author_did, json.subject_uri);
  if (existingLike) return;

  // check if the record exists
  const record = getRecord(json.subject_uri);
  if (!record) return;

  // save the like to the database
  const sql =
    "INSERT INTO likes (uri, author_did, subject_cid, subject_uri, createdAt) VALUES (?, ?, ?, ?, ?)";
  db.query(sql).run(
    json.uri,
    json.author_did,
    json.subject_cid,
    json.subject_uri,
    json.createdAt
  );

  // update the record with the new like count
  const newLikes = record.record.likes ? record.record.likes + 1 : 1;
  db.query("UPDATE records SET record_likes = ? WHERE uri = ?").run(
    newLikes,
    json.subject_uri
  );
}

export function deleteLikeFromDatabase(json: LikeRecord) {
  db.query("DELETE FROM likes WHERE uri = ?").run(json.uri);
}

export function getLikesByUser(did: string) {
  return db
    .query(
      "SELECT * FROM likes WHERE author_did = ? ORDER BY createdAt DESC LIMIT 100"
    )
    .all(did);
}

export function getAllUsersWithLikes() {
  return db
    .query("SELECT DISTINCT author_did FROM likes")
    .all()
    .map((row: any) => row.author_did);
}
