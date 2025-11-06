ALTER TABLE `businesses` ADD `stripeAccountId` varchar(255);--> statement-breakpoint
ALTER TABLE `businesses` ADD `stripeAccountStatus` enum('pending','active','disabled');--> statement-breakpoint
ALTER TABLE `businesses` ADD `stripeOnboardingComplete` int DEFAULT 0;