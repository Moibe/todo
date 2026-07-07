import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tasks } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

type Task = { id: number; nowId: number; text: string };

export const GET: RequestHandler = () => {
	const rows = db.select().from(tasks).orderBy(tasks.orden).all();
	return json(rows.map((r) => ({ id: r.id, nowId: r.nowId, text: r.text })));
};

export const PUT: RequestHandler = async ({ request }) => {
	const items = (await request.json()) as Task[];
	db.transaction((tx) => {
		tx.delete(tasks).run();
		if (items.length) {
			tx.insert(tasks)
				.values(items.map((t, i) => ({ id: t.id, nowId: t.nowId, text: t.text ?? '', orden: i })))
				.run();
		}
	});
	return json({ ok: true });
};
