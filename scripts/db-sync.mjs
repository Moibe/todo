// Sincroniza los DATOS (no el esquema) entre DEV (tu máquina) y PROD (droplet),
// por SNAPSHOT: copia consistente que SOBREESCRIBE el destino. Una dirección a la
// vez; siempre deja un backup con timestamp del destino antes de pisarlo.
//
//   node scripts/db-sync.mjs push   →  DEV → PROD  (sube tus datos locales)
//   node scripts/db-sync.mjs pull   →  PROD → DEV  (baja los datos del droplet)
//
// Requisitos:
//   - ssh/scp configurados hacia el droplet (los mismos que usas a mano).
//   - `scripts/db-snapshot.mjs` desplegado en el droplet (para `pull`): asegúrate
//     de haber hecho deploy de estos scripts al menos una vez.
//
// Config (opcional, por env): TODO_SSH, TODO_REMOTE_DIR, TODO_PM2.
import { execFileSync } from 'node:child_process';
import { existsSync, copyFileSync, rmSync } from 'node:fs';

const REMOTE = process.env.TODO_SSH ?? 'root@165.22.53.200';
const REMOTE_DIR = process.env.TODO_REMOTE_DIR ?? '~/code/todo';
const PM2_NAME = process.env.TODO_PM2 ?? 'todo';

const LOCAL_DB = './local.db';
const TMP = './.dbsync-tmp.db'; // ruta relativa (sin ':') para que scp no la lea como host
const REMOTE_TMP = '/tmp/todo-dbsync.db';

const dir = process.argv[2];

function sh(cmd, args) {
	execFileSync(cmd, args, { stdio: 'inherit' });
}
function stamp() {
	return new Date().toISOString().replace(/[:.]/g, '-');
}

if (dir === 'push') {
	console.log('→ Snapshot de DEV…');
	sh('node', ['scripts/db-snapshot.mjs', TMP]);

	console.log('→ Enviando snapshot a PROD…');
	sh('scp', [TMP, `${REMOTE}:${REMOTE_TMP}`]);

	console.log('→ Reemplazando DB en PROD (backup + pm2 restart)…');
	const remote = [
		`cd ${REMOTE_DIR}`,
		`cp local.db "local.db.bak-$(date +%Y%m%d-%H%M%S)" 2>/dev/null || true`,
		`pm2 stop ${PM2_NAME} || true`,
		`rm -f local.db-wal local.db-shm`,
		`cp ${REMOTE_TMP} local.db`,
		`(pm2 restart ${PM2_NAME} || pm2 start build/index.js --name ${PM2_NAME})`,
		`pm2 save`,
		`rm -f ${REMOTE_TMP}`
	].join(' && ');
	sh('ssh', [REMOTE, remote]);

	rmSync(TMP, { force: true });
	console.log('✅ DEV → PROD listo. Los datos de tu máquina ahora están en el droplet.');
} else if (dir === 'pull') {
	console.log('→ Snapshot de PROD…');
	sh('ssh', [REMOTE, `cd ${REMOTE_DIR} && node scripts/db-snapshot.mjs ${REMOTE_TMP}`]);

	console.log('→ Trayendo snapshot a DEV…');
	sh('scp', [`${REMOTE}:${REMOTE_TMP}`, TMP]);

	console.log('→ Reemplazando DB local (backup)…');
	if (existsSync(LOCAL_DB)) {
		const bak = `${LOCAL_DB}.bak-${stamp()}`;
		copyFileSync(LOCAL_DB, bak);
		console.log(`  backup: ${bak}`);
	}
	try {
		rmSync(LOCAL_DB + '-wal', { force: true });
		rmSync(LOCAL_DB + '-shm', { force: true });
		copyFileSync(TMP, LOCAL_DB);
	} catch (e) {
		console.error('\n⚠ No se pudo reemplazar local.db.');
		console.error('  Probablemente `npm run dev` está corriendo y tiene el archivo abierto.');
		console.error('  Detén el dev server y reintenta `npm run data:pull`.');
		console.error(String(e));
		process.exit(1);
	}
	rmSync(TMP, { force: true });
	sh('ssh', [REMOTE, `rm -f ${REMOTE_TMP}`]);
	console.log('✅ PROD → DEV listo. Reinicia `npm run dev` para ver los datos nuevos.');
} else {
	console.error('Uso: node scripts/db-sync.mjs <push|pull>');
	console.error('  push = DEV → PROD  (sube tus datos locales al droplet)');
	console.error('  pull = PROD → DEV  (baja los datos del droplet a tu máquina)');
	process.exit(1);
}
