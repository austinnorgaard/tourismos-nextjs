CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`offeringId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerPhone` varchar(50),
	`bookingDate` timestamp NOT NULL,
	`bookingTime` varchar(10),
	`partySize` int NOT NULL DEFAULT 1,
	`totalAmount` int NOT NULL,
	`paymentStatus` enum('pending','paid','refunded','failed') NOT NULL DEFAULT 'pending',
	`stripePaymentId` varchar(255),
	`status` enum('pending','confirmed','canceled','completed') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('tour_operator','hotel','restaurant','activity_provider','rental','other') NOT NULL,
	`description` text,
	`location` varchar(255),
	`address` text,
	`phone` varchar(50),
	`email` varchar(320),
	`website` varchar(500),
	`logoUrl` varchar(500),
	`subscriptionTier` enum('starter','professional','enterprise') NOT NULL DEFAULT 'starter',
	`subscriptionStatus` enum('active','canceled','past_due','trial') NOT NULL DEFAULT 'trial',
	`stripeCustomerId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('email','social') NOT NULL,
	`content` text,
	`status` enum('draft','scheduled','sent') NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`recipientsCount` int DEFAULT 0,
	`openRate` int DEFAULT 0,
	`clickRate` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`customerEmail` varchar(320),
	`customerName` varchar(255),
	`messages` text,
	`status` enum('active','resolved') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeBase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeBase_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offerings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('tour','activity','accommodation','rental','experience','other') NOT NULL,
	`price` int NOT NULL,
	`durationMinutes` int,
	`capacity` int,
	`location` varchar(255),
	`images` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offerings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `businessId` int;