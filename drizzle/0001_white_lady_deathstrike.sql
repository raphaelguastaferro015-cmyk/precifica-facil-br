CREATE TABLE `cashFlowEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`category` varchar(128) NOT NULL DEFAULT 'Geral',
	`description` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`date` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cashFlowEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `priceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(128),
	`supplier` varchar(255),
	`cost` decimal(12,2) NOT NULL DEFAULT '0',
	`suggestedPrice` decimal(12,2) DEFAULT '0',
	`currentPrice` decimal(12,2) DEFAULT '0',
	`taxes` decimal(5,2) DEFAULT '0',
	`freight` decimal(12,2) DEFAULT '0',
	`ads` decimal(12,2) DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smartSheetRows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productName` varchar(255) NOT NULL DEFAULT 'Novo Produto',
	`cost` decimal(12,2) NOT NULL DEFAULT '0',
	`price` decimal(12,2) NOT NULL DEFAULT '0',
	`taxes` decimal(5,2) NOT NULL DEFAULT '0',
	`freight` decimal(12,2) NOT NULL DEFAULT '0',
	`ads` decimal(12,2) NOT NULL DEFAULT '0',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smartSheetRows_id` PRIMARY KEY(`id`)
);
