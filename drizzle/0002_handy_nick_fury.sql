CREATE TABLE `milestones` (
	`id` integer PRIMARY KEY NOT NULL,
	`now_id` integer NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`orden` integer DEFAULT 0 NOT NULL
);
