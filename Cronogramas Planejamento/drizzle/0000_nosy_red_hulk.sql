CREATE TABLE `executions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contract` text NOT NULL,
	`item` text NOT NULL,
	`service_order` text NOT NULL,
	`period` text NOT NULL,
	`quantity` real NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `executions_record_idx` ON `executions` (`contract`,`item`,`service_order`,`period`);