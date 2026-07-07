// Store compartido de tasks (runes). Lo usan TasksList (lista + edición) y
// Calendar (mostrar/soltar por fecha) para operar sobre los MISMOS datos, de modo
// que arrastrar una task al calendario se refleje al instante en ambos lados.
// Persiste con PUT /api/tasks (reemplaza la colección completa).

export type Task = { id: number; nowId: number; text: string; fecha: string | null };

class TasksStore {
	items = $state<Task[]>([]);
	#nextId = 1;
	#loadPromise: Promise<void> | null = null;

	// Carga única (idempotente): la primera llamada trae la data; las demás
	// esperan la misma promesa. El store es singleton, así sobrevive navegaciones.
	load(): Promise<void> {
		if (!this.#loadPromise) this.#loadPromise = this.#doLoad();
		return this.#loadPromise;
	}

	async #doLoad() {
		try {
			const list: Partial<Task>[] = await fetch('/api/tasks').then((r) => r.json());
			this.items = list.map((t) => ({
				id: t.id!,
				nowId: t.nowId!,
				text: t.text ?? '',
				fecha: t.fecha ?? null
			}));
			this.#nextId = this.items.reduce((max, t) => Math.max(max, t.id), 0) + 1;
		} catch {
			this.items = [];
		}
	}

	save() {
		fetch('/api/tasks', {
			method: 'PUT',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(this.items)
		}).catch(() => {});
	}

	forNow(nowId: number): Task[] {
		return this.items.filter((t) => t.nowId === nowId);
	}

	add(nowId: number): number {
		const id = this.#nextId++;
		this.items.push({ id, nowId, text: '', fecha: null });
		this.save();
		return id;
	}

	remove(id: number) {
		this.items = this.items.filter((t) => t.id !== id);
		this.save();
	}

	setText(id: number, text: string) {
		const t = this.items.find((t) => t.id === id);
		if (t) {
			t.text = text;
			this.save();
		}
	}

	setDate(id: number, fecha: string | null) {
		const t = this.items.find((t) => t.id === id);
		if (t) {
			t.fecha = fecha;
			this.save();
		}
	}
}

export const tasksStore = new TasksStore();
