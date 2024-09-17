CREATE TABLE `entries_tags` (
	`user_id` text,
	`journal_id` integer DEFAULT 0,
	`day` text,
	`tag_id` text,
	`order_no` integer DEFAULT 0,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`modified_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`revision` integer,
	`sync_status` text DEFAULT 'synced',
	PRIMARY KEY(`day`, `user_id`, `journal_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text,
	`user_id` text,
	`journal_id` integer DEFAULT 0,
	`name` text,
	`color` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`modified_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'synced',
	PRIMARY KEY(`id`, `user_id`, `journal_id`),
	FOREIGN KEY (`user_id`,`journal_id`) REFERENCES `journals_catalog`(`user_id`,`journal_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
/*
 SQLite does not support "Drop not null from column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
/*
 SQLite does not support "Changing existing column type" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
CREATE UNIQUE INDEX `tags_id_unique` ON `tags` (`id`);