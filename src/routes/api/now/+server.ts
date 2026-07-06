import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { nowItems } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

type Item = { id: number; text: string; macros: number[] };

export const GET: RequestHandler = () => {
	const rows = db.select().from(nowItems).orderBy(nowItems.orden).all();
	return json(
		rows.map((r) => ({
			id: r.id,
			text: r.text,
			macros: parseMacros(r.macros)
		}))
	);
};

export const PUT: RequestHandler = async ({ request }) => {
	const items = (await request.json()) as Item[];
	db.transaction((tx) => {
		tx.delete(nowItems).run();
		if (items.length) {
			tx.insert(nowItems)
				.values(
					items.map((it, i) => ({
						id: it.id,
						text: it.text ?? '',
						orden: i,
						macros: JSON.stringify(Array.isArray(it.macros) ? it.macros : [])
					}))
				)
				.run();
		}
	});
	return json({ ok: true });
};

function parseMacros(raw: string): number[] {
	try {
		const value = JSON.parse(raw);
		return Array.isArray(value) ? value.filter((n) => typeof n === 'number') : [];
	} catch {
		return [];
	}
}
