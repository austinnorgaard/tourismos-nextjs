ALTER TABLE `businesses` ADD `primaryColor` varchar(7) DEFAULT '#2563eb';--> statement-breakpoint
ALTER TABLE `businesses` ADD `secondaryColor` varchar(7) DEFAULT '#1e40af';--> statement-breakpoint
ALTER TABLE `businesses` ADD `theme` enum('light','dark') DEFAULT 'light';--> statement-breakpoint
ALTER TABLE `businesses` ADD `customCss` text;