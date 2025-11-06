CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('info','success','warning','error','booking','payment','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(500),
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`plan` enum('starter','professional','enterprise') NOT NULL,
	`status` enum('trial','active','past_due','cancelled','expired') NOT NULL DEFAULT 'trial',
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`trialEnd` timestamp,
	`mrr` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`)
);
--> statement-breakpoint
CREATE TABLE `webhookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`payload` text NOT NULL,
	`webhookUrl` varchar(500),
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`lastAttempt` timestamp,
	`response` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhookEvents_id` PRIMARY KEY(`id`)
);
