-- ============================================
-- EDPTech Helpdesk Database Export
-- Generated: 2026-06-08T09:26:30.264Z
-- Database: edptech_helpdesk
-- Tables: 18
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;

-- --------------------------------------------------------
-- Table: `assets`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `assets`;
CREATE TABLE `assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_tag` varchar(50) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `status` enum('active','maintenance','retired') DEFAULT 'active',
  `assigned_to` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_tag` (`asset_tag`),
  KEY `assigned_to` (`assigned_to`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  CONSTRAINT `assets_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table `assets` is empty

-- --------------------------------------------------------
-- Table: `chat_messages`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from_user_id` int(11) DEFAULT NULL,
  `to_user_id` int(11) DEFAULT NULL,
  `from_username` varchar(100) NOT NULL,
  `to_username` varchar(100) NOT NULL,
  `from_user_table` varchar(50) DEFAULT NULL,
  `to_user_table` varchar(50) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `file_url` varchar(255) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `reply_to_id` int(11) DEFAULT NULL,
  `reply_to_message` text DEFAULT NULL,
  `reply_to_username` varchar(100) DEFAULT NULL,
  `is_read` tinyint(4) DEFAULT 0,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_from_username` (`from_username`),
  KEY `idx_to_username` (`to_username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table `chat_messages` is empty

-- --------------------------------------------------------
-- Table: `computer_monitoring`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `computer_monitoring`;
CREATE TABLE `computer_monitoring` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `computer_name` varchar(255) NOT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `mac_address` varchar(17) DEFAULT NULL,
  `mac_vendor` varchar(100) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `os_version` varchar(100) DEFAULT NULL,
  `bit` varchar(10) DEFAULT NULL,
  `ram` varchar(50) DEFAULT NULL,
  `storage` varchar(255) DEFAULT NULL,
  `processor` varchar(255) DEFAULT NULL,
  `antivirus` varchar(255) DEFAULT NULL,
  `ms_license_type` varchar(100) DEFAULT NULL,
  `license_activation` date DEFAULT NULL,
  `license_duration` varchar(50) DEFAULT NULL,
  `license_expiry` date DEFAULT NULL,
  `open_ports` text DEFAULT NULL,
  `services` text DEFAULT NULL,
  `host_type` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `last_checked` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ip` (`ip_address`),
  KEY `idx_computer_name` (`computer_name`),
  KEY `idx_user_name` (`user_name`),
  KEY `idx_department` (`department`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=1540 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data for table `computer_monitoring` (119 rows)
INSERT INTO `computer_monitoring` (`id`, `computer_name`, `user_name`, `location`, `department`, `ip_address`, `mac_address`, `mac_vendor`, `os`, `os_version`, `bit`, `ram`, `storage`, `processor`, `antivirus`, `ms_license_type`, `license_activation`, `license_duration`, `license_expiry`, `open_ports`, `services`, `host_type`, `status`, `last_checked`, `created_at`) VALUES
(30, 'PC-192-168-10-4', 'Unknown', NULL, '', '192.168.10.4', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', NULL, '2026-06-04 09:53:57'),
(31, 'PC-192-168-10-7', 'Unknown', NULL, '', '192.168.10.7', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 05:16:11', '2026-06-04 09:54:11'),
(32, 'EDPTECHUSER1', 'Unknown', NULL, '', '192.168.10.35', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 05:16:11', '2026-06-04 09:54:11'),
(33, 'PC-192-168-10-40', 'Unknown', NULL, '', '192.168.10.40', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 05:16:28', '2026-06-04 09:54:27'),
(34, 'CLP_SERVER', 'Unknown', NULL, '', '192.168.10.105', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 05:16:28', '2026-06-04 09:54:27'),
(35, 'SAOSVRLPC', 'Unknown', NULL, '', '192.168.10.106', 'b4:45:06:f8:1f:8e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389,80', '{"80": "HTTP", "3389": "RDP", "139": "NetBIOS-SSN", "135": "RPC", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-04 09:54:28'),
(36, 'PRSM6', 'Unknown', NULL, '', '192.168.10.167', '00:19:17:33:c7:e2', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-04 09:54:28'),
(37, 'EDTECH20', 'Unknown', NULL, '', '192.168.10.250', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 05:16:37', '2026-06-04 09:54:35'),
(38, 'LPSALESDEPT', 'Unknown', NULL, '', '192.168.10.251', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 05:16:40', '2026-06-04 09:54:37'),
(39, 'LP_C2BACKUP', 'LP_C2BACKUP', NULL, '', '192.168.10.252', '90:09:d0:4b:53:b2', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '139,445,80,443', '{"80": "Web Server", "445": "SMB", "139": "NetBIOS-SSN", "443": "HTTPS"}', 'Web Server', 'online', '2026-06-07 09:35:50', '2026-06-04 09:54:40'),
(73, 'LEESM', 'Unknown', NULL, 'WORKGROUP', '192.168.0.108', '80:30:e0:3c:d3:c1', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80,443', '{"80": "HTTP", "139": "NetBIOS-SSN", "443": "HTTPS", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:40', '2026-06-07 07:19:23'),
(74, 'SAOSVRLPC', 'Unknown', NULL, 'WORKGROUP', '192.168.0.36', 'b4:45:06:f8:1f:8e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389,80', '{"80": "HTTP", "3389": "RDP", "139": "NetBIOS-SSN", "135": "RPC", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:40', '2026-06-07 07:19:23'),
(75, 'LEESM', 'Unknown', NULL, 'WORKGROUP', '192.168.0.11', '80:30:e0:3c:d3:c0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80,443', '{"80": "HTTP", "443": "HTTPS", "139": "NetBIOS-SSN", "135": "RPC", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:40', '2026-06-07 07:19:23'),
(76, 'LSPMAIN', 'LSPMAIN', NULL, 'WORKGROUP', '192.168.1.253', '00:11:32:ea:34:5b', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '139,445,80,443', '{"80": "Web Server", "139": "NetBIOS-SSN", "443": "HTTPS", "445": "SMB"}', 'Web Server', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(77, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.0.7', '80:30:e0:3c:e3:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{"3389": "RDP", "135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(78, 'PRSM12', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.173', '00:19:17:b9:9a:d3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(79, 'PAYDBS', 'Unknown', NULL, 'WORKGROUP', '192.168.0.4', 'dc:fe:07:1a:4c:81', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{"3389": "RDP", "445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(80, 'PRSM13', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.174', '00:19:17:b9:9a:b8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(81, 'PRSM9', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.170', '00:19:17:33:c9:11', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(82, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.0.112', '80:30:e0:3c:e3:13', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{"3389": "RDP", "445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(83, 'Supermarket', 'Unknown', NULL, '', '192.168.0.12', '80:30:e0:3b:f4:d8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,443', '{"135": "RPC", "139": "NetBIOS-SSN", "445": "SMB", "443": "HTTPS"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(84, 'PRSM5', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.166', '00:19:17:33:c9:88', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(85, 'SSLPH6', 'Unknown', NULL, 'WORKGROUP', '192.168.1.68', '00:19:17:b9:99:f0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(86, 'PRSM11', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.172', '00:19:17:33:c9:fd', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(87, 'PRS6', 'Unknown', NULL, 'WORKGROUP', '192.168.0.120', '00:19:17:33:ca:2d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(88, 'SSLPH13', 'Unknown', NULL, 'WORKGROUP', '192.168.1.72', '00:19:17:33:c9:3a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(89, 'PRS2', 'Unknown', NULL, 'WORKGROUP', '192.168.0.116', '00:19:17:b9:9a:1d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(90, 'PRF2', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.144', '00:19:17:33:c9:aa', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(91, 'PRSM10', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.171', '00:19:17:b9:9a:73', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(93, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.10.104', '80:30:e0:3c:e3:11', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{"3389": "RDP", "135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(94, 'PRSM14', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.176', '00:19:17:41:10:41', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{"80": "HTTP", "135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(95, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.10.100', '80:30:e0:3c:e3:12', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{"3389": "RDP", "135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(96, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.0.109', '80:30:e0:3c:e3:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{"3389": "RDP", "135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:24'),
(97, 'EDPDGRECEIVE2', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.72', '7c:05:07:0e:0c:59', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(98, 'DSRECEIVE3', 'Unknown', NULL, 'WORKGROUP', '192.168.0.84', 'ec:a8:6b:f6:26:e6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(99, 'DSPURCHASE10', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.48', 'd8:5e:d3:4e:7a:b5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(100, 'OS1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.100', '18:60:24:8a:a5:56', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(101, 'AUDITING1', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.92', 'fc:aa:14:84:4d:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(102, 'EDP1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.76', 'e8:9c:25:23:88:88', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(103, 'AUDITING5', 'Unknown', NULL, 'WORKGROUP', '192.168.0.96', '38:60:77:25:4e:c5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(104, 'EDPRR', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.79', 'ec:a8:6b:f5:ad:c5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(105, 'CONCESSION1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.32', 'd8:43:ae:93:e5:a8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(106, 'DSPURCHASE6', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.44', '2c:f0:5d:8f:5c:7d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(107, 'PO8', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.56', 'fc:aa:14:84:4d:e2', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:25'),
(108, 'SMPO2', 'Unknown', NULL, 'WORKGROUP', '192.168.0.186', '18:c0:4d:4f:49:4d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:25'),
(109, 'PO4', 'Unknown', NULL, 'WORKGROUP', '192.168.0.58', '7c:05:07:0f:d5:70', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(110, 'FINANCE3', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.200', 'd8:5e:d3:c6:8e:8d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:25'),
(111, 'SMPRETURN', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.196', 'b8:ae:ed:ff:65:03', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:25'),
(112, 'PRFF3', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.152', 'c8:d9:d2:2a:f5:58', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(113, 'SMPURCHASE', 'Unknown', NULL, 'WORKGROUP', '192.168.0.191', '7c:05:07:11:34:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:25');

INSERT INTO `computer_monitoring` (`id`, `computer_name`, `user_name`, `location`, `department`, `ip_address`, `mac_address`, `mac_vendor`, `os`, `os_version`, `bit`, `ram`, `storage`, `processor`, `antivirus`, `ms_license_type`, `license_activation`, `license_duration`, `license_expiry`, `open_ports`, `services`, `host_type`, `status`, `last_checked`, `created_at`) VALUES
(114, 'SMRECEIVE', 'Unknown', NULL, 'WORKGROUP', '192.168.0.194', '1c:1b:0d:1e:10:c5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "135": "RPC", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:25'),
(115, 'PRSM20', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.181', 'd8:bb:c1:29:16:01', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(116, 'SMPO6', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.190', '84:a9:3e:6c:84:1b', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "135": "RPC", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:25'),
(117, 'PO3', 'Unknown', NULL, 'WORKGROUP', '192.168.0.51', '74:d4:35:bf:46:87', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:41', '2026-06-07 07:19:25'),
(118, 'PRSM19', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.180', 'd8:bb:c1:29:16:68', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(119, 'SMRECEIVE2', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.198', 'e0:d5:5e:70:9e:9a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:25'),
(120, 'SMPO4', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.188', '4c:cc:6a:8f:b8:24', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:25'),
(121, 'PRSM17', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.178', 'd8:bb:c1:29:15:9b', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:25'),
(122, 'SMPO3', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.187', '4c:cc:6a:8f:b7:b3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:25'),
(123, 'LHMBO', 'Unknown', NULL, 'WORKGROUP', '192.168.1.48', 'b8:ae:ed:ff:c0:32', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:32'),
(124, 'LHMEDP', 'Unknown', NULL, 'WORKGROUP', '192.168.1.33', 'b4:2e:99:dd:03:a8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'offline', NULL, '2026-06-07 07:19:32'),
(125, 'PRS9', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.124', '84:a9:3e:6c:83:75', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:32'),
(126, 'OFFTAKE1', 'Unknown', NULL, 'WORKGROUP', '192.168.1.36', 'b4:2e:99:dd:03:a3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:33'),
(127, 'LHMAUDITING', 'Unknown', NULL, 'WORKGROUP', '192.168.1.52', 'f4:b5:20:44:9e:79', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:33'),
(128, 'LHMRECEIVING2', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.44', 'f4:b5:20:40:9c:76', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:33'),
(129, 'PRF6', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.148', '84:a9:3e:6c:84:0e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:33'),
(130, 'LPHFINANCE', 'Unknown', NULL, 'WORKGROUP', '192.168.1.32', '10:78:d2:84:3f:ad', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "135": "RPC", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:49', '2026-06-07 07:19:33'),
(131, 'CWH_SMRELEASE', 'Unknown', NULL, 'WORKGROUP', '192.168.2.4', 'b4:2e:99:dc:7c:63', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:33'),
(132, 'PERSONNEL10', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.220', 'f4:b5:20:78:33:d8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:33'),
(133, 'OSFSNB', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.232', 'c8:5b:76:71:d7:9c', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:33'),
(134, 'CWH_DGRELEASE4', 'Unknown', NULL, 'CWAREHOUSE', '192.168.2.16', 'b4:2e:99:52:19:1e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:33'),
(135, 'CWH_RECEIVE', 'Unknown', NULL, 'WORKGROUP', '192.168.2.3', '4c:cc:6a:6d:21:26', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'offline', '2026-06-07 08:52:45', '2026-06-07 07:19:34'),
(136, 'LSPCORP', 'Unknown', NULL, 'WORKGROUP', '192.168.1.248', 'b8:ae:ed:ff:bf:36', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:34'),
(137, 'POS03-', 'Unknown', NULL, 'WORKGROUP', '192.168.1.60', 'fc:aa:14:84:4d:e6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:34'),
(138, 'HR2', 'Unknown', NULL, 'WORKGROUP', '192.168.1.202', 'b8:ae:ed:ff:e2:f0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:49', '2026-06-07 07:19:34'),
(139, 'LPHAUDITING4', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.64', '10:e7:c6:2e:88:ef', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:49', '2026-06-07 07:19:34'),
(140, 'LHMDGPROMOTION', 'Unknown', NULL, 'WORKGROUP', '192.168.1.34', 'e0:69:95:eb:7a:aa', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:34'),
(141, 'LHMEDP1', 'Unknown', NULL, 'WORKGROUP', '192.168.1.232', 'f4:b5:20:75:3e:17', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "135": "RPC", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:34'),
(142, 'SMRECEIVE4', 'Unknown', NULL, 'WORKGROUP', '192.168.0.244', 'ec:a8:6b:71:09:0e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:34'),
(143, 'SSLPH19', 'Unknown', NULL, 'WORKGROUP', '192.168.1.92', '2c:f0:5d:c8:af:f6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:34'),
(144, 'OFFTAKE2', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.37', 'f4:b5:20:44:9e:22', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'offline', '2026-06-07 09:26:20', '2026-06-07 07:19:34'),
(145, 'LHMAUDITING1', 'Unknown', NULL, 'WORKGROUP', '192.168.1.40', '2c:f0:5d:8f:5b:ae', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:34'),
(146, 'LHMTIMEKEEPER', 'Unknown', NULL, 'WORKGROUP', '192.168.1.49', 'f4:4d:30:9c:cf:26', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:34'),
(147, 'CUSTOMERSERVICE', 'Unknown', NULL, 'WORKGROUP', '192.168.0.235', 'b8:ae:ed:ff:c0:26', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:34'),
(148, 'PRT7', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.136', '84:a9:3e:6c:83:82', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 07:19:34'),
(149, 'CWH_DGRELEASE7', 'Unknown', NULL, 'WORKGROUP', '192.168.2.28', 'f4:b5:20:4c:36:cc', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:34'),
(150, 'CWH_RECEIVE6', 'Unknown', NULL, 'WORKGROUP', '192.168.2.48', 'ec:a8:6b:f5:f3:be', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'offline', '2026-06-07 09:16:31', '2026-06-07 07:19:34'),
(151, 'CWHDGRELEASE10', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.20', '18:60:24:89:a7:7e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 07:19:34'),
(152, 'AUDITING7', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.40', 'd8:5e:d3:c6:8e:84', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:34'),
(154, 'SMRECIEVE5', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.100', '18:60:24:89:a7:bd', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:34'),
(155, 'DSPURCHASE11', 'Unknown', NULL, 'WORKGROUP', '192.168.10.52', '74:d4:35:bf:45:89', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:34'),
(156, 'EDPDGRECEIVE', 'Unknown', NULL, 'DEPTSTORE', '192.168.2.24', '1c:1b:0d:1d:a1:34', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:34'),
(157, 'SM2', 'Unknown', NULL, 'WORKGROUP', '192.168.2.200', '4c:cc:6a:6d:21:28', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:34'),
(158, 'AUDITING11', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.44', 'd8:5e:d3:c6:8e:89', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:34'),
(159, 'AUDITING10', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.43', 'd8:5e:d3:c6:73:ca', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "135": "RPC", "445": "SMB"}', 'Windows Workstation', 'offline', NULL, '2026-06-07 07:19:34'),
(161, 'CWH_DGRECEIVE', 'Unknown', NULL, 'CWAREHOUSE', '192.168.10.60', 'b4:2e:99:6d:4a:ac', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:34'),
(162, 'CWH_RECEIVE3', 'Unknown', NULL, 'LEE PLAZA', '192.168.2.12', 'f4:b5:20:55:c6:a1', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "135": "RPC", "445": "SMB"}', 'Windows Workstation', 'offline', NULL, '2026-06-07 07:19:34'),
(163, 'DSRELEASE5', 'Unknown', NULL, 'WORKGROUP', '192.168.10.149', 'e0:69:95:eb:7a:3c', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 07:19:34'),
(164, 'PRSM18', 'Unknown', NULL, 'SUPERMARKET', '192.168.10.179', 'd8:bb:c1:29:14:aa', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:58', '2026-06-07 07:19:35'),
(165, 'PRSM16', 'Unknown', NULL, 'SUPERMARKET', '192.168.10.177', '2c:f0:5d:c8:af:f3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:58', '2026-06-07 07:19:35');

INSERT INTO `computer_monitoring` (`id`, `computer_name`, `user_name`, `location`, `department`, `ip_address`, `mac_address`, `mac_vendor`, `os`, `os_version`, `bit`, `ram`, `storage`, `processor`, `antivirus`, `ms_license_type`, `license_activation`, `license_duration`, `license_expiry`, `open_ports`, `services`, `host_type`, `status`, `last_checked`, `created_at`) VALUES
(166, 'VANSKIE30', 'Unknown', NULL, 'WORKGROUP', '192.168.10.248', 'a8:a1:59:3f:6a:52', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:58', '2026-06-07 07:19:41'),
(167, 'SMPO1', 'Unknown', NULL, 'SUPERMARKET', '192.168.10.185', '18:c0:4d:72:b7:e8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:58', '2026-06-07 07:19:41'),
(168, 'LSP_CCTV', 'Unknown', NULL, 'WORKGROUP', '192.168.10.200', 'b8:ae:ed:ff:bf:62', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:58', '2026-06-07 07:19:41'),
(169, 'DESKTOP-KG86156', 'Unknown', NULL, 'WORKGROUP', '192.168.10.236', '40:8d:5c:d5:8b:41', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:58', '2026-06-07 07:19:42'),
(170, 'PC-192-168-0-16', 'Unknown', NULL, '', '192.168.0.16', '00:15:5d:00:07:06', '', 'Linux', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '22,80', '{"80": "Web Server", "22": "SSH"}', 'Linux/Unix', 'online', '2026-06-07 09:36:04', '2026-06-07 07:19:48'),
(171, 'PC-192-168-1-16', 'Unknown', NULL, '', '192.168.1.16', '00:15:5d:00:07:06', '', 'Linux', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '22,80', '{"22": "SSH", "80": "Web Server"}', 'Linux/Unix', 'online', '2026-06-07 09:36:05', '2026-06-07 07:19:48'),
(172, 'PC-192-168-0-2', 'Unknown', NULL, '', '192.168.0.2', '38:0e:4d:34:3c:53', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80,443,23', '{"80": "Web Server", "443": "HTTPS"}', 'Web Server', 'online', '2026-06-07 09:36:06', '2026-06-07 07:19:50'),
(173, 'Sonic Wall', 'Server-1', 'EDP Server', 'EDP', '192.168.0.1', '18:c2:41:7c:38:47', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', 'Trellix', 'N/A (non-Windows)', '1899-11-29 15:54:17', '', '1899-11-29 15:54:17', '80,443', '{"80": "Web Server", "443": "HTTPS"}', 'Web Server', 'online', '2026-06-07 09:36:07', '2026-06-07 07:19:50'),
(174, 'PC-192-168-0-132', 'Unknown', NULL, '', '192.168.0.132', '00:19:17:41:10:5d', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80', '{"80": "HTTP"}', 'Web Server', 'online', '2026-06-07 09:36:07', '2026-06-07 07:19:51'),
(175, 'PC-192-168-0-168', 'Unknown', NULL, '', '192.168.0.168', '00:19:17:33:c9:db', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80', '{"80": "HTTP"}', 'Web Server', 'online', '2026-06-07 09:36:07', '2026-06-07 07:19:51'),
(176, 'DSPURCHASE1', 'Unknown', NULL, '', '192.168.0.248', '18:60:24:8a:a4:e8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:36:12', '2026-06-07 07:19:56'),
(193, 'PO1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.49', 'e0:d5:5e:7e:27:fb', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "139": "NetBIOS-SSN", "445": "SMB"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 08:33:49'),
(217, 'SMRECEIVE1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.241', 'e0:d5:5e:70:9e:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"139": "NetBIOS-SSN", "445": "SMB", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:49', '2026-06-07 08:33:49'),
(226, 'PC-192-168-0-164', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.164', '00:19:17:33:ca:00', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80', '{"80": "HTTP"}', 'Web Server', 'online', '2026-06-07 09:36:07', '2026-06-07 08:33:57'),
(229, 'PO7', 'Unknown', NULL, 'WORKGROUP', '192.168.10.55', '2c:f0:5d:8f:5c:7f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "135": "RPC", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 08:33:57'),
(252, 'SMPO8', 'Unknown', NULL, 'WORKGROUP', '192.168.0.247', 'e0:d5:5e:05:21:ac', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:50', '2026-06-07 08:33:58'),
(388, 'DSPURCHASE8', 'Unknown', NULL, 'WORKGROUP', '192.168.0.46', '18:c0:4d:9d:54:52', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 08:48:54'),
(424, 'SM_EDP', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.184', '74:d4:35:64:de:6d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"445": "SMB", "139": "NetBIOS-SSN", "135": "RPC"}', 'Windows Workstation', 'online', '2026-06-07 09:35:42', '2026-06-07 08:49:02'),
(982, 'CWH_DEPTHEAD3', 'Unknown', NULL, 'WORKGROUP', '192.168.2.33', 'f4:b5:20:4b:47:4e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{"135": "RPC", "445": "SMB", "139": "NetBIOS-SSN"}', 'Windows Workstation', 'online', '2026-06-07 09:35:51', '2026-06-07 09:16:31');

-- --------------------------------------------------------
-- Table: `departments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `departments` (7 rows)
INSERT INTO `departments` (`id`, `name`, `location`) VALUES
(1, 'EDP', 'Fifth floor'),
(2, 'HR', 'Floor 2'),
(3, 'Finance', 'Floor 2'),
(4, 'Sales', 'Floor 1'),
(5, 'Operations', 'Floor 3'),
(6, 'Marketing', 'Floor 1'),
(7, 'Executive', 'Floor 4');

-- --------------------------------------------------------
-- Table: `department_roles`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `department_roles`;
CREATE TABLE `department_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `role_value` varchar(50) NOT NULL,
  `role_description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `department_roles` (10 rows)
INSERT INTO `department_roles` (`id`, `department_name`, `role_name`, `role_value`, `role_description`, `created_at`) VALUES
(1, 'EDP', 'IT Technician', 'Technician', 'Technical Operation', '2026-04-26 03:18:24'),
(2, 'EDP', 'User', 'user', 'User Support', '2026-04-26 03:18:24'),
(3, 'EDP', 'Admin', 'admin', 'System Administrator', '2026-04-26 03:18:24'),
(4, 'HR', 'HR Manager', 'hr_manager', 'Human Resources Manager', '2026-04-26 03:18:24'),
(5, 'HR', 'HR Staff', 'hr_staff', 'Human Resources Staff', '2026-04-26 03:18:24'),
(6, 'HR', 'Recruiter', 'recruiter', 'Recruitment Specialist', '2026-04-26 03:18:24'),
(7, 'Finance', 'Finance Manager', 'finance_manager', 'Finance Manager', '2026-04-26 03:18:24'),
(8, 'Finance', 'Accountant', 'accountant', 'Accountant', '2026-04-26 03:18:24'),
(9, 'Finance', 'Auditor', 'auditor', 'Internal Auditor', '2026-04-26 03:18:24'),
(10, 'HR', 'HR Manager', 'hr_manager', 'Human Resources Manager', '2026-04-26 03:18:24');

-- --------------------------------------------------------
-- Table: `job_orders`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `job_orders`;
CREATE TABLE `job_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_order_number` varchar(30) NOT NULL,
  `date` date DEFAULT NULL,
  `company` varchar(150) DEFAULT NULL,
  `crtk_no` varchar(50) DEFAULT NULL,
  `date_needed` date DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `is_charge` tinyint(1) DEFAULT 0,
  `is_expense` tinyint(1) DEFAULT 0,
  `request_dept` varchar(100) DEFAULT NULL,
  `particulars` text DEFAULT NULL,
  `job_order_for` varchar(150) DEFAULT NULL,
  `requested_date` date DEFAULT NULL,
  `requested_name` varchar(100) DEFAULT NULL,
  `approved_name` varchar(100) DEFAULT NULL,
  `received_date` date DEFAULT NULL,
  `received_name` varchar(100) DEFAULT NULL,
  `requested_signature` longtext DEFAULT NULL,
  `approved_signature` longtext DEFAULT NULL,
  `received_signature` longtext DEFAULT NULL,
  `submitted_by` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_order_number` (`job_order_number`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `job_orders` (2 rows)
INSERT INTO `job_orders` (`id`, `job_order_number`, `date`, `company`, `crtk_no`, `date_needed`, `department`, `is_charge`, `is_expense`, `request_dept`, `particulars`, `job_order_for`, `requested_date`, `requested_name`, `approved_name`, `received_date`, `received_name`, `requested_signature`, `approved_signature`, `received_signature`, `submitted_by`, `status`, `created_at`, `updated_at`) VALUES
(1, 'JO-20260507-BMZ8', '2026-05-06 16:00:00', 'Lee Super Plaza', 'CRTL-260507-IHA', '2026-05-12 16:00:00', 'Personnel', 1, 0, 'EDP', 'Replace tonner', 'James Cauzarin', '2026-05-06 16:00:00', 'User Agent', 'Marevel Jumalon', NULL, NULL, 'data:image/png;base64,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', 'data:image/png;base64,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', NULL, 1, 'approved', '2026-05-07 08:34:19', '2026-05-07 09:46:44'),
(2, 'JO-20260508-ESDK', '2026-05-07 16:00:00', 'Lee Super Plaza', 'CRTL-260508-8VN', '2026-05-14 16:00:00', 'Personnel', 1, 0, 'Operations', 'Relocate the SMPO3 to Basement..........', 'Jonathan Lopez', '2026-05-07 16:00:00', 'User Agent', 'Marevel Jumalon', '2026-05-07 16:00:00', 'System Administrator', 'data:image/png;base64,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', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABQCAYAAABcbTqwAAAK0klEQVR4AezdSew92RQH8Ecb2pAI0hI0zUKHoC1YNBIJHSxERFhYGBcEG2IhYsNGsBA2QiQkpkUTFhZCDDEsTNESQYQECTGFkBbdZn0+3XV///q//xvq1at6dave+eeed+58z/ne76np/1797r7Kf4lAIrAVgQyQrdBkQyKwWmWAJAsSgR0IZIDsACebEoEMkORAIrADgREDZMeq2ZQIzASBDJCZbFSaOQ0CGSDT4J6rzgSBDJCZbFSaOQ0CGSDT4J6rzgSBeQbITMBNM+ePQAbI/PcwPRgRgQyQEcHNqeePQAbI/PcwPRgRgdoCpDZ7RoQ+p54DAjUR8n4B2H9Crg2ZLOXCiUAbgZoC5NYw7G4hvw75eEimRGByBGoKkKsCjSeHSC+Nj/+GCJhQmRKBaRA4dYDcO9z8fwjyXxN6Pd0SFQ8N0Ydt+kUxUyIwDQJIeMqVb2sWs+4fI/+/kBtD2un3UdCuzRlEsLg3ierFpeeHR/xcqn/h3rwTIp7SA5dRSP/IWBQx5L/V5NcDpfQVIPL6R9fZpnXD+fO5qITBrn3QDwb7RL+YLtOQCOzamCHXWZ/LjTjSI4eNpUugrPdlY+mDJEs52vKZP/wtWr4tbb/12SXm0789PvNHIoB8R05x9PD1QNm0yaUPgshv6nO0ISec4F/NWoXUfGqqLhQftbsPs0/7pPSH0VIOIhdgTJUB+lRrr6+LJGWT6fV2ZfZqQxxEUDc3Yf89G6Pl+d0UL1PFx3tcVru9YJ4yRt7c23tnSycEEK5TxxN1srH7iK9POQLv63siszstg7DsRWID5Pkiv0302da2rd6eWss6f9/WKeu7IQDMbj3r6uVxMQKwCon+KVOpuERiI3vpfzd23tDoXerbuxovtV2RK4F33ytasuIgBGoNEGTq4kjpd6/ojIihqknuAwQEjGm2ypdLph/tsNSjbs1P99FTrGeoswmd0gMBG9Zj2KhDik1dNxYRENC4rmPGdOBXMTl7ylH851FmW6iLpP2isCHzkA11fargAR+6z/izH7O+cbUAso9A63byw5ipyYCI1zXGOYOw5/qmPIUSpGxiBz2FDbNeE7Fm7UDLeL4gATIIFvlW86hZl3fWtLZ16fKkqu/C5us7tj2OLcpDzWeusxGkWpKzjpgIgQxFlydeY/kpIOBY1mTDWGv1nZdt/ezqu+JCxtnYhbhymRv8+mpT40iOxK9uykOp9llD3ppDzZ3zVILAkjf1psDYWURw0B+KsvyxgfLCmMcRGXa0ucuTqWjqlIwxlj3P7TTi8E7FzrLW4TPkiLP48wcuLZAEGWmBgpxt0daFDvp9tuno/14ESVPsrIwpa7PnCzHSvEMGijNasdMaMIhlMh2KgM06dMxc+yMJsiBjIWjR6uU9edrk3+1Rqb30o6+Our4J7sQ87KEFijWIMpHvI+Y2zhx9bcxxgQAgQ51VEij8bguSIpS6dTC0lWB4UzRu6hPVvRN7ENk6bBhCzDW0nb0d3DZwDvUJ4l27hKR35S59OpsgK/IW/d5LzYPn2GA/SJlcvo+Yq8yR+ggEgH/E8MUMffmaJ47ASFYCI3FaA+hciue+8QJDMHw0NtyZItSqBIX6c8cHHmcttRKgkHWMzfEfh8gvEEpgyFvLuvK0M4i6lDNGoMYAQWBbMpRt7iVKQCC//zgUAPLEWqVMD7WueVOmQWCwVWskAwL3dfAdMdD/AbQDwpkA8QWDevmi5dXTNWIR7mSaEoFaSYHAXXDxgjl9kZy8NQbxCeGVnT3kifpovvMeQ157u15bLcKuWmw5azsQpSYAkJ09jvr0JmmfIbyitJAJ4f3QSJnwrZyNBIp2dXRp3zT/1HX+h54NbKVTJkSgtk1AXARuQ4LcAkc9YXPp94/oKE/UeytjVF0kZDOmBJzXDel30aHCjF9HsrlC087PpJrI4iVqdsBNejsgkFsAII1gkSdsv48BG+R7Uac/skV25XfgxnhhnXKt8srGsB83OtXECCDZ5SZMU3LZ5DWcVi8vZEBwgYLYhK3lkkm/TSKAjHlK02heY0ugNNXVqo80lj2x0akmRgDppjIBeQUBKXbIIzRR5+zRxT5BYaz+xirTh34NvctaY/ZhMz/GXCPnPgABJDyg+9FdBQXyIkFZW9nE7TrlfWIuY0gh1otjkLxAieysUsGh4DIr45dq7Ck2o01k6yEwMtBEHXyLlt8mf40GYwVF6W/+Ms9non2uiQ/8mqv9i7S7kGwM59wP2PCyBmIjASlHeO3WVkdvE2P1fUB00FeeJnO7jAoXrkietqksWMmnVIDAmBti7jaRr1rzF+lVlV++yRf5TWS0G08EAu0Jl7y5o8tikocI/FuMQ0txZCqilcsiQfCiAHM9IB4edQIBafSRZ6snXNG0qMR3Dr3MR0pdCCDdWBYhN2LT61LWpbW1A0L5LWGUsdrL5VhULTLxnWOf9JFSFwIIOJZFiO3oj/BtKeu169oBwaZ3l04L1x9s/Ptho1NVhgAyjmmSILFGEWcF69Gljj6XgOB7W17TFJ7U6FSVIYCcpzLJ2cRaN/sYWOY6nQNF/g2PinfvVAEiOJCBfknFeJzSNFhY7/4+UupE4BQBggiCwxcGXXLVicRprfpALAcT2EQ2U60IjB0gCIAIgsOz/lpxOLVdr20WzANGA0StaswAyeDYvOsOFlqe7SOlbgTGCpAFBcfgG+irMR5xf3nwmXPCwREYI0AyOLZvE2y0joG7eVMGRmDojUIA9xx03nNcvll/iCJs8teCAcRc0lAB8qhwWFAggC8U5s1nALKW/GFOl1ZPWKvPYsUIDBEgAuOX4aPgkF/iFwrDvaMSXEwwBN7mSTkRAsdsmEsGR8QSGHSeOa7cuPdFFWxKkESxSamqR6BvgNjscslg8zMwtm/1G5qmxKgBYk6qT4AIDkFB9xk/J3yOtdX9mDme6SOlKgQeFNY8LeQVIW8P+XDI50O+H+KW4U+hbzuU4IJCcPiCXR4RA8E9yWuKYPa1Pf2yeRgEro9pvD7qjaH9saNPhf5GyE9Cfhtya4iDlj35c+S/HvL+kNeHPCPkgSF+wObP4b0n8q86JEBMKjjo/IJdoLcnwUmXPJBAoZ90OsrH1H6h6n74p5H/dMjbQrzh5rGhfXPhltAfC3lzyPNCrgvBZQcwXHa78Jioe2rIC0JeF/LOkJu7BojNNqEIXNKGvytAAC4QhxSbBS+4/S3WOLnMdM1eR/nw1YsCvWUTn6+OsjPBI0LfEHJTiJec+1GeH6h9KcpeQRtqfzLhvl5OQ2WzvVVkX/85tbuB5tvPwughJaa78y3yLq2+G4WU1aoLBr2O8oHvD0K8pznUsKlLgLg2s+qSzhz8Id+MDwHyuNCPH0jMFVOtYOvolbJadcWg11Ee2GOJTdw1t0sE7UhEL02eEw65bOTf7ZE/Jj06BrcvraKYae4I7AoQwYE49Nz93GW/y8bvRAfXrgguUL4S5UOSR4K/aAbAbIln28a981LbAkRQ2Gj6HDb7xtj2v4TwV6A8K/KCpas8uOkPs8guOp2Vc5sCBCnKRtPl6U55EuNI6S87LQ0ojxQdDPhM/Dk3ZwavUF0XT77a8rsAYxOWUZ1pzghs2lQB4kjqiOqxW3m6U55CfDEcJqEWnTwHvyY89Kx8XfzoqS0Pi36ZFojApgBR50jqiHpt+Fye7pQnEf4T5RNRnykRWDwCdwAAAP//jo4SpwAAAAZJREFUAwCQPeC/IjGh+AAAAABJRU5ErkJggg==', NULL, 1, 'approved', '2026-05-08 03:14:47', '2026-05-08 05:54:51');

-- --------------------------------------------------------
-- Table: `knowledge_base`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `knowledge_base`;
CREATE TABLE `knowledge_base` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(50) NOT NULL,
  `summary` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `featured` tinyint(4) DEFAULT 0,
  `author_name` varchar(100) DEFAULT NULL,
  `views` int(11) DEFAULT 0,
  `helpful_yes` int(11) DEFAULT 0,
  `helpful_no` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `knowledge_base` (3 rows)
INSERT INTO `knowledge_base` (`id`, `title`, `category`, `summary`, `content`, `featured`, `author_name`, `views`, `helpful_yes`, `helpful_no`, `created_at`, `updated_at`) VALUES
(1, 'How to Submit a Support Ticket', 'getting-started', 'Learn how to create and submit tickets for IT support.', '<h4>Step-by-Step Guide</h4><ol><li>Navigate to My Tickets</li><li>Click New Ticket</li><li>Fill in the details</li><li>Submit</li></ol>', 1, 'IT Support Team', 0, 0, 0, '2026-06-08 09:24:38', '2026-06-08 09:24:38'),
(2, 'Understanding Ticket Statuses', 'tickets', 'Learn what each ticket status means.', '<h4>Ticket Lifecycle</h4><ul><li>New - Just submitted</li><li>Assigned - Given to technician</li><li>In Progress - Being worked on</li><li>Resolved - Fixed</li></ul>', 0, 'IT Admin', 0, 0, 0, '2026-06-08 09:24:38', '2026-06-08 09:24:38'),
(3, 'Frequently Asked Questions', 'faq', 'Quick answers to common questions.', '<h4>Common Questions</h4><p><strong>Q: How do I check ticket status?</strong></p><p>A: Go to My Tickets.</p>', 0, 'IT Support Team', 0, 0, 0, '2026-06-08 09:24:38', '2026-06-08 09:24:38');

-- --------------------------------------------------------
-- Table: `new_user`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `new_user`;
CREATE TABLE `new_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `workDays` text DEFAULT NULL,
  `dayOff` text DEFAULT NULL,
  `workStart` varchar(5) DEFAULT NULL,
  `workEnd` varchar(5) DEFAULT NULL,
  `lunchStart` varchar(5) DEFAULT NULL,
  `lunchEnd` varchar(5) DEFAULT NULL,
  `leaveEntries` text DEFAULT NULL,
  `avatar_color` varchar(7) DEFAULT '#3b82f6',
  `photo_url` text DEFAULT NULL,
  `registration_key` varchar(50) DEFAULT NULL,
  `key_used_at` timestamp NULL DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `locked_until` datetime DEFAULT NULL,
  `failed_attempts` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `new_user` (2 rows)
INSERT INTO `new_user` (`id`, `username`, `password`, `fullname`, `role`, `department`, `email`, `birthdate`, `workDays`, `dayOff`, `workStart`, `workEnd`, `lunchStart`, `lunchEnd`, `leaveEntries`, `avatar_color`, `photo_url`, `registration_key`, `key_used_at`, `is_verified`, `created_at`, `locked_until`, `failed_attempts`) VALUES
(1, 'user', '$2a$10$TnLC9/e/1LNtRqqIPqjR7eKR6Vh1qHpputxIQ4IYrD5RKWOU9/A.2', 'User Agent', 'staff', 'Personnel', 'user@gmail.com', '1899-11-29 15:54:17', '["Monday","Tuesday","Wednesday","Thursday","Friday"]', '["Saturday","Sunday"]', '08:00', '17:00', '12:00', '13:00', NULL, '#e17055', '/uploads/profiles/profile-1777359299502-894214923.png', 'Leeplaza', '2026-04-26 06:47:59', 1, '2026-04-26 06:47:59', NULL, 0),
(2, 'EDPtech', '$2a$10$KO7OGx/1lDJZ5DhC421sK.fxndS1KwCTUEw0Rs1j7jTE9MBTKG2nW', 'Charlie Amihoy', 'recruiter', 'Human Resource', 'camihoy96@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#00c878', NULL, 'Leeplaza', '2026-05-05 10:12:45', 1, '2026-05-05 10:12:45', NULL, 0);

-- --------------------------------------------------------
-- Table: `notifications`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_table` varchar(50) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `is_read` tinyint(4) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table `notifications` is empty

-- --------------------------------------------------------
-- Table: `registration_keys`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `registration_keys`;
CREATE TABLE `registration_keys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key_code` varchar(50) NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_code` (`key_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `registration_keys` (1 rows)
INSERT INTO `registration_keys` (`id`, `key_code`, `used`, `created_at`) VALUES
(2, 'Leeplaza', 1, '2026-05-05 07:15:07');

-- --------------------------------------------------------
-- Table: `requisitions`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `requisitions`;
CREATE TABLE `requisitions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `requisition_number` varchar(30) NOT NULL,
  `ctrl_no` varchar(20) DEFAULT NULL,
  `request_from` varchar(100) DEFAULT NULL,
  `attn` varchar(100) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `prepared_name` varchar(100) DEFAULT NULL,
  `prepared_signature` longtext DEFAULT NULL,
  `prepared_date` date DEFAULT NULL,
  `approved_name` varchar(100) DEFAULT NULL,
  `approved_signature` longtext DEFAULT NULL,
  `approved_date` date DEFAULT NULL,
  `items_prepared_name` varchar(100) DEFAULT NULL,
  `items_prepared_signature` longtext DEFAULT NULL,
  `items_prepared_date` date DEFAULT NULL,
  `returned_name` varchar(100) DEFAULT NULL,
  `returned_signature` longtext DEFAULT NULL,
  `returned_date` date DEFAULT NULL,
  `submitted_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `requisition_number` (`requisition_number`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `requisitions` (1 rows)
INSERT INTO `requisitions` (`id`, `requisition_number`, `ctrl_no`, `request_from`, `attn`, `date`, `remarks`, `status`, `prepared_name`, `prepared_signature`, `prepared_date`, `approved_name`, `approved_signature`, `approved_date`, `items_prepared_name`, `items_prepared_signature`, `items_prepared_date`, `returned_name`, `returned_signature`, `returned_date`, `submitted_by`, `created_at`, `updated_at`) VALUES
(3, 'REQ-20260508-HAF', NULL, 'Personnel', 'User Agent', '2026-05-07 16:00:00', 'Defect UPS at SM_EDP', 'pending', 'User Agent', 'data:image/png;base64,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', '2026-05-07 16:00:00', 'Marevel Jumalon', 'data:image/png;base64,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', '2026-05-07 16:00:00', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-08 09:29:41', '2026-05-08 09:29:41');

-- --------------------------------------------------------
-- Table: `requisition_items`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `requisition_items`;
CREATE TABLE `requisition_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `requisition_id` int(11) DEFAULT NULL,
  `qty` int(5) DEFAULT NULL,
  `item` varchar(150) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `requisition_id` (`requisition_id`),
  CONSTRAINT `requisition_items_ibfk_1` FOREIGN KEY (`requisition_id`) REFERENCES `requisitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `requisition_items` (1 rows)
INSERT INTO `requisition_items` (`id`, `requisition_id`, `qty`, `item`, `unit_price`) VALUES
(3, 3, 1, 'UPS', '1200.00');

-- --------------------------------------------------------
-- Table: `system_logs`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `system_logs`;
CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_username` (`username`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table `system_logs` is empty

-- --------------------------------------------------------
-- Table: `system_settings`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `settings_key` varchar(100) NOT NULL,
  `settings_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key` (`settings_key`),
  KEY `idx_settings_key` (`settings_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table `system_settings` is empty

-- --------------------------------------------------------
-- Table: `tickets`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `tickets`;
CREATE TABLE `tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(50) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('low','medium','high','critical') DEFAULT 'medium',
  `status` enum('new','assigned','in_progress','pending','resolved','closed') DEFAULT 'new',
  `location` varchar(255) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_by_name` varchar(100) DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `is_major_incident` tinyint(1) DEFAULT 0,
  `reported_via` varchar(50) DEFAULT 'web',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `tickets_ibfk_1` (`department_id`),
  KEY `tickets_ibfk_2` (`created_by`),
  KEY `tickets_ibfk_3` (`assigned_to`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `tickets` (4 rows)
INSERT INTO `tickets` (`id`, `ticket_number`, `title`, `description`, `priority`, `status`, `location`, `department_id`, `created_by`, `created_by_name`, `assigned_to`, `is_major_incident`, `reported_via`, `created_at`, `updated_at`, `resolved_at`) VALUES
(10, 'MK-20260427-IWSGRZ', 'No internet Connection', 'This is the problem<div><br></div><div><img src="data:image/jpeg;base64,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" alt="image-20260417-064616.png" style="max-width: 300px; border: 1px solid rgb(204, 204, 204); margin-top: 6px; margin-bottom: 6px; display: block;"><div class="file-reference">📎 image-20260417-064616.png (290.2 KB)</div></div>', 'high', 'resolved', 'Auditing 4', 6, 1, 'User Agent', 11, 0, 'web', '2026-04-27 09:52:38', '2026-04-28 09:43:51', '2026-04-28 09:43:51'),
(11, 'HR-20260429-8PYMSL', 'dfdfdgd', 'egrfgfdg', 'medium', 'resolved', 'Worklynx', 2, 11, 'Charlie Amihoy', 12, 0, 'web', '2026-04-29 03:58:54', '2026-05-01 05:51:00', '2026-05-01 05:51:00'),
(12, 'OP-20260429-03G7I4', ' effgfg', 'fddd', 'medium', 'resolved', 'section head', 5, 1, 'User Agent', 11, 0, 'web', '2026-04-29 05:13:09', '2026-04-29 06:38:10', '2026-04-29 06:38:10'),
(16, 'OP-20260501-IGI0JY', 'Back up repeatedly beeping', '<img src="data:image/jpeg;base64,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" alt="Gemini_Generated_Image_a8svhsa8svhsa8sv.png" style="max-width:300px;border:1px solid #ccc;margin:6px 0;display:block;"><div class="file-reference">📎 Gemini_Generated_Image_a8svhsa8svhsa8sv.png (886.2 KB)</div>', 'medium', 'assigned', 'PO2', 5, 1, 'User Agent', 12, 0, 'web', '2026-05-01 09:08:40', '2026-05-01 10:01:56', NULL);

-- --------------------------------------------------------
-- Table: `ticket_attachments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `ticket_attachments`;
CREATE TABLE `ticket_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  CONSTRAINT `ticket_attachments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `ticket_attachments` (3 rows)
INSERT INTO `ticket_attachments` (`id`, `ticket_id`, `filename`, `original_name`, `file_path`, `file_type`, `file_size`, `uploaded_by`, `created_at`) VALUES
(10, 10, '1777283559174-25094963.png', 'image-20260417-064616.png', '/uploads/tickets/1777283559174-25094963.png', 'image/png', 297124, 1, '2026-04-27 09:52:39'),
(11, 12, '1777439590137-559858167.jpeg', '8468b4c9-72b3-4f4d-b5ac-2e07d3d9de79.jpeg', '/uploads/tickets/1777439590137-559858167.jpeg', 'image/jpeg', 300962, 1, '2026-04-29 05:13:10'),
(15, 16, '1777626521136-582909302.png', 'Gemini_Generated_Image_a8svhsa8svhsa8sv.png', '/uploads/tickets/1777626521136-582909302.png', 'image/png', 907509, 1, '2026-05-01 09:08:41');

-- --------------------------------------------------------
-- Table: `ticket_comments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `ticket_comments`;
CREATE TABLE `ticket_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_table` varchar(10) DEFAULT 'users',
  `comment` text DEFAULT NULL,
  `is_internal` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ticket_comments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `ticket_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `ticket_comments` (11 rows)
INSERT INTO `ticket_comments` (`id`, `ticket_id`, `user_id`, `user_table`, `comment`, `is_internal`, `created_at`) VALUES
(1, 10, 1, 'users', 'Fixed', 0, '2026-04-28 02:16:33'),
(3, 10, 1, 'users', 'gffgfg', 0, '2026-04-29 05:55:22'),
(4, 10, 1, 'users', 'nice', 0, '2026-04-29 05:55:40'),
(5, 12, 11, 'users', 'nice', 0, '2026-04-29 06:37:20'),
(6, 12, 11, 'users', '@System Administrator 
it should be great', 0, '2026-04-29 06:37:53'),
(9, 12, 1, 'users', 'Great', 0, '2026-04-29 07:07:59'),
(10, 12, 1, 'users', '@System Administrator thanks', 0, '2026-04-29 07:30:56'),
(11, 12, 1, 'users', '@System Administrator thanks', 0, '2026-04-29 07:33:12'),
(13, 12, 1, 'users', 'goods', 0, '2026-04-29 07:51:37'),
(14, 12, 1, 'new_user', '@System Administrator thanks', 0, '2026-04-29 07:51:54'),
(15, 12, 1, 'new_user', '@Charlie Amihoy thanks ', 0, '2026-04-29 07:56:24');

-- --------------------------------------------------------
-- Table: `users`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `role` enum('admin','user','Technician') DEFAULT 'user',
  `department` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `workDays` text DEFAULT NULL,
  `dayOff` text DEFAULT NULL,
  `workStart` varchar(5) DEFAULT NULL,
  `workEnd` varchar(5) DEFAULT NULL,
  `lunchStart` varchar(5) DEFAULT NULL,
  `lunchEnd` varchar(5) DEFAULT NULL,
  `leaveEntries` text DEFAULT NULL,
  `avatar_color` varchar(7) DEFAULT '#3b82f6',
  `photo_url` text DEFAULT NULL,
  `registration_key` varchar(50) DEFAULT NULL,
  `key_used_at` timestamp NULL DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `locked_until` datetime DEFAULT NULL,
  `failed_attempts` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `users` (4 rows)
INSERT INTO `users` (`id`, `username`, `password`, `fullname`, `role`, `department`, `email`, `birthdate`, `workDays`, `dayOff`, `workStart`, `workEnd`, `lunchStart`, `lunchEnd`, `leaveEntries`, `avatar_color`, `photo_url`, `registration_key`, `key_used_at`, `is_verified`, `created_at`, `locked_until`, `failed_attempts`) VALUES
(1, 'EDPtech', '$2a$10$BllYyx9WehP5ZTozs/X8guf8vgwWrUTPZVZ856alPInpuP.O8sZdC', 'System Administrator', 'admin', 'IT Department', 'admin@edptech.com', '2026-02-07 16:00:00', '["Monday","Tuesday","Wednesday","Thursday","Friday","Sunday"]', '["Saturday"]', '08:00', '19:00', '12:00', '13:00', NULL, '#ef4444', '/uploads/profiles/profile-1777357959878-350084720.png', NULL, NULL, 0, '2026-04-12 02:08:30', NULL, 0),
(3, 'jsmith', '$2y$10$WA3UhYRpfoZ98uUcizB6bee3KkhWzucsiuiuknA7tle32tfU9UYYi', 'John Smith', 'user', 'Human Resources', 'jsmith@edptech.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#10b981', NULL, NULL, NULL, 0, '2026-04-12 02:08:30', NULL, 0),
(11, 'camihoy96', '$2a$10$ViKJPMqHQNY5hVfI1itq4OXLW1Cy95c/NLajEqSdgmRYCZM09UGAe', 'Charlie Amihoy', 'Technician', 'EDP', 'camihoy96@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#ffd93d', NULL, 'Leeplaza', '2026-04-26 03:51:27', 1, '2026-04-26 03:51:27', NULL, 0),
(12, 'kyle', '$2a$10$IhQHj9pKb7YY3Xn4Xmnb9OrMDYZjT2laIMsqNf1NAtiNiNudKaLy.', 'Kyle Kuzma', 'Technician', 'EDP', 'kyle1@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#e17055', NULL, 'Leeplaza', '2026-04-29 06:25:52', 1, '2026-04-29 06:25:52', NULL, 0);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- ============================================
-- Export completed successfully
-- ============================================
