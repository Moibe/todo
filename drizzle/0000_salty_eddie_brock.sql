CREATE TABLE `macro_chips` (
	`id` integer PRIMARY KEY NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`x` real DEFAULT 0 NOT NULL,
	`y` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY NOT NULL,
	`playbook_id` integer NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `now_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `playbooks` (
	`id` integer PRIMARY KEY NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`parent_id` integer,
	`orden` integer DEFAULT 0 NOT NULL
);
