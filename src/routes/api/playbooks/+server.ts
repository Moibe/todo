import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { playbooks } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

type Playbook = { id: number; text: string; parentId: number | null };

export const GET: RequestHandler = () => {
	const rows = db.select().from(playbooks).orderBy(playbooks.orden).all();
	return json(rows.map((r) => ({ id: r.id, text: r.text, parentId: r.parentId })));
};

export const PUT: RequestHandler = async ({ request }) => {
	const items = (await request.json()) as Playbook[];
	db.transaction((tx) => {
		tx.delete(playbooks).run();
		if (items.length) {
			tx.insert(playbooks)
				.values(
					items.map((p, i) => ({
						id: p.id,
						text: p.text ?? '',
						parentId: p.parentId ?? null,
						orden: i
					}))
				)
				.run();
		}
	});
	return json({ ok: true });
};
