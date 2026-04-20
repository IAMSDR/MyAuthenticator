CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`issuer` text NOT NULL,
	`label` text NOT NULL,
	`secret` text NOT NULL,
	`algorithm` text NOT NULL,
	`digits` integer NOT NULL,
	`period` integer NOT NULL,
	`counter` integer NOT NULL,
	`icon` text NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `credentials` (
	`displayName` text NOT NULL,
	`user` text DEFAULT 'admin' NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`id` text NOT NULL,
	`publicKey` text NOT NULL,
	`counter` integer NOT NULL,
	`backedUp` integer NOT NULL,
	`transports` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credentials_displayName_unique` ON `credentials` (`displayName`);--> statement-breakpoint
CREATE UNIQUE INDEX `credentials_id_unique` ON `credentials` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `credentials_id_displayName_unique` ON `credentials` (`id`,`displayName`);