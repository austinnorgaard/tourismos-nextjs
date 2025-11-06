CREATE TABLE `teamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','manager','staff') NOT NULL DEFAULT 'staff',
	`permissions` text,
	`invitedBy` int,
	`status` enum('active','invited','suspended') NOT NULL DEFAULT 'invited',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamMembers_id` PRIMARY KEY(`id`)
);
