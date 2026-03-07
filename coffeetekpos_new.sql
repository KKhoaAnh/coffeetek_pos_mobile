-- MySQL dump 10.13  Distrib 8.0.29, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: coffeetek_pos
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'ef8021a0-d3f6-11f0-b364-7ec2d0dccc3b:1-676';

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grid_column_count` int DEFAULT '4',
  PRIMARY KEY (`category_id`),
  KEY `fk_category_parent` (`parent_id`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Cà phê',NULL,NULL,'assets/cat_coffee.jpg',6),(2,'Trà',NULL,NULL,'assets/cat_tea.jpg',4),(3,'Bánh ngọt',NULL,NULL,'assets/cat_cake.jpg',4),(4,'Đá xay',NULL,NULL,NULL,4);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_modifier_links`
--

DROP TABLE IF EXISTS `category_modifier_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_modifier_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `category_modifier_links_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE,
  CONSTRAINT `category_modifier_links_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `modifier_groups` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_modifier_links`
--

LOCK TABLES `category_modifier_links` WRITE;
/*!40000 ALTER TABLE `category_modifier_links` DISABLE KEYS */;
INSERT INTO `category_modifier_links` VALUES (1,1,1),(2,1,2),(3,2,1),(4,2,2),(5,2,3);
/*!40000 ALTER TABLE `category_modifier_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(255) NOT NULL,
  `unit` enum('goi','lon','chai','kg','gam') NOT NULL,
  `quantity` decimal(10,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
INSERT INTO `inventory_items` VALUES (1,'Sữa tươi','chai',0.00,1,'2026-03-03 05:54:02','2026-03-03 05:54:50'),(2,'Siro','chai',10.00,1,'2026-03-03 05:54:19','2026-03-03 05:54:19'),(3,'Đường bột','kg',10.00,1,'2026-03-03 05:54:40','2026-03-03 05:54:40'),(4,'Nước lọc','chai',10.00,1,'2026-03-05 03:18:09','2026-03-05 03:18:09');
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modifier_groups`
--

DROP TABLE IF EXISTS `modifier_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modifier_groups` (
  `group_id` int NOT NULL AUTO_INCREMENT,
  `group_name` varchar(100) NOT NULL,
  `is_multi_select` tinyint(1) DEFAULT '0',
  `is_required` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modifier_groups`
--

LOCK TABLES `modifier_groups` WRITE;
/*!40000 ALTER TABLE `modifier_groups` DISABLE KEYS */;
INSERT INTO `modifier_groups` VALUES (1,'Kích cỡ',0,1),(2,'Mức đường',0,1),(3,'Topping',1,0),(4,'Khác',0,0);
/*!40000 ALTER TABLE `modifier_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modifiers`
--

DROP TABLE IF EXISTS `modifiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modifiers` (
  `modifier_id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `modifier_name` varchar(100) NOT NULL,
  `extra_price` decimal(15,2) DEFAULT '0.00',
  `is_input_required` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`modifier_id`),
  KEY `fk_modifier_group` (`group_id`),
  CONSTRAINT `fk_modifier_group` FOREIGN KEY (`group_id`) REFERENCES `modifier_groups` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modifiers`
--

LOCK TABLES `modifiers` WRITE;
/*!40000 ALTER TABLE `modifiers` DISABLE KEYS */;
INSERT INTO `modifiers` VALUES (1,1,'Size M',0.00,0),(2,1,'Size L',5000.00,0),(3,2,'100% Đường',0.00,0),(4,2,'50% Đường',0.00,0),(5,2,'Không đường',0.00,0),(6,3,'Trân châu đen',5000.00,0),(7,3,'Thạch trái cây',5000.00,0),(8,3,'Kem cheese mặn',10000.00,0),(9,1,'Size XL',10000.00,0),(11,4,'Ghi chú thêm',5000.00,1),(12,4,'Ghi chú thêm 2',0.00,1),(13,3,'Thạch sương sáo',5000.00,0),(14,3,'Thạch đào',3000.00,0),(15,3,'Trân châu trắng',5000.00,0);
/*!40000 ALTER TABLE `modifiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_details`
--

DROP TABLE IF EXISTS `order_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_details` (
  `order_detail_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `quantity` int NOT NULL,
  `total_line_amount` decimal(15,2) NOT NULL,
  `note` text,
  `item_status` enum('PENDING','READY','SERVED','CANCELLED') DEFAULT 'PENDING',
  PRIMARY KEY (`order_detail_id`),
  KEY `fk_detail_order` (`order_id`),
  KEY `fk_detail_product` (`product_id`),
  CONSTRAINT `fk_detail_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detail_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=351 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_details`
--

LOCK TABLES `order_details` WRITE;
/*!40000 ALTER TABLE `order_details` DISABLE KEYS */;
INSERT INTO `order_details` VALUES (3,3,3,'Trà Đào',40000.00,1,50000.00,'','PENDING'),(7,6,3,'Trà Đào',40000.00,1,45000.00,'','PENDING'),(8,6,4,'Croissant',35000.00,1,35000.00,'','PENDING'),(13,5,2,'Bạc Xỉu',30000.00,1,30000.00,'','PENDING'),(14,5,3,'Trà Đào',40000.00,1,40000.00,'','PENDING'),(15,4,3,'Trà Đào',40000.00,1,45000.00,'','PENDING'),(16,2,2,'Bạc Xỉu',30000.00,1,30000.00,'','PENDING'),(25,9,15,'Bánh Tiramisu',38000.00,1,38000.00,'','PENDING'),(36,7,3,'Trà Đào',40000.00,1,60000.00,'','PENDING'),(37,8,6,'Latte',40000.00,1,40000.00,'','PENDING'),(38,10,7,'Cappuccino',42000.00,1,42000.00,'','PENDING'),(45,11,11,'Trà Xoài',42000.00,1,42000.00,'','PENDING'),(52,13,10,'Lục Trà',35000.00,1,35000.00,'','PENDING'),(53,13,13,'Trà Dưa Lưới',42000.00,1,42000.00,'','PENDING'),(54,13,1,'Cà phê Đen',25000.00,1,25000.00,'','PENDING'),(55,13,5,'Americano',35000.00,1,35000.00,'','PENDING'),(56,13,7,'Cappuccino',42000.00,1,42000.00,'','PENDING'),(57,13,15,'Bánh Tiramisu',38000.00,1,38000.00,'','PENDING'),(59,12,7,'Cappuccino',42000.00,1,42000.00,'','PENDING'),(71,18,12,'Trà Dâu',42000.00,1,42000.00,'','PENDING'),(72,20,15,'Bánh Tiramisu',38000.00,1,38000.00,'','PENDING'),(73,19,6,'Latte',40000.00,1,40000.00,'','SERVED'),(74,19,10,'Lục Trà',35000.00,1,35000.00,'','SERVED'),(75,19,13,'Trà Dưa Lưới',42000.00,1,42000.00,'','SERVED'),(77,21,8,'Cold Brew',45000.00,1,45000.00,'','SERVED'),(81,22,6,'Latte',40000.00,1,40000.00,'','SERVED'),(82,22,11,'Trà Xoài',42000.00,1,52000.00,'','SERVED'),(85,16,10,'Lục Trà',35000.00,1,35000.00,'','SERVED'),(86,16,1,'Cà phê Đen',25000.00,1,30000.00,'','SERVED'),(87,16,10,'Lục Trà',35000.00,1,45000.00,'','SERVED'),(130,30,14,'Bánh Bông Lan Dâu',35000.00,1,35000.00,'','SERVED'),(190,26,6,'Latte',40000.00,1,40000.00,'','SERVED'),(231,39,13,'Trà Dưa Lưới',42000.00,5,210000.00,'','SERVED'),(232,39,12,'Trà Dâu',42000.00,5,210000.00,'','SERVED'),(233,37,8,'Cold Brew',45000.00,1,45000.00,'','SERVED'),(234,38,1,'Cà phê Đen',25000.00,4,100000.00,'','SERVED'),(235,38,5,'Americano',35000.00,4,140000.00,'','SERVED'),(236,38,2,'Bạc Xỉu',30000.00,1,30000.00,'','SERVED'),(237,38,13,'Trà Dưa Lưới',42000.00,3,126000.00,'','SERVED'),(238,38,13,'Trà Dưa Lưới',42000.00,4,188000.00,'','SERVED'),(239,38,11,'Trà Xoài',42000.00,4,228000.00,'','SERVED'),(240,29,10,'Lục Trà',35000.00,1,35000.00,'','SERVED'),(246,24,5,'Americano',35000.00,8,280000.00,'','SERVED'),(247,24,12,'Trà Dâu',42000.00,5,210000.00,'','SERVED'),(248,24,15,'Bánh Tiramisu',38000.00,10,380000.00,'','SERVED'),(249,24,10,'Lục Trà',35000.00,1,35000.00,'','SERVED'),(250,24,2,'Bạc Xỉu',30000.00,1,30000.00,'','SERVED'),(251,24,5,'Americano',35000.00,1,40000.00,'','SERVED'),(252,40,8,'Cold Brew',45000.00,3,135000.00,'','SERVED'),(253,40,7,'Cappuccino',42000.00,3,126000.00,'','SERVED'),(254,35,1,'Cà phê Đen',25000.00,9,225000.00,'','SERVED'),(258,44,2,'Bạc Xỉu',30000.00,1,30000.00,'','SERVED'),(259,27,11,'Trà Xoài',42000.00,7,294000.00,'','SERVED'),(260,28,12,'Trà Dâu',42000.00,1,42000.00,'','SERVED'),(261,42,8,'Cold Brew',45000.00,1,45000.00,'','SERVED'),(262,42,13,'Trà Dưa Lưới',42000.00,1,42000.00,'','SERVED'),(266,32,5,'Americano',35000.00,3,105000.00,'','SERVED'),(270,36,1,'Cà phê Đen',25000.00,3,75000.00,'','SERVED'),(271,36,8,'Cold Brew',45000.00,1,45000.00,'','SERVED'),(272,34,7,'Cappuccino',42000.00,9,378000.00,'','SERVED'),(273,47,8,'Cold Brew',45000.00,8,360000.00,'','PENDING'),(275,49,13,'Trà Dưa Lưới',42000.00,1,62000.00,'','PENDING'),(276,50,8,'Cold Brew',45000.00,1,45000.00,'','PENDING'),(277,51,13,'Trà Dưa Lưới',42000.00,1,42000.00,'','PENDING'),(280,53,13,'Trà Dưa Lưới',42000.00,1,47000.00,'','SERVED'),(282,54,12,'Trà Dâu',42000.00,1,42000.00,'','SERVED'),(284,55,7,'Cappuccino',42000.00,1,42000.00,'','SERVED'),(285,56,11,'Trà Xoài',42000.00,1,42000.00,'','PENDING'),(286,57,13,'Trà Dưa Lưới',42000.00,1,42000.00,'','PENDING'),(287,43,12,'Trà Dâu',42000.00,1,52000.00,'','SERVED'),(288,43,14,'Bánh Bông Lan Dâu',35000.00,3,105000.00,'','SERVED'),(289,45,7,'Cappuccino',42000.00,8,336000.00,'','SERVED'),(290,58,7,'Cappuccino',42000.00,1,42000.00,'','PENDING'),(293,46,10,'Lục Trà',35000.00,1,35000.00,'','SERVED'),(294,46,9,'Trà Xanh Chanh',35000.00,9,360000.00,'','SERVED'),(296,60,7,'Cappuccino',42000.00,1,42000.00,'','SERVED'),(297,61,12,'Trà Dâu',42000.00,1,42000.00,'','PENDING'),(302,64,12,'Trà Dâu',42000.00,1,42000.00,'','PENDING'),(304,66,2,'Bạc Xỉu',30000.00,1,32000.00,'','PENDING'),(305,66,12,'Trà Dâu',42000.00,1,52000.00,'','PENDING'),(306,67,24,'Espresso',30000.00,1,35000.00,'','PENDING'),(307,63,16,'Bánh Pudding',40000.00,4,160000.00,'','SERVED'),(308,68,23,'Bánh bông lan Cream Trái cây',55000.00,1,55000.00,'','PENDING'),(309,68,16,'Bánh Pudding',40000.00,1,40000.00,'','PENDING'),(310,68,2,'Bạc Xỉu',30000.00,1,45000.00,'','PENDING'),(311,69,25,'Trà Ổi Hồng',30000.00,1,35000.00,'','PENDING'),(312,62,15,'Bánh Tiramisu',38000.00,1,38000.00,'','SERVED'),(313,62,14,'Bánh Bông Lan Dâu',35000.00,1,35000.00,'','SERVED'),(314,62,4,'Croissant',35000.00,1,35000.00,'','SERVED'),(315,70,2,'Bạc Xỉu',30000.00,6,210000.00,'','PENDING'),(316,71,22,'Bánh Cream Chocolate Dâu',60000.00,4,240000.00,'','PENDING'),(317,71,4,'Croissant',35000.00,3,105000.00,'','PENDING'),(318,71,20,'Bánh Crepe',45000.00,1,45000.00,'','PENDING'),(319,71,16,'Bánh Pudding',40000.00,2,80000.00,'','PENDING'),(320,71,15,'Bánh Tiramisu',38000.00,2,76000.00,'','PENDING'),(321,72,14,'Bánh Bông Lan Dâu',35000.00,4,140000.00,'','PENDING'),(322,72,22,'Bánh Cream Chocolate Dâu',60000.00,5,300000.00,'','PENDING'),(323,72,20,'Bánh Crepe',45000.00,6,270000.00,'','PENDING'),(342,83,5,'Americano',35000.00,1,40000.00,'','PENDING'),(344,85,8,'Cold Brew',45000.00,5,275000.00,'','PENDING'),(345,85,10,'Lục Trà',35000.00,3,195000.00,'','PENDING'),(346,86,2,'Bạc Xỉu',30000.00,1,30000.00,'','SERVED'),(347,87,5,'Americano',35000.00,10,400000.00,'','SERVED'),(348,88,24,'Espresso',30000.00,2,70000.00,'','SERVED'),(349,89,25,'Trà Ổi Hồng',30000.00,1,35000.00,'','PENDING'),(350,89,4,'Croissant',35000.00,6,210000.00,'','PENDING');
/*!40000 ALTER TABLE `order_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_logs`
--

DROP TABLE IF EXISTS `order_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `changed_by_user_id` int DEFAULT NULL,
  `note` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_log_order` (`order_id`),
  KEY `fk_log_user` (`changed_by_user_id`),
  CONSTRAINT `fk_log_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_log_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=153 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_logs`
--

LOCK TABLES `order_logs` WRITE;
/*!40000 ALTER TABLE `order_logs` DISABLE KEYS */;
INSERT INTO `order_logs` VALUES (1,5,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 01:46:33'),(2,5,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 01:50:20'),(3,4,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 01:50:44'),(4,2,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 01:50:59'),(5,7,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 01:51:44'),(6,7,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 01:55:56'),(7,7,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 02:02:32'),(8,7,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 02:03:42'),(9,9,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 07:24:09'),(10,10,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 07:34:47'),(11,10,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 07:35:16'),(12,10,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 07:52:44'),(13,13,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 08:29:26'),(14,12,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 08:29:39'),(15,7,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 08:30:54'),(16,8,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 08:31:28'),(17,10,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 08:31:48'),(18,13,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 08:36:22'),(19,13,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-10 09:10:41'),(20,13,NULL,NULL,'MERGE_TABLE',NULL,'Gộp đơn từ bàn 12 (Order #14) sang','2025-12-12 01:47:33'),(21,12,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 2 sang bàn 11','2025-12-12 01:50:04'),(22,11,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 01:50:30'),(23,13,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 01:54:59'),(24,13,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 01:55:16'),(25,12,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 01:57:42'),(26,12,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 01:57:55'),(27,18,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 02:03:46'),(28,19,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 02:17:41'),(29,16,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 02:19:05'),(30,19,NULL,NULL,'MERGE_TABLE',NULL,'Gộp đơn từ bàn 2 (Order #17) sang','2025-12-12 02:34:04'),(31,18,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 05:43:57'),(32,20,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 05:47:00'),(33,19,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 05:57:17'),(34,16,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 12 sang bàn 1','2025-12-12 05:57:52'),(35,16,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 1 sang bàn 4','2025-12-12 05:59:42'),(36,21,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 1 sang bàn 2','2025-12-12 06:06:54'),(37,21,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 06:34:00'),(38,16,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 06:34:36'),(39,22,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 06:38:09'),(40,16,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 4 sang bàn 3','2025-12-12 06:42:50'),(41,16,NULL,NULL,'MERGE_TABLE',NULL,'Gộp đơn từ bàn 2 (Order #23) sang','2025-12-12 06:43:29'),(42,16,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 06:44:58'),(43,24,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 06:52:31'),(44,24,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 06:57:09'),(45,24,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 06:59:58'),(46,24,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-12 07:00:40'),(47,24,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-15 00:42:20'),(48,24,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 02:28:45'),(49,25,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 02:50:40'),(50,30,'PENDING','COMPLETED','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 04:00:36'),(51,24,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 06:49:58'),(52,24,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 06:51:27'),(53,24,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 06:52:56'),(54,24,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 06:56:31'),(55,34,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 07:01:46'),(56,34,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 07:10:17'),(57,32,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 07:16:22'),(58,35,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 07:20:12'),(59,35,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 07:21:47'),(60,35,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 07:23:29'),(61,34,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 07:30:38'),(62,34,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 07:31:02'),(63,35,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:34:16'),(64,34,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:38:39'),(65,27,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:49:02'),(66,27,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:51:42'),(67,27,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:52:10'),(68,38,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:54:05'),(69,38,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:57:52'),(70,38,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:58:18'),(71,26,'PENDING','COMPLETED','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:58:49'),(72,39,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:59:16'),(73,39,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:59:30'),(74,33,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:59:44'),(75,33,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:59:50'),(76,33,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 08:59:55'),(77,33,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:00:04'),(78,39,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:03:30'),(79,39,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:03:40'),(80,39,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:06:08'),(81,39,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:06:18'),(82,40,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:07:01'),(83,40,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:08:47'),(84,40,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:08:59'),(85,36,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:11:49'),(86,36,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:12:00'),(87,41,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:13:30'),(88,41,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:14:02'),(89,41,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:16:05'),(90,41,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-15 09:16:09'),(91,39,'PENDING','COMPLETED','UPDATE',3,'Cập nhật đơn hàng','2025-12-17 00:52:34'),(92,37,'PENDING','COMPLETED','UPDATE',3,'Cập nhật đơn hàng','2025-12-17 00:52:52'),(93,38,'PENDING','COMPLETED','UPDATE',3,'Cập nhật đơn hàng','2025-12-17 00:53:13'),(94,29,'PENDING','COMPLETED','UPDATE',3,'Cập nhật đơn hàng','2025-12-17 00:53:30'),(95,35,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-17 00:53:50'),(96,35,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-17 00:54:00'),(97,35,'PENDING','PENDING','UPDATE',3,'Cập nhật đơn hàng','2025-12-17 00:54:15'),(98,24,'PENDING','COMPLETED','UPDATE',3,'Cập nhật đơn hàng','2025-12-17 01:25:00'),(99,40,'PENDING','COMPLETED','UPDATE',3,'Cập nhật đơn hàng','2025-12-17 01:25:11'),(100,35,'PENDING','COMPLETED','UPDATE',3,'Cập nhật đơn hàng','2025-12-17 01:25:33'),(101,43,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 2 sang bàn 10','2025-12-17 03:23:47'),(102,44,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-19 03:14:25'),(103,27,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-19 03:22:52'),(104,28,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-19 03:29:38'),(105,42,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-19 03:46:47'),(106,25,NULL,NULL,'MERGE_TABLE',NULL,'Gộp đơn từ bàn 8 (Order #33) sang','2025-12-19 07:28:16'),(107,31,NULL,NULL,'MERGE_TABLE',NULL,'Gộp đơn từ bàn 1 (Order #25) sang','2025-12-19 07:33:06'),(108,31,'PENDING','PENDING','UPDATE',1,'Cập nhật đơn hàng','2025-12-19 07:33:19'),(109,31,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 6 sang bàn 2','2025-12-19 08:45:17'),(110,41,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 14 sang bàn 1','2025-12-25 01:02:25'),(111,32,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-25 01:02:42'),(112,31,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 2 sang bàn 5','2025-12-25 02:32:39'),(113,36,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-25 03:46:48'),(114,41,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 1 sang bàn 14','2025-12-25 05:45:12'),(115,34,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-25 06:09:36'),(116,53,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-26 02:14:24'),(117,54,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-26 02:15:27'),(118,55,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-26 02:33:50'),(119,43,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-26 03:48:48'),(120,45,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-26 03:49:59'),(121,46,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-27 15:57:08'),(122,60,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2025-12-27 16:02:16'),(123,59,NULL,NULL,'MERGE_TABLE',NULL,'Gộp đơn từ bàn 4 (Order #52) sang','2025-12-27 16:19:42'),(124,59,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 15 sang bàn 9','2025-12-27 16:20:01'),(125,63,'PENDING','COMPLETED','UPDATE',3,'Cập nhật đơn hàng','2026-01-13 06:52:42'),(126,62,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-13 08:31:24'),(127,75,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 01:22:38'),(128,73,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 01:22:54'),(129,31,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 01:23:31'),(130,74,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 01:23:43'),(131,59,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 01:23:54'),(132,48,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 01:24:39'),(133,41,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 01:25:22'),(134,76,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 01:36:19'),(135,77,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 08:38:17'),(136,78,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 08:54:58'),(137,79,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 4 sang bàn 16','2026-01-27 09:13:15'),(138,79,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 16 sang bàn 7','2026-01-27 09:23:22'),(139,80,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 09:50:53'),(140,81,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 4 sang bàn 16','2026-01-27 09:59:24'),(141,81,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 16 sang bàn 13','2026-01-27 09:59:35'),(142,81,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 10:00:19'),(143,82,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 4 sang bàn 16','2026-01-27 13:20:36'),(144,82,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 16 sang bàn 4','2026-01-27 13:20:43'),(145,82,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 4 sang bàn 16','2026-01-27 13:20:47'),(146,79,NULL,NULL,'MERGE_TABLE',NULL,'Gộp đơn từ bàn 16 (Order #82) sang','2026-01-27 13:21:10'),(147,79,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-01-27 13:22:21'),(148,83,NULL,NULL,'MOVE_TABLE',NULL,'Chuyển từ bàn 3 sang bàn 1','2026-01-31 08:43:57'),(149,84,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-03-03 05:42:02'),(150,86,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-03-05 03:09:59'),(151,87,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-03-05 11:04:21'),(152,88,'PENDING','COMPLETED','UPDATE',1,'Cập nhật đơn hàng','2026-03-05 11:06:47');
/*!40000 ALTER TABLE `order_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_modifier_details`
--

DROP TABLE IF EXISTS `order_modifier_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_modifier_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_detail_id` int NOT NULL,
  `modifier_id` int NOT NULL,
  `modifier_name` varchar(100) DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `quantity` int DEFAULT '1',
  `modifier_note` text,
  PRIMARY KEY (`id`),
  KEY `fk_omd_detail` (`order_detail_id`),
  KEY `fk_omd_modifier` (`modifier_id`),
  CONSTRAINT `fk_omd_detail` FOREIGN KEY (`order_detail_id`) REFERENCES `order_details` (`order_detail_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_omd_modifier` FOREIGN KEY (`modifier_id`) REFERENCES `modifiers` (`modifier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=670 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_modifier_details`
--

LOCK TABLES `order_modifier_details` WRITE;
/*!40000 ALTER TABLE `order_modifier_details` DISABLE KEYS */;
INSERT INTO `order_modifier_details` VALUES (3,3,1,'Size M',0.00,1,NULL),(4,3,6,'Trân châu đen',5000.00,1,NULL),(5,3,7,'Thạch trái cây',5000.00,1,NULL),(6,3,4,'50% Đường',0.00,1,NULL),(14,7,1,'Size M',0.00,1,NULL),(15,7,3,'100% Đường',0.00,1,NULL),(16,7,6,'Trân châu đen',5000.00,1,NULL),(27,13,1,'Size M',0.00,1,NULL),(28,13,3,'100% Đường',0.00,1,NULL),(29,14,1,'Size M',0.00,1,NULL),(30,14,3,'100% Đường',0.00,1,NULL),(31,15,1,'Size M',0.00,1,NULL),(32,15,3,'100% Đường',0.00,1,NULL),(33,15,6,'Trân châu đen',5000.00,1,NULL),(34,16,1,'Size M',0.00,1,NULL),(35,16,3,'100% Đường',0.00,1,NULL),(74,36,5,'Không đường',0.00,1,NULL),(75,36,2,'Size L',5000.00,1,NULL),(76,36,7,'Thạch trái cây',5000.00,1,NULL),(77,36,8,'Kem phô mai',10000.00,1,NULL),(78,37,1,'Size M',0.00,1,NULL),(79,37,4,'50% Đường',0.00,1,NULL),(80,38,1,'Size M',0.00,1,NULL),(81,38,3,'100% Đường',0.00,1,NULL),(92,45,1,'Size M',0.00,1,NULL),(93,45,3,'100% Đường',0.00,1,NULL),(104,52,1,'Size M',0.00,1,NULL),(105,52,3,'100% Đường',0.00,1,NULL),(106,53,1,'Size M',0.00,1,NULL),(107,53,3,'100% Đường',0.00,1,NULL),(108,54,1,'Size M',0.00,1,NULL),(109,54,3,'100% Đường',0.00,1,NULL),(110,55,1,'Size M',0.00,1,NULL),(111,55,4,'50% Đường',0.00,1,NULL),(112,56,1,'Size M',0.00,1,NULL),(113,56,3,'100% Đường',0.00,1,NULL),(116,59,1,'Size M',0.00,1,NULL),(117,59,3,'100% Đường',0.00,1,NULL),(141,71,1,'Size M',0.00,1,NULL),(142,71,3,'100% Đường',0.00,1,NULL),(143,73,1,'Size M',0.00,1,NULL),(144,73,3,'100% Đường',0.00,1,NULL),(145,74,1,'Size M',0.00,1,NULL),(146,74,3,'100% Đường',0.00,1,NULL),(147,75,1,'Size M',0.00,1,NULL),(148,75,3,'100% Đường',0.00,1,NULL),(151,77,1,'Size M',0.00,1,NULL),(152,77,3,'100% Đường',0.00,1,NULL),(160,81,1,'Size M',0.00,1,NULL),(161,81,5,'Không đường',0.00,1,NULL),(162,82,3,'100% Đường',0.00,1,NULL),(163,82,7,'Thạch trái cây',5000.00,1,NULL),(164,82,2,'Size L',5000.00,1,NULL),(170,85,1,'Size M',0.00,1,NULL),(171,85,3,'100% Đường',0.00,1,NULL),(172,86,2,'Size L',5000.00,1,NULL),(173,86,4,'50% Đường',0.00,1,NULL),(174,87,3,'100% Đường',0.00,1,NULL),(175,87,2,'Size L',5000.00,1,NULL),(176,87,6,'Trân châu đen',5000.00,1,NULL),(357,190,1,'Size M',0.00,1,NULL),(358,190,3,'100% Đường',0.00,1,NULL),(439,231,1,'Size M',0.00,1,NULL),(440,231,3,'100% Đường',0.00,1,NULL),(441,232,1,'Size M',0.00,1,NULL),(442,232,3,'100% Đường',0.00,1,NULL),(443,233,1,'Size M',0.00,1,NULL),(444,233,3,'100% Đường',0.00,1,NULL),(445,234,1,'Size M',0.00,1,NULL),(446,234,3,'100% Đường',0.00,1,NULL),(447,235,1,'Size M',0.00,1,NULL),(448,235,3,'100% Đường',0.00,1,NULL),(449,236,1,'Size M',0.00,1,NULL),(450,236,3,'100% Đường',0.00,1,NULL),(451,237,1,'Size M',0.00,1,NULL),(452,237,3,'100% Đường',0.00,1,NULL),(453,238,2,'Size L',5000.00,1,NULL),(454,238,4,'50% Đường',0.00,1,NULL),(455,239,8,'Kem phô mai',10000.00,1,NULL),(456,239,5,'Không đường',0.00,1,NULL),(457,239,2,'Size L',5000.00,1,NULL),(458,240,1,'Size M',0.00,1,NULL),(459,240,3,'100% Đường',0.00,1,NULL),(470,246,1,'Size M',0.00,1,NULL),(471,246,3,'100% Đường',0.00,1,NULL),(472,247,1,'Size M',0.00,1,NULL),(473,247,3,'100% Đường',0.00,1,NULL),(474,249,1,'Size M',0.00,1,NULL),(475,249,3,'100% Đường',0.00,1,NULL),(476,250,1,'Size M',0.00,1,NULL),(477,250,3,'100% Đường',0.00,1,NULL),(478,251,3,'100% Đường',0.00,1,NULL),(479,251,2,'Size L',5000.00,1,NULL),(480,252,1,'Size M',0.00,1,NULL),(481,252,3,'100% Đường',0.00,1,NULL),(482,253,1,'Size M',0.00,1,NULL),(483,253,3,'100% Đường',0.00,1,NULL),(484,254,1,'Size M',0.00,1,NULL),(485,254,3,'100% Đường',0.00,1,NULL),(491,258,1,'Size M',0.00,1,NULL),(492,258,3,'100% Đường',0.00,1,NULL),(493,259,1,'Size M',0.00,1,NULL),(494,259,3,'100% Đường',0.00,1,NULL),(495,260,1,'Size M',0.00,1,NULL),(496,260,3,'100% Đường',0.00,1,NULL),(497,261,1,'Size M',0.00,1,NULL),(498,261,3,'100% Đường',0.00,1,NULL),(499,262,1,'Size M',0.00,1,NULL),(500,262,3,'100% Đường',0.00,1,NULL),(507,266,1,'Size M',0.00,1,NULL),(508,266,3,'100% Đường',0.00,1,NULL),(516,270,1,'Size M',0.00,1,NULL),(517,270,3,'100% Đường',0.00,1,NULL),(518,271,1,'Size M',0.00,1,NULL),(519,271,3,'100% Đường',0.00,1,NULL),(520,272,1,'Size M',0.00,1,NULL),(521,272,3,'100% Đường',0.00,1,NULL),(522,273,1,'Size M',0.00,1,NULL),(523,273,4,'50% Đường',0.00,1,NULL),(526,275,1,'Size M',0.00,1,NULL),(527,275,3,'100% Đường',0.00,1,NULL),(528,275,6,'Trân châu đen',5000.00,1,NULL),(529,275,8,'Kem phô mai',10000.00,1,NULL),(530,275,7,'Thạch trái cây',5000.00,1,NULL),(531,276,1,'Size M',0.00,1,NULL),(532,276,3,'100% Đường',0.00,1,NULL),(533,277,1,'Size M',0.00,1,NULL),(534,277,3,'100% Đường',0.00,1,NULL),(540,280,1,'Size M',0.00,1,NULL),(541,280,7,'Thạch trái cây',5000.00,1,NULL),(542,280,4,'50% Đường',0.00,1,NULL),(545,282,1,'Size M',0.00,1,NULL),(546,282,3,'100% Đường',0.00,1,NULL),(549,284,1,'Size M',0.00,1,NULL),(550,284,3,'100% Đường',0.00,1,NULL),(551,285,1,'Size M',0.00,1,NULL),(552,285,3,'100% Đường',0.00,1,NULL),(553,286,1,'Size M',0.00,1,NULL),(554,286,3,'100% Đường',0.00,1,NULL),(555,287,3,'100% Đường',0.00,1,NULL),(556,287,2,'Size L',5000.00,1,NULL),(557,287,6,'Trân châu đen',5000.00,1,NULL),(558,289,1,'Size M',0.00,1,NULL),(559,289,4,'50% Đường',0.00,1,NULL),(560,290,1,'Size M',0.00,1,NULL),(561,290,3,'100% Đường',0.00,1,NULL),(568,293,1,'Size M',0.00,1,NULL),(569,293,5,'Không đường',0.00,1,NULL),(570,294,1,'Size M',0.00,1,NULL),(571,294,3,'100% Đường',0.00,1,NULL),(572,294,6,'Trân châu đen',5000.00,1,NULL),(575,296,1,'Size M',0.00,1,NULL),(576,296,3,'100% Đường',0.00,1,NULL),(577,297,1,'Size M',0.00,1,NULL),(578,297,3,'100% Đường',0.00,1,NULL),(579,302,1,'Size M',0.00,1,NULL),(580,302,3,'100% Đường',0.00,1,NULL),(581,304,1,'Size M',0.00,1,NULL),(582,304,3,'100% Đường',0.00,1,NULL),(583,304,11,'Ghi chú thêm',2000.00,1,'Thêm gói đường'),(584,305,1,'Size M',0.00,1,NULL),(585,305,3,'100% Đường',0.00,1,NULL),(586,305,6,'Trân châu đen',5000.00,1,NULL),(587,305,7,'Thạch trái cây',5000.00,1,NULL),(588,306,2,'Size L',5000.00,1,NULL),(589,306,3,'100% Đường',0.00,1,NULL),(590,306,11,'Ghi chú thêm',0.00,1,'Them duong'),(591,310,11,'Ghi chú thêm',5000.00,1,'Ít đá, nhiều sữa, thêm 1 gói đường riêng'),(592,310,4,'50% Đường',0.00,1,NULL),(593,310,9,'Size XL',10000.00,1,NULL),(594,311,1,'Size M',0.00,1,NULL),(595,311,3,'100% Đường',0.00,1,NULL),(596,311,15,'Trân châu trắng',5000.00,1,NULL),(597,315,1,'Size M',0.00,1,NULL),(598,315,3,'100% Đường',0.00,1,NULL),(599,315,11,'Ghi chú thêm',5000.00,1,'Đường nhiều hơn 100%'),(650,342,2,'Size L',5000.00,1,NULL),(651,342,4,'50% Đường',0.00,1,NULL),(654,344,9,'Size XL',10000.00,1,NULL),(655,344,4,'50% Đường',0.00,1,NULL),(656,345,9,'Size XL',10000.00,1,NULL),(657,345,5,'Không đường',0.00,1,NULL),(658,345,6,'Trân châu đen',5000.00,1,NULL),(659,345,7,'Thạch trái cây',5000.00,1,NULL),(660,345,8,'Kem cheese mặn',10000.00,1,NULL),(661,346,1,'Size M',0.00,1,NULL),(662,346,3,'100% Đường',0.00,1,NULL),(663,347,2,'Size L',5000.00,1,NULL),(664,347,4,'50% Đường',0.00,1,NULL),(665,348,2,'Size L',5000.00,1,NULL),(666,348,3,'100% Đường',0.00,1,NULL),(667,349,1,'Size M',0.00,1,NULL),(668,349,3,'100% Đường',0.00,1,NULL),(669,349,7,'Thạch trái cây',5000.00,1,NULL);
/*!40000 ALTER TABLE `order_modifier_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `order_code` varchar(50) NOT NULL,
  `table_id` int DEFAULT NULL,
  `order_type` enum('DINE_IN','TAKE_AWAY') NOT NULL DEFAULT 'DINE_IN',
  `status` enum('PENDING','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  `payment_status` enum('UNPAID','PAID','REFUNDED') DEFAULT 'UNPAID',
  `payment_method` varchar(50) DEFAULT 'CASH',
  `total_amount` decimal(15,2) NOT NULL,
  `discount_amount` decimal(15,2) DEFAULT '0.00',
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `note` text,
  `created_by_user_id` int DEFAULT NULL,
  `shift_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `kitchen_print_count` int DEFAULT '0',
  `discount_type` varchar(20) DEFAULT 'NONE',
  `final_amount` double DEFAULT '0',
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `fk_order_user` (`created_by_user_id`),
  KEY `fk_order_table` (`table_id`),
  CONSTRAINT `fk_order_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`table_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_order_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=90 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (2,'#07362',1,'DINE_IN','COMPLETED','PAID','CASH',30000.00,0.00,0.00,'',1,NULL,'2025-12-08 07:55:07','2025-12-10 01:50:59',0,'NONE',0),(3,'#97150',1,'DINE_IN','COMPLETED','PAID','CASH',50000.00,0.00,0.00,NULL,1,NULL,'2025-12-08 08:01:37',NULL,0,'NONE',0),(4,'#49204',1,'DINE_IN','COMPLETED','PAID','CASH',45000.00,0.00,0.00,'',1,NULL,'2025-12-08 08:29:09','2025-12-10 01:50:44',0,'NONE',0),(5,'#26407',NULL,'DINE_IN','COMPLETED','PAID','CASH',70000.00,0.00,0.00,'',1,NULL,'2025-12-08 08:32:06','2025-12-10 01:50:20',0,'NONE',0),(6,'#19614',NULL,'DINE_IN','COMPLETED','PAID','CASH',80000.00,0.00,0.00,NULL,1,NULL,'2025-12-08 08:48:43',NULL,0,'NONE',0),(7,'#95172',1,'DINE_IN','COMPLETED','PAID','CASH',60000.00,0.00,0.00,'',1,NULL,'2025-12-08 09:19:55','2025-12-10 08:30:54',0,'NONE',0),(8,'#17276',3,'DINE_IN','COMPLETED','PAID','CASH',40000.00,0.00,0.00,'',1,NULL,'2025-12-10 07:01:57','2025-12-10 08:31:28',0,'NONE',0),(9,'#03524',NULL,'DINE_IN','COMPLETED','PAID','CASH',38000.00,0.00,0.00,'',1,NULL,'2025-12-10 07:23:23','2025-12-10 07:24:09',0,'NONE',0),(10,'#61946',3,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-10 07:34:21','2025-12-10 08:31:48',0,'NONE',0),(11,'#33293',1,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-10 07:48:53','2025-12-12 01:50:30',0,'NONE',0),(12,'#28219',11,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-10 08:00:28','2025-12-12 01:57:55',0,'NONE',0),(13,'#01552',6,'DINE_IN','COMPLETED','PAID','CASH',217000.00,0.00,0.00,'',1,NULL,'2025-12-10 08:16:41','2025-12-12 01:55:16',0,'NONE',0),(14,'#32311',12,'DINE_IN','CANCELLED','UNPAID','CASH',35000.00,0.00,0.00,' [Đã gộp sang đơn khác]',1,NULL,'2025-12-10 08:28:52',NULL,0,'NONE',0),(16,'#45297',3,'DINE_IN','COMPLETED','PAID','CASH',110000.00,0.00,0.00,'',1,NULL,'2025-12-12 02:02:25','2025-12-12 06:44:58',0,'NONE',0),(17,'#64884',2,'DINE_IN','CANCELLED','UNPAID','CASH',75000.00,0.00,0.00,' [Đã gộp sang đơn khác]',1,NULL,'2025-12-12 02:02:44',NULL,0,'NONE',0),(18,'#86051',3,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-12 02:03:06','2025-12-12 05:43:57',0,'NONE',0),(19,'#27051',11,'DINE_IN','COMPLETED','PAID','CASH',117000.00,0.00,0.00,'',1,NULL,'2025-12-12 02:17:07','2025-12-12 05:57:17',0,'NONE',0),(20,'#17505',5,'DINE_IN','COMPLETED','PAID','CASH',38000.00,0.00,0.00,'',1,NULL,'2025-12-12 02:31:57','2025-12-12 05:47:00',0,'NONE',0),(21,'#86850',2,'DINE_IN','COMPLETED','PAID','CASH',45000.00,0.00,0.00,'',1,NULL,'2025-12-12 06:06:26','2025-12-12 06:34:00',0,'NONE',0),(22,'#48177',1,'DINE_IN','COMPLETED','PAID','CASH',92000.00,0.00,0.00,'',1,NULL,'2025-12-12 06:37:28','2025-12-12 06:38:09',0,'NONE',0),(23,'#75895',2,'DINE_IN','CANCELLED','UNPAID','CASH',75000.00,0.00,0.00,' [Đã gộp sang đơn khác]',1,NULL,'2025-12-12 06:41:15',NULL,0,'NONE',0),(24,'#65680',NULL,'TAKE_AWAY','COMPLETED','PAID','CASH',975000.00,0.00,0.00,'',1,NULL,'2025-12-12 06:46:05','2025-12-17 01:25:00',0,'NONE',0),(25,'#08607',1,'DINE_IN','CANCELLED','UNPAID','CASH',0.00,0.00,0.00,' [Đã gộp sang đơn khác]',3,NULL,'2025-12-15 02:30:08',NULL,2,'NONE',0),(26,'#75888',2,'DINE_IN','COMPLETED','PAID','CASH',40000.00,0.00,0.00,'',3,NULL,'2025-12-15 03:02:55','2025-12-15 08:58:49',0,'NONE',0),(27,'#84958',3,'DINE_IN','COMPLETED','PAID','CASH',294000.00,0.00,0.00,'',3,NULL,'2025-12-15 03:19:44','2025-12-19 03:22:52',1,'NONE',0),(28,'#09892',4,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',3,NULL,'2025-12-15 03:23:29','2025-12-19 03:29:38',1,'NONE',0),(29,'#48652',5,'DINE_IN','COMPLETED','PAID','CASH',35000.00,0.00,0.00,'',3,NULL,'2025-12-15 03:39:08','2025-12-17 00:53:30',2,'NONE',0),(30,'#43421',6,'DINE_IN','COMPLETED','PAID','CASH',35000.00,0.00,0.00,'',3,NULL,'2025-12-15 03:50:43','2025-12-15 04:00:36',3,'NONE',0),(31,'#62606',NULL,'DINE_IN','COMPLETED','PAID','CASH',0.00,0.00,0.00,NULL,3,NULL,'2025-12-15 04:07:42','2026-01-27 01:23:31',1,'NONE',0),(32,'#52064',7,'DINE_IN','COMPLETED','PAID','CASH',105000.00,0.00,0.00,'',3,NULL,'2025-12-15 04:10:52','2025-12-25 01:02:42',2,'NONE',0),(33,'#68272',8,'DINE_IN','CANCELLED','UNPAID','CASH',0.00,0.00,0.00,' [Đã gộp sang đơn khác]',3,NULL,'2025-12-15 04:16:08',NULL,3,'NONE',0),(34,'#15281',9,'DINE_IN','COMPLETED','PAID','CASH',378000.00,0.00,0.00,'',3,NULL,'2025-12-15 06:05:15','2025-12-25 06:09:36',0,'NONE',0),(35,'#46786',11,'DINE_IN','COMPLETED','PAID','CASH',225000.00,0.00,0.00,'',3,NULL,'2025-12-15 06:50:46','2025-12-17 01:25:33',1,'NONE',0),(36,'#87238',12,'DINE_IN','COMPLETED','PAID','CASH',120000.00,0.00,0.00,'',3,NULL,'2025-12-15 07:11:27','2025-12-25 03:46:48',0,'NONE',0),(37,'#75885',10,'DINE_IN','COMPLETED','PAID','CASH',45000.00,0.00,0.00,'',3,NULL,'2025-12-15 08:09:35','2025-12-17 00:52:52',0,'NONE',0),(38,'#21019',13,'DINE_IN','COMPLETED','PAID','CASH',812000.00,0.00,0.00,'',3,NULL,'2025-12-15 08:53:41','2025-12-17 00:53:13',0,'NONE',0),(39,'#46091',2,'DINE_IN','COMPLETED','PAID','CASH',420000.00,0.00,0.00,'',3,NULL,'2025-12-15 08:59:06','2025-12-17 00:52:34',0,'NONE',0),(40,'#11904',NULL,'TAKE_AWAY','COMPLETED','PAID','CASH',261000.00,0.00,0.00,'',3,NULL,'2025-12-15 09:06:51','2025-12-17 01:25:11',0,'NONE',0),(41,'#94838',NULL,'DINE_IN','COMPLETED','PAID','CASH',0.00,0.00,0.00,NULL,3,NULL,'2025-12-15 09:13:14','2026-01-27 01:25:22',0,'NONE',0),(42,'#82246',5,'DINE_IN','COMPLETED','PAID','CASH',87000.00,0.00,0.00,'',3,NULL,'2025-12-17 01:21:22','2025-12-19 03:46:47',0,'NONE',0),(43,'#06548',10,'DINE_IN','COMPLETED','PAID','CASH',157000.00,0.00,0.00,'',1,NULL,'2025-12-17 03:23:26','2025-12-26 03:48:48',0,'NONE',0),(44,'#27023',2,'DINE_IN','COMPLETED','PAID','CASH',30000.00,0.00,0.00,'',1,NULL,'2025-12-19 03:13:47','2025-12-19 03:14:25',0,'NONE',0),(45,'#58065',3,'DINE_IN','COMPLETED','PAID','CASH',336000.00,0.00,0.00,'',1,NULL,'2025-12-25 03:15:58','2025-12-26 03:49:59',0,'NONE',0),(46,'#87918',7,'DINE_IN','COMPLETED','PAID','CASH',395000.00,0.00,0.00,'',1,NULL,'2025-12-25 03:41:27','2025-12-27 15:57:08',0,'NONE',0),(47,'#79272',9,'DINE_IN','COMPLETED','PAID','CASH',360000.00,0.00,0.00,'',1,NULL,'2025-12-25 06:21:19',NULL,0,'NONE',0),(48,'#06876',NULL,'DINE_IN','COMPLETED','PAID','CASH',0.00,0.00,0.00,NULL,1,NULL,'2025-12-25 06:31:46','2026-01-27 01:24:39',0,'NONE',0),(49,'#18921',9,'DINE_IN','COMPLETED','PAID','CASH',62000.00,0.00,0.00,'',1,NULL,'2025-12-25 07:08:38',NULL,0,'NONE',0),(50,'#34308',8,'DINE_IN','COMPLETED','PAID','CASH',45000.00,0.00,0.00,'',1,NULL,'2025-12-25 07:13:54',NULL,0,'NONE',0),(51,'#60961',8,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-25 07:14:20',NULL,0,'NONE',0),(52,'#73329',4,'DINE_IN','CANCELLED','UNPAID','CASH',0.00,0.00,0.00,' [Đã gộp sang đơn khác]',1,NULL,'2025-12-26 02:12:53',NULL,0,'NONE',0),(53,'#22466',8,'DINE_IN','COMPLETED','PAID','CASH',47000.00,0.00,0.00,'',1,NULL,'2025-12-26 02:13:42','2025-12-26 02:14:24',0,'NONE',0),(54,'#15968',1,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-26 02:15:15','2025-12-26 02:15:27',0,'NONE',0),(55,'#18464',9,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-26 02:33:38','2025-12-26 02:33:50',0,'NONE',0),(56,'#52073',8,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-26 02:34:12',NULL,0,'NONE',0),(57,'#95294',8,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-26 02:36:35',NULL,0,'NONE',0),(58,'#52443',9,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-26 03:50:52',NULL,0,'NONE',0),(59,'#71983',NULL,'DINE_IN','COMPLETED','PAID','CASH',0.00,0.00,0.00,NULL,1,NULL,'2025-12-27 15:51:12','2026-01-27 01:23:54',0,'NONE',0),(60,'#23839',1,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-27 16:02:03','2025-12-27 16:02:16',0,'NONE',0),(61,'#43779',7,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',1,NULL,'2025-12-27 16:05:43',NULL,0,'NONE',0),(62,'#18392',7,'DINE_IN','COMPLETED','PAID','CASH',108000.00,54000.00,0.00,'',1,NULL,'2025-12-30 00:36:58','2026-01-13 08:31:24',0,'NONE',0),(63,'#23139',15,'DINE_IN','COMPLETED','PAID','CASH',160000.00,32000.00,0.00,'',1,NULL,'2025-12-30 05:53:43','2026-01-13 06:52:42',0,'NONE',0),(64,'#09944',16,'DINE_IN','COMPLETED','PAID','CASH',42000.00,0.00,0.00,'',3,NULL,'2026-01-04 08:46:49',NULL,0,'NONE',0),(66,'#54241',1,'DINE_IN','COMPLETED','PAID','CASH',84000.00,0.00,0.00,'',3,NULL,'2026-01-10 07:15:54',NULL,0,'NONE',0),(67,'#62107',1,'DINE_IN','COMPLETED','PAID','CASH',35000.00,0.00,0.00,'',1,NULL,'2026-01-13 05:59:22',NULL,0,'NONE',0),(68,'#09662',1,'DINE_IN','COMPLETED','PAID','CASH',140000.00,20000.00,0.00,'',3,NULL,'2026-01-13 07:15:09',NULL,0,'NONE',0),(69,'#18060',2,'DINE_IN','COMPLETED','PAID','CASH',35000.00,35000.00,0.00,'',1,NULL,'2026-01-13 07:35:18',NULL,0,'NONE',0),(70,'#22801',10,'DINE_IN','COMPLETED','PAID','CASH',210000.00,21000.00,0.00,'',1,NULL,'2026-01-13 08:32:02',NULL,0,'NONE',0),(71,'#15994',1,'DINE_IN','COMPLETED','PAID','CASH',546000.00,109200.00,0.00,'',1,NULL,'2026-01-21 13:20:16',NULL,0,'NONE',0),(72,'#09242',11,'DINE_IN','COMPLETED','PAID','CASH',710000.00,142000.00,0.00,'',1,NULL,'2026-01-21 13:48:29',NULL,0,'NONE',0),(73,'ORD-597205-RLES',NULL,'DINE_IN','COMPLETED','PAID','CASH',0.00,0.00,0.00,NULL,1,NULL,'2026-01-22 07:39:57','2026-01-27 01:22:54',0,'NONE',0),(74,'ORD-119666-UNPX',NULL,'DINE_IN','COMPLETED','PAID','CASH',0.00,0.00,0.00,NULL,1,NULL,'2026-01-22 07:48:39','2026-01-27 01:23:43',0,'NONE',0),(75,'ORD-885908-0LKS',NULL,'DINE_IN','COMPLETED','PAID','CASH',0.00,0.00,0.00,NULL,1,NULL,'2026-01-24 06:08:05','2026-01-27 01:22:38',0,'NONE',0),(76,'ORD-765026-IWTH',NULL,'DINE_IN','COMPLETED','PAID','CASH',0.00,0.00,0.00,NULL,1,NULL,'2026-01-27 01:36:05','2026-01-27 01:36:19',0,'NONE',0),(77,'ORD-889063-BLUM',NULL,'DINE_IN','COMPLETED','PAID','CASH',0.00,0.00,0.00,NULL,1,NULL,'2026-01-27 08:38:09','2026-01-27 08:38:17',0,'NONE',0),(78,'ORD-851472-46EU',NULL,'DINE_IN','COMPLETED','PAID','CASH',0.00,0.00,0.00,NULL,1,NULL,'2026-01-27 08:54:11','2026-01-27 08:54:58',0,'NONE',0),(79,'ORD-972889-PE4N',NULL,'DINE_IN','COMPLETED','PAID','CASH',237000.00,50000.00,0.00,'Khách đưa: 237000',1,NULL,'2026-01-27 09:12:52','2026-01-27 13:22:21',0,'NONE',0),(80,'ORD-765413-E1CW',NULL,'DINE_IN','COMPLETED','PAID','CASH',91000.00,50000.00,0.00,'Khách đưa: 91000',1,NULL,'2026-01-27 09:26:05','2026-01-27 09:50:53',0,'NONE',0),(81,'ORD-752479-N9G0',NULL,'DINE_IN','COMPLETED','PAID','CASH',140000.00,35000.00,0.00,'Khách đưa: 200000',1,NULL,'2026-01-27 09:59:12','2026-01-27 10:00:19',0,'NONE',0),(82,'ORD-804350-808I',16,'DINE_IN','CANCELLED','UNPAID','CASH',0.00,0.00,0.00,'\n[Chuyển bàn]: Từ bàn 4 sang bàn 16\n[Chuyển bàn]: Từ bàn 16 sang bàn 4\n[Chuyển bàn]: Từ bàn 4 sang bàn 16 [Đã gộp sang đơn khác]',1,NULL,'2026-01-27 13:20:04',NULL,0,'NONE',0),(83,'ORD-656735-OISO',1,'DINE_IN','PENDING','UNPAID','CASH',40000.00,0.00,0.00,'\n[Chuyển bàn]: Từ bàn 3 sang bàn 1',1,NULL,'2026-01-30 05:24:16',NULL,0,'NONE',0),(84,'ORD-620812-6CMW',NULL,'DINE_IN','COMPLETED','PAID','CASH',20000.00,10000.00,0.00,'Khách đưa: 50000',1,NULL,'2026-03-03 04:37:02','2026-03-03 05:42:02',0,'NONE',0),(85,'ORD-053858-IIZF',10,'DINE_IN','PENDING','UNPAID','CASH',470000.00,0.00,0.00,'',1,NULL,'2026-03-05 02:34:12',NULL,0,'NONE',0),(86,'ORD-327483-Z44L',NULL,'DINE_IN','COMPLETED','PAID','CASH',30000.00,10000.00,0.00,'Khách đưa: 20000',1,NULL,'2026-03-05 02:38:46','2026-03-05 03:09:59',0,'NONE',20000),(87,'ORD-448078-CLOD',NULL,'DINE_IN','COMPLETED','PAID','CASH',400000.00,0.00,0.00,'Khách đưa: 400000',1,14,'2026-03-05 11:04:07','2026-03-05 11:04:21',0,'NONE',400000),(88,'ORD-593090-ZCBE',NULL,'DINE_IN','COMPLETED','PAID','CASH',70000.00,0.00,0.00,'Khách đưa: 100000',1,14,'2026-03-05 11:06:32','2026-03-05 11:06:47',0,'NONE',70000),(89,'ORD-944985-AF3U',7,'DINE_IN','PENDING','UNPAID','CASH',245000.00,0.00,0.00,'',1,NULL,'2026-03-05 06:25:44',NULL,0,'NONE',0);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_modifier_links`
--

DROP TABLE IF EXISTS `product_modifier_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_modifier_links` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `group_id` (`group_id`),
  CONSTRAINT `product_modifier_links_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_modifier_links_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `modifier_groups` (`group_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_modifier_links`
--

LOCK TABLES `product_modifier_links` WRITE;
/*!40000 ALTER TABLE `product_modifier_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_modifier_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_modifiers`
--

DROP TABLE IF EXISTS `product_modifiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_modifiers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `modifier_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `modifier_id` (`modifier_id`),
  CONSTRAINT `product_modifiers_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  CONSTRAINT `product_modifiers_ibfk_2` FOREIGN KEY (`modifier_id`) REFERENCES `modifiers` (`modifier_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=264 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_modifiers`
--

LOCK TABLES `product_modifiers` WRITE;
/*!40000 ALTER TABLE `product_modifiers` DISABLE KEYS */;
INSERT INTO `product_modifiers` VALUES (91,12,8),(92,12,7),(93,12,6),(94,12,5),(95,12,4),(96,12,3),(97,12,9),(98,12,2),(99,12,1),(101,11,8),(102,11,7),(103,11,6),(104,11,5),(105,11,4),(106,11,3),(107,11,9),(108,11,2),(109,11,1),(111,9,8),(112,9,7),(113,9,6),(114,9,5),(115,9,4),(116,9,3),(117,9,9),(118,9,2),(119,9,1),(121,3,8),(122,3,7),(123,3,6),(124,3,5),(125,3,4),(126,3,3),(127,3,9),(128,3,2),(129,3,1),(155,1,9),(156,1,2),(157,1,1),(158,1,11),(159,8,5),(160,8,4),(161,8,3),(162,8,9),(163,8,2),(164,8,1),(165,8,11),(166,13,8),(167,13,7),(168,13,6),(169,13,5),(170,13,4),(171,13,3),(172,13,9),(173,13,2),(174,13,1),(175,13,11),(176,10,5),(177,10,4),(178,10,3),(179,10,9),(180,10,2),(181,10,1),(182,10,8),(183,10,7),(184,10,6),(185,10,11),(194,5,5),(195,5,4),(196,5,3),(197,5,9),(198,5,2),(199,5,1),(200,5,12),(201,5,11),(202,6,5),(203,6,4),(204,6,3),(205,6,9),(206,6,2),(207,6,1),(208,6,11),(210,7,5),(211,7,4),(212,7,3),(213,7,9),(214,7,2),(215,7,1),(216,7,12),(217,7,11),(219,21,12),(220,24,2),(221,24,5),(222,24,4),(223,24,3),(224,24,11),(238,25,14),(239,25,13),(240,25,8),(241,25,7),(242,25,6),(243,25,5),(244,25,4),(245,25,3),(246,25,9),(247,25,2),(248,25,1),(249,25,12),(250,25,11),(251,25,15),(258,2,5),(259,2,4),(260,2,3),(261,2,9),(262,2,2),(263,2,1);
/*!40000 ALTER TABLE `product_modifiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_prices`
--

DROP TABLE IF EXISTS `product_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_prices` (
  `price_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `price_value` decimal(15,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'VND',
  `effective_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  PRIMARY KEY (`price_id`),
  KEY `fk_price_product` (`product_id`),
  CONSTRAINT `fk_price_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_prices`
--

LOCK TABLES `product_prices` WRITE;
/*!40000 ALTER TABLE `product_prices` DISABLE KEYS */;
INSERT INTO `product_prices` VALUES (1,1,25000.00,'VND','2025-12-08 05:34:18',NULL),(2,2,30000.00,'VND','2025-12-08 05:34:18',NULL),(3,3,40000.00,'VND','2025-12-08 05:34:18',NULL),(4,4,35000.00,'VND','2025-12-08 05:34:18',NULL),(26,16,40000.00,'VND','2025-12-30 05:50:10',NULL),(27,5,35000.00,'VND','2025-12-10 02:58:22',NULL),(28,6,40000.00,'VND','2025-12-10 02:58:22',NULL),(29,7,42000.00,'VND','2025-12-10 02:58:22',NULL),(30,8,45000.00,'VND','2025-12-10 02:58:22',NULL),(31,9,35000.00,'VND','2025-12-10 05:44:08',NULL),(32,10,35000.00,'VND','2025-12-10 05:44:08',NULL),(33,11,42000.00,'VND','2025-12-10 05:44:08',NULL),(34,12,42000.00,'VND','2025-12-10 05:44:08',NULL),(35,13,42000.00,'VND','2025-12-10 05:44:08',NULL),(36,14,35000.00,'VND','2025-12-10 05:44:08',NULL),(37,15,38000.00,'VND','2025-12-10 05:44:08',NULL),(39,19,50000.00,'VND','2026-01-06 01:46:06',NULL),(40,20,45000.00,'VND','2026-01-06 03:35:24',NULL),(41,21,40000.00,'VND','2026-01-13 03:44:44',NULL),(42,22,60000.00,'VND','2026-01-13 03:51:38',NULL),(43,23,55000.00,'VND','2026-01-13 03:58:33',NULL),(44,24,30000.00,'VND','2026-01-13 04:11:44',NULL),(45,25,30000.00,'VND','2026-01-13 07:31:34',NULL);
/*!40000 ALTER TABLE `product_prices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  KEY `fk_product_category` (`category_id`),
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Cà phê Đen',1,'','cafe_den.jpg',1,'2025-12-08 05:34:18'),(2,'Bạc Xỉu',1,'','bacxiu.jpg',1,'2025-12-08 05:34:18'),(3,'Trà Đào',2,'','tra-dao.jpg',1,'2025-12-08 05:34:18'),(4,'Croissant',3,'','croissant.jpg',1,'2025-12-08 05:34:18'),(5,'Americano',1,'','americano.jpg',1,'2025-12-10 02:53:24'),(6,'Latte',1,'','latte.jpg',1,'2025-12-10 02:53:24'),(7,'Cappuccino',1,'','cappuccino.jpg',1,'2025-12-10 02:53:24'),(8,'Cold Brew',1,'','coldbrew.jpg',1,'2025-12-10 02:53:24'),(9,'Trà Xanh Chanh',2,'','tra_xanh_chanh.jpg',1,'2025-12-10 05:43:22'),(10,'Lục Trà',2,'','green_tea.jpg',1,'2025-12-10 05:43:22'),(11,'Trà Xoài',2,'','tra_xoai.jpg',1,'2025-12-10 05:43:22'),(12,'Trà Dâu',2,'','tra_dau.jpg',1,'2025-12-10 05:43:22'),(13,'Trà Dưa Lưới',2,'','tra_dua_luoi.jpg',1,'2025-12-10 05:43:22'),(14,'Bánh Bông Lan Dâu',3,'','bonglan_dau.jpg',1,'2025-12-10 05:43:22'),(15,'Bánh Tiramisu',3,'','tiramisu.jpg',1,'2025-12-10 05:43:22'),(16,'Bánh Pudding',3,'','pudding_cake.png',1,'2025-12-30 05:43:39'),(19,'Bánh Cookie',3,'Món hay lỗi hình :)','cookie.jpg',0,'2026-01-06 01:46:06'),(20,'Bánh Crepe',3,'','banh_crepe.jpg',1,'2026-01-06 03:35:24'),(21,'Bánh quy Cookie',3,'Lỗi nữa xóa luôn món ;)','cookie-2.jpg',1,'2026-01-13 03:44:43'),(22,'Bánh Cream Chocolate Dâu',3,'','chocolate_dau.jpg',1,'2026-01-13 03:51:38'),(23,'Bánh bông lan Cream Trái cây',3,'','fruit_cake.jpg',1,'2026-01-13 03:58:33'),(24,'Espresso',1,'','espresso.jpg',1,'2026-01-13 04:11:44'),(25,'Trà Ổi Hồng',2,'','tra_oi_hong.png',1,'2026-01-13 07:31:34');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotion_categories`
--

DROP TABLE IF EXISTS `promotion_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotion_categories` (
  `promo_id` int NOT NULL,
  `category_id` int NOT NULL,
  PRIMARY KEY (`promo_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `promotion_categories_ibfk_1` FOREIGN KEY (`promo_id`) REFERENCES `promotions` (`promo_id`) ON DELETE CASCADE,
  CONSTRAINT `promotion_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotion_categories`
--

LOCK TABLES `promotion_categories` WRITE;
/*!40000 ALTER TABLE `promotion_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotion_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotion_products`
--

DROP TABLE IF EXISTS `promotion_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotion_products` (
  `promo_id` int NOT NULL,
  `product_id` int NOT NULL,
  PRIMARY KEY (`promo_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `promotion_products_ibfk_1` FOREIGN KEY (`promo_id`) REFERENCES `promotions` (`promo_id`) ON DELETE CASCADE,
  CONSTRAINT `promotion_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotion_products`
--

LOCK TABLES `promotion_products` WRITE;
/*!40000 ALTER TABLE `promotion_products` DISABLE KEYS */;
INSERT INTO `promotion_products` VALUES (2,12),(2,14),(2,15),(2,22),(2,25);
/*!40000 ALTER TABLE `promotion_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promotions` (
  `promo_id` int NOT NULL AUTO_INCREMENT,
  `promo_name` varchar(255) NOT NULL,
  `description` text,
  `discount_type` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  `discount_value` decimal(10,2) NOT NULL,
  `apply_to` enum('BILL','CATEGORY','PRODUCT') DEFAULT 'BILL',
  `min_order_amount` decimal(12,2) DEFAULT '0.00',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days_of_week` varchar(50) DEFAULT NULL COMMENT 'Mảng ngày áp dụng, rỗng = mỗi ngày',
  `time_start` time DEFAULT NULL,
  `time_end` time DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`promo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

LOCK TABLES `promotions` WRITE;
/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
INSERT INTO `promotions` VALUES (1,'Khuyến mãi đầu năm mới 2026','Khuyến mãi năm mới','fixed',10000.00,'BILL',0.00,'2026-03-03','2026-03-10',NULL,'08:00:00','18:00:00',1,'2026-03-03 04:26:25','2026-03-03 04:27:02'),(2,'Happy Women\'s Day',NULL,'percent',20.00,'PRODUCT',0.00,'2026-03-05','2026-03-08',NULL,'07:00:00','22:00:00',1,'2026-03-05 06:23:57','2026-03-05 06:23:57'),(3,'Giảm 10% giá trên hoá đơn 200.000đ',NULL,'percent',10.00,'BILL',200000.00,'2026-03-05','2026-04-05',NULL,NULL,NULL,1,'2026-03-05 06:25:00','2026-03-05 06:25:00');
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifts` (
  `shift_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `start_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_time` datetime DEFAULT NULL,
  `initial_float` double DEFAULT '0',
  `status` varchar(20) DEFAULT 'OPEN',
  `total_sales` double DEFAULT '0',
  `note` text,
  `total_cash_sales` double DEFAULT '0',
  `expected_cash` double DEFAULT '0',
  `actual_cash` double DEFAULT '0',
  `difference` double DEFAULT '0',
  PRIMARY KEY (`shift_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `shifts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
INSERT INTO `shifts` VALUES (1,1,'2026-01-21 13:04:27','2026-01-21 13:06:18',1000000,'CLOSED',0,NULL,0,0,0,0),(2,1,'2026-01-21 13:19:16','2026-01-21 13:28:19',2000000,'CLOSED',0,NULL,546000,2546000,2546000,0),(3,1,'2026-01-21 13:44:14','2026-01-21 13:46:36',2000000,'CLOSED',0,'[Đóng ca]: Không có khách',0,2000000,2000000,0),(4,1,'2026-01-21 13:47:57','2026-01-21 13:49:06',1000000,'CLOSED',0,'[Đóng ca]: Đủ',710000,1710000,1710000,0),(5,1,'2026-01-21 13:50:18','2026-01-21 14:10:19',0,'CLOSED',0,'',0,0,0,0),(6,1,'2026-01-21 14:13:07','2026-01-21 14:13:59',1000000,'CLOSED',0,'[Đóng ca]: Không có khách',0,1000000,1000000,0),(7,1,'2026-01-22 02:58:33','2026-01-22 03:00:09',5000000,'CLOSED',0,'Ca đầu trên Mobile | ',0,5000000,5000000,0),(8,1,'2026-01-22 10:02:26','2026-01-22 10:02:43',1000000,'CLOSED',0,'',0,1000000,1000000,0),(9,1,'2026-01-22 10:11:28','2026-01-22 10:11:52',2000000,'CLOSED',0,'',0,2000000,2000000,0),(10,1,'2026-01-24 06:08:51','2026-01-24 06:09:08',1000000,'CLOSED',0,'',0,1000000,1000000,0),(11,1,'2026-01-27 10:09:29','2026-01-27 10:10:02',1000000,'CLOSED',0,'',0,1000000,1000000,0),(12,1,'2026-01-31 00:32:13','2026-01-31 00:32:31',1000000,'CLOSED',0,'',0,1000000,1000000,0),(13,1,'2026-01-31 07:55:32','2026-01-31 07:55:43',2000000,'CLOSED',0,'',0,2000000,2000000,0),(14,1,'2026-03-05 11:03:42','2026-03-05 11:07:38',100000,'CLOSED',470000,'Tiền đầu | ',470000,570000,570000,0),(15,1,'2026-03-05 06:29:17','2026-03-05 06:29:40',1000000,'CLOSED',0,'',0,1000000,1000000,0);
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tables`
--

DROP TABLE IF EXISTS `tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tables` (
  `table_id` int NOT NULL AUTO_INCREMENT,
  `table_name` varchar(50) NOT NULL,
  `status` enum('AVAILABLE','OCCUPIED','CLEANING') DEFAULT 'AVAILABLE',
  `current_order_id` int DEFAULT NULL,
  `pos_x` double DEFAULT '0',
  `pos_y` double DEFAULT '0',
  `width` double DEFAULT '0.15',
  `height` double DEFAULT '0.15',
  `shape` varchar(20) DEFAULT 'SQUARE',
  `color` varchar(10) DEFAULT '#FFFFFF',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`table_id`),
  KEY `fk_table_current_order` (`current_order_id`),
  CONSTRAINT `fk_table_current_order` FOREIGN KEY (`current_order_id`) REFERENCES `orders` (`order_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
INSERT INTO `tables` VALUES (1,'Bàn 01','OCCUPIED',83,0.27416666269302353,0.03888885709974505,0.15,0.15,'SQUARE','#D7CCC8',1),(2,'Bàn 02','AVAILABLE',NULL,0.3395833690961201,0.0388888782925076,0.15,0.15,'SQUARE','#D7CCC8',1),(3,'Bàn 03','AVAILABLE',NULL,0.6477083313465091,0.0724630335791535,0.15,0.15,'SQUARE','#BBDEFB',1),(4,'Bàn 04','CLEANING',NULL,0.8756249125798536,0.1211110644870337,0.15,0.15,'CIRCLE','#4CAF50',1),(5,'Bàn 05','AVAILABLE',NULL,0.9269792143503816,0.445555623372396,0.15,0.15,'CIRCLE','#4CAF50',1),(6,'Bàn 06','AVAILABLE',NULL,0.4705208730697641,0.03666644838121176,0.15,0.15,'SQUARE','#D7CCC8',1),(7,'Bàn 07','OCCUPIED',89,0.06666665971279141,0.14327899397554653,0.15,0.15,'CIRCLE','#FFF176',1),(8,'Bàn 08','CLEANING',NULL,0.6518751430511461,0.4433334265814888,0.15,0.15,'CIRCLE','#BBDEFB',1),(9,'Bàn 09','AVAILABLE',NULL,0.2391666746139529,0.4233331383599176,0.15,0.15,'RECTANGLE','#BBDEFB',1),(10,'Bàn 10','OCCUPIED',85,0.3957291348775232,0.4266664844089085,0.15,0.15,'RECTANGLE','#BBDEFB',1),(11,'Bàn 11','AVAILABLE',NULL,0.4048958363135655,0.03777761883205736,0.15,0.15,'SQUARE','#D7CCC8',1),(12,'Bàn 12','AVAILABLE',NULL,0.2432291626930237,0.8277777184380413,0.15,0.15,'SQUARE','#BBDEFB',1),(13,'Bàn 13','AVAILABLE',NULL,0.4060416666666665,0.8299999491373689,0.15,0.15,'SQUARE','#BBDEFB',1),(14,'Bàn 14','AVAILABLE',NULL,0.5553124920527136,0.8200000169542094,0.15,0.15,'CIRCLE','#BBDEFB',1),(15,'Bàn 15','AVAILABLE',NULL,0.2087500000000005,0.04021773890087238,0.15,0.15,'SQUARE','#D7CCC8',1),(16,'Bàn 16','AVAILABLE',NULL,0.05697917610406866,0.7714687108582328,0.15,0.15,'CIRCLE','#FFF176',0),(17,'Bàn 17','AVAILABLE',NULL,0,0,0.15,0.15,'RECTANGLE','#FFFFFF',0);
/*!40000 ALTER TABLE `tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `pin_code` varchar(10) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('manager','cashier','barista') DEFAULT 'cashier',
  `avatar_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `pin_code` (`pin_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','000000','Nguyễn Trà Anh Khoa','manager',NULL,1,'2025-12-15 01:14:47'),(2,'cashier',NULL,'Nhân viên Thu Ngân','cashier',NULL,0,'2026-01-31 02:47:02'),(3,'cashier01','888888','Anh Khoa','cashier','assets/avt_nam.jpg',1,'2025-12-30 07:42:45'),(4,'khoanguyễntrà','111111','Khoa Nguyễn Trà','manager',NULL,1,'2026-01-31 01:41:27');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-05 13:40:46
