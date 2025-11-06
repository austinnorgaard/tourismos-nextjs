ALTER TABLE `businesses` ADD `vercelToken` varchar(500);--> statement-breakpoint
ALTER TABLE `offerings` ADD `stripeProductId` varchar(255);--> statement-breakpoint
ALTER TABLE `offerings` ADD `stripePriceId` varchar(255);