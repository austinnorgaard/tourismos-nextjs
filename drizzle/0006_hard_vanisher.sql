CREATE TABLE `oauthAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('google','microsoft','apple') NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`providerEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `oauthAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_resetToken_unique` UNIQUE(`resetToken`);