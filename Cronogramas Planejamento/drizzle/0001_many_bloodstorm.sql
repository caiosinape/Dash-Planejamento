CREATE TABLE `execution_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`execution_id` integer,
	`contract` text NOT NULL,
	`item` text NOT NULL,
	`service_order` text NOT NULL,
	`period` text NOT NULL,
	`action` text NOT NULL,
	`previous_quantity` real,
	`quantity` real NOT NULL,
	`changed_by` text NOT NULL,
	`changed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `execution_history_period_idx` ON `execution_history` (`contract`,`period`);--> statement-breakpoint
CREATE INDEX `execution_history_record_idx` ON `execution_history` (`contract`,`item`,`service_order`,`period`);--> statement-breakpoint
ALTER TABLE `executions` ADD `is_locked` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `executions` ADD `locked_by` text;--> statement-breakpoint
ALTER TABLE `executions` ADD `locked_at` text;