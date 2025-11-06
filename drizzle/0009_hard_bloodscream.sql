CREATE TABLE `deployments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`domain` varchar(255),
	`subdomain` varchar(100),
	`status` enum('pending','deploying','deployed','failed','updating') NOT NULL DEFAULT 'pending',
	`vercelProjectId` varchar(100),
	`vercelDeploymentId` varchar(100),
	`deploymentUrl` varchar(500),
	`errorMessage` text,
	`lastDeployedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deployments_id` PRIMARY KEY(`id`),
	CONSTRAINT `deployments_businessId_unique` UNIQUE(`businessId`)
);
