import { db, getRecord } from "../database";

type LikeRecord = {
  uri: string;
  author_did: string;
  subject_cid: string;
  subject_uri: string;
  createdAt: string;
};

export async function saveLikeToDatabase(json: LikeRecord) {
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

export async function deleteLikeFromDatabase(json: LikeRecord) {
  db.query("DELETE FROM likes WHERE uri = ?").run(json.uri);
}

export async function getLikesByUser(did: string) {
  return db
    .query(
      "SELECT * FROM likes WHERE author_did = ? ORDER BY createdAt DESC LIMIT 100"
    )
    .all(did);
}

export async function getAllUsersWithLikes() {
  return db
    .query("SELECT DISTINCT author_did FROM likes")
    .all()
    .map((row: any) => row.author_did);
}
