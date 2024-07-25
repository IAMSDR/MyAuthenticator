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
	`icontype` text NOT NULL,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL
);
