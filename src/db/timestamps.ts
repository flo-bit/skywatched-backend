import { db } from ".";

export function createTimestampsTable() {
  db.run(`CREATE TABLE IF NOT EXISTS latest_indexedAt (
		indexedAt TEXT PRIMARY KEY
	);

	CREATE INDEX IF NOT EXISTS idx_indexedAt ON latest_indexedAt (indexedAt);`);
}

// Function to get the latest timestamp (either creation or update)
export function getLatestTimestamp(): string | null {
  const row = db
    .query("SELECT MAX(indexedAt) AS latest FROM latest_indexedAt;")
    .get() as { latest: string } | undefined;
  return row?.latest ?? null;
}

export function setLatestTimestamp(indexedAt: string): void {
  db.query("DELETE FROM latest_indexedAt").run();
  db.query(
    "INSERT OR REPLACE INTO latest_indexedAt (indexedAt) VALUES (?)"
  ).run(indexedAt);
}
