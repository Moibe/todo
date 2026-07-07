import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { milestones } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

type Milestone = { id: number; nowId: number; text: string };

export const GET: RequestHandler = () => {
	const rows = db.select().from(milestones).orderBy(milestones.orden).all();
	return json(rows.map((r) => ({ id: r.id, nowId: r.nowId, text: r.text })));
};

export const PUT: RequestHandler = async ({ request }) => {
	const items = (await request.json()) as Milestone[];
	db.transaction((tx) => {
		tx.delete(milestones).run();
		if (items.length) {
			tx.insert(milestones)
				.values(items.map((m, i) => ({ id: m.id, nowId: m.nowId, text: m.text ?? '', orden: i })))
				.run();
		}
	});
	return json({ ok: true });
};
