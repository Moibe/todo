import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { macroChips } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

type Chip = { id: number; label: string; x: number; y: number };

export const GET: RequestHandler = () => {
	const rows = db.select().from(macroChips).all();
	return json(rows.map((r) => ({ id: r.id, label: r.label, x: r.x, y: r.y })));
};

export const PUT: RequestHandler = async ({ request }) => {
	const items = (await request.json()) as Chip[];
	db.transaction((tx) => {
		tx.delete(macroChips).run();
		if (items.length) {
			tx.insert(macroChips)
				.values(items.map((c) => ({ id: c.id, label: c.label ?? '', x: c.x ?? 0, y: c.y ?? 0 })))
				.run();
		}
	});
	return json({ ok: true });
};
