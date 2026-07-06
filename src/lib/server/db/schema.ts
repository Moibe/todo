import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Chips arrastrables de la página Macro. id lo asigna el cliente. x/y son reales
// (posiciones con decimales).
export const macroChips = sqliteTable('macro_chips', {
	id: integer('id').primaryKey(),
	label: text('label').notNull().default(''),
	x: real('x').notNull().default(0),
	y: real('y').notNull().default(0)
});

// Elementos de la lista "Now". `orden` preserva el acomodo.
// `macros` = metadato: JSON con los ids de macro (macro_chips) a los que pertenece.
export const nowItems = sqliteTable('now_items', {
	id: integer('id').primaryKey(),
	text: text('text').notNull().default(''),
	orden: integer('orden').notNull().default(0),
	macros: text('macros').notNull().default('[]')
});

// Playbooks anidables: `parentId` (null = raíz) apunta a otro playbook.
export const playbooks = sqliteTable('playbooks', {
	id: integer('id').primaryKey(),
	text: text('text').notNull().default(''),
	parentId: integer('parent_id'),
	orden: integer('orden').notNull().default(0)
});

// Notas de un playbook (multilínea). `playbookId` a qué playbook pertenecen.
export const notes = sqliteTable('notes', {
	id: integer('id').primaryKey(),
	playbookId: integer('playbook_id').notNull(),
	text: text('text').notNull().default(''),
	orden: integer('orden').notNull().default(0)
});

export type MacroChip = typeof macroChips.$inferSelect;
export type NowItem = typeof nowItems.$inferSelect;
export type Playbook = typeof playbooks.$inferSelect;
export type Note = typeof notes.$inferSelect;
