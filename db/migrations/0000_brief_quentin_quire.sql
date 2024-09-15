CREATE TABLE if not exists `app` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE if not exists `journals_catalog` (
	`user_id` text,
	`journal_id` integer DEFAULT 0,
	`name` text DEFAULT 'Default' NOT NULL,
	`color` text,
	`icon_name` text,
	`icon_url` text,
	PRIMARY KEY(`user_id`, `journal_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE if not exists `journals` (
	`user_id` text,
	`day` text,
	`journal_id` integer DEFAULT 0,
	`tag_id` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`modified_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`content` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'synced',
	PRIMARY KEY(`user_id`, `day`, `journal_id`, `tag_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`,`journal_id`) REFERENCES `journals_catalog`(`user_id`,`journal_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE if not exists `preferences` (
	`user_id` text,
	`item` text,
	`value` text,
	PRIMARY KEY(`user_id`, `item`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE if not exists `users` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text,
	`secret_key` blob,
	`subscription` text
);
