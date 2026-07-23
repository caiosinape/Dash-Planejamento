DROP INDEX `execution_history_record_idx`;--> statement-breakpoint
ALTER TABLE `execution_history` ADD `week` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `execution_history_record_idx` ON `execution_history` (`contract`,`item`,`service_order`,`period`,`week`);--> statement-breakpoint
DROP INDEX `executions_record_idx`;--> statement-breakpoint
ALTER TABLE `executions` ADD `week` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `executions_record_idx` ON `executions` (`contract`,`item`,`service_order`,`period`,`week`);