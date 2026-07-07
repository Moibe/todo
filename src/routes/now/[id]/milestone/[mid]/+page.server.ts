import { db } from '$lib/server/db';
import { nowItems, milestones } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

// Carga el Now padre y el milestone por id. Ambos se exponen en page.data: el
// Sidebar los lee para colgar el Now como sub-item (depth-1) y el milestone como
// sub-sub-item (depth-2). El +page.server.ts del Now no corre para esta ruta hija
// (es page-load, no layout), por eso reponemos `now` aquí también.
export const load: PageServerLoad = ({ params }) => {
	const nowId = Number(params.id);
	const mid = Number(params.mid);
	const nowRow = db.select().from(nowItems).where(eq(nowItems.id, nowId)).get();
	const msRow = db.select().from(milestones).where(eq(milestones.id, mid)).get();
	return {
		now: nowRow ? { id: nowRow.id, text: nowRow.text } : null,
		milestone: msRow ? { id: msRow.id, nowId: msRow.nowId, text: msRow.text } : null
	};
};
