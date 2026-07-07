import { db } from '$lib/server/db';
import { nowItems } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

// Carga el Now por id y lo expone como `now` en page.data. El Sidebar lo lee
// para mostrar el Now seleccionado como sub-item bajo "Now" (patrón estudio-cine).
export const load: PageServerLoad = ({ params }) => {
	const id = Number(params.id);
	const row = db.select().from(nowItems).where(eq(nowItems.id, id)).get();
	return {
		now: row ? { id: row.id, text: row.text } : null
	};
};
