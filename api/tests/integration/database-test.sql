/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest_problems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `contest` int DEFAULT NULL,
  `problem` int DEFAULT NULL,
  `color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `order` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `contest` (`contest`),
  KEY `problem` (`problem`),
  CONSTRAINT `contest_problems_ibfk_1` FOREIGN KEY (`contest`) REFERENCES `contests` (`id`),
  CONSTRAINT `contest_problems_ibfk_2` FOREIGN KEY (`problem`) REFERENCES `problems` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `admin` int DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `duration` int DEFAULT '180',
  `start_time` timestamp NULL DEFAULT NULL,
  `penalty_time` int DEFAULT '20',
  `freeze_time` int DEFAULT '15',
  `is_unlocked` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `admin` (`admin`),
  CONSTRAINT `contests_ibfk_1` FOREIGN KEY (`admin`) REFERENCES `users` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `problems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `title` varchar(255) DEFAULT NULL,
  `description` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `input_public` text,
  `input_hidden` text,
  `output_public` text,
  `output_hidden` text,
  `solution` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `author` int DEFAULT NULL,
  `language` varchar(10) DEFAULT 'en',
  `hash` varchar(32) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `owner` (`author`),
  CONSTRAINT `problems_ibfk_1` FOREIGN KEY (`author`) REFERENCES `users` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `problem` int DEFAULT NULL,
  `team` int DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `code` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `status` enum('ACCEPTED','WRONG_ANSWER','TIME_LIMIT_EXCEEDED','PARSING_ERROR','ERROR','PENDING') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'PENDING',
  `filename` varchar(50) DEFAULT NULL,
  `score` int DEFAULT '0',
  `log` text,
  PRIMARY KEY (`id`),
  KEY `problem` (`problem`),
  KEY `team` (`team`),
  CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`problem`) REFERENCES `problems` (`id`),
  CONSTRAINT `submissions_ibfk_3` FOREIGN KEY (`team`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `contest` int DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `score` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `hash` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contest` (`contest`),
  CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`contest`) REFERENCES `contests` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `picture` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
