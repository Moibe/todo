import { redirect, type Handle } from '@sveltejs/kit';
import { createHash } from 'node:crypto';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

export const ADMIN_COOKIE = 'todo_auth';

// Token de cookie derivado de la contraseña: sha256("todo-admin:" + pw). Estable
// mientras no cambie la contraseña, no la revela (no se puede invertir) y no se
// puede falsificar sin conocerla. Si ADMIN_PASSWORD no está configurado → null.
export function adminCookieToken(): string | null {
	const pw = env.ADMIN_PASSWORD ?? '';
	if (!pw) return null;
	return createHash('sha256').update(`todo-admin:${pw}`).digest('hex');
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(ADMIN_COOKIE);
	const expected = adminCookieToken();
	event.locals.isAdmin = expected !== null && token === expected;

	// Sin contraseña configurada:
	//   - en dev: sitio abierto (no estorbar el desarrollo local)
	//   - en prod: fail-closed (todo bloqueado hasta configurar ADMIN_PASSWORD)
	if (expected === null && dev) {
		return resolve(event);
	}

	const path = event.url.pathname;
	const isAccesoRoute = path === '/acceso' || path.startsWith('/acceso/');

	// Gate: todo el sitio requiere sesión, excepto la propia pantalla de acceso.
	if (!event.locals.isAdmin && !isAccesoRoute) {
		if (path.startsWith('/api/')) {
			return new Response('Unauthorized', { status: 401 });
		}
		const redirectTo = path + event.url.search;
		redirect(303, `/acceso?redirectTo=${encodeURIComponent(redirectTo)}`);
	}

	return resolve(event);
};
