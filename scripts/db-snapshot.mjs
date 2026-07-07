// Crea una copia CONSISTENTE de la base SQLite en <destino>, usando `VACUUM INTO`.
// A diferencia de un `cp` crudo, esto incluye los cambios que aún viven en el WAL
// (local.db-wal) y produce un solo archivo limpio, aunque la app esté corriendo.
//
// Uso: node scripts/db-snapshot.mjs <archivo-destino>
// Fuente: $DATABASE_URL o ./local.db (relativo al cwd).
import Database from 'better-sqlite3';
import { rmSync } from 'node:fs';

const dest = process.argv[2];
if (!dest) {
	console.error('uso: node scripts/db-snapshot.mjs <archivo-destino>');
	process.exit(1);
}

const src = process.env.DATABASE_URL ?? './local.db';
rmSync(dest, { force: true });

const db = new Database(src);
db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
db.close();

console.log(`snapshot: ${src} -> ${dest}`);
