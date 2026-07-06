import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { notes } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

type Note = { id: number; playbookId: number; text: string };

export const GET: RequestHandler = () => {
	const rows = db.select().from(notes).orderBy(notes.orden).all();
	return json(rows.map((r) => ({ id: r.id, playbookId: r.playbookId, text: r.text })));
};

export const PUT: RequestHandler = async ({ request }) => {
	const items = (await request.json()) as Note[];
	db.transaction((tx) => {
		tx.delete(notes).run();
		if (items.length) {
			tx.insert(notes)
				.values(items.map((n, i) => ({ id: n.id, playbookId: n.playbookId, text: n.text ?? '', orden: i })))
				.run();
		}
	});
	return json({ ok: true });
};
