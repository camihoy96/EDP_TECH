-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Jun 11, 2026 at 11:59 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `edptech_helpdesk`
--

-- --------------------------------------------------------

--
-- Table structure for table `assets`
--

CREATE TABLE `assets` (
  `id` int(11) NOT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
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
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `computer_monitoring`
--

CREATE TABLE `computer_monitoring` (
  `id` int(11) NOT NULL,
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `computer_monitoring`
--

INSERT INTO `computer_monitoring` (`id`, `computer_name`, `user_name`, `location`, `department`, `ip_address`, `mac_address`, `mac_vendor`, `os`, `os_version`, `bit`, `ram`, `storage`, `processor`, `antivirus`, `ms_license_type`, `license_activation`, `license_duration`, `license_expiry`, `open_ports`, `services`, `host_type`, `status`, `last_checked`, `created_at`) VALUES
(30, 'PC-192-168-10-4', 'Unknown', NULL, '', '192.168.10.4', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', NULL, '2026-06-04 09:53:57'),
(31, 'PC-192-168-10-7', 'Unknown', NULL, '', '192.168.10.7', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 13:16:11', '2026-06-04 09:54:11'),
(32, 'EDPTECHUSER1', 'Unknown', NULL, '', '192.168.10.35', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 13:16:11', '2026-06-04 09:54:11'),
(33, 'PC-192-168-10-40', 'Unknown', NULL, '', '192.168.10.40', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 13:16:28', '2026-06-04 09:54:27'),
(34, 'CLP_SERVER', 'Unknown', NULL, '', '192.168.10.105', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 13:16:28', '2026-06-04 09:54:27'),
(35, 'SAOSVRLPC', 'Unknown', NULL, '', '192.168.10.106', 'b4:45:06:f8:1f:8e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389,80', '{\"80\": \"HTTP\", \"3389\": \"RDP\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:56', '2026-06-04 09:54:28'),
(36, 'PRSM6', 'Unknown', NULL, '', '192.168.10.167', '00:19:17:33:c7:e2', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:29', '2026-06-04 09:54:28'),
(37, 'EDTECH20', 'Unknown', NULL, '', '192.168.10.250', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 13:16:37', '2026-06-04 09:54:35'),
(38, 'LPSALESDEPT', 'Unknown', NULL, '', '192.168.10.251', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 13:16:40', '2026-06-04 09:54:37'),
(39, 'LP_C2BACKUP', 'LP_C2BACKUP', NULL, '', '192.168.10.252', '90:09:d0:4b:53:b2', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '139,445,80,443', '{\"80\": \"Web Server\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"443\": \"HTTPS\"}', 'Web Server', 'online', '2026-06-11 11:11:58', '2026-06-04 09:54:40'),
(73, 'LEESM', 'Unknown', NULL, 'WORKGROUP', '192.168.0.108', '80:30:e0:3c:d3:c1', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80,443', '{\"80\": \"HTTP\", \"135\": \"RPC\", \"443\": \"HTTPS\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:23'),
(74, 'SAOSVRLPC', 'Unknown', NULL, 'WORKGROUP', '192.168.0.36', 'b4:45:06:f8:1f:8e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389,80', '{\"3389\": \"RDP\", \"445\": \"SMB\", \"135\": \"RPC\", \"80\": \"HTTP\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:23'),
(75, 'LEESM', 'Unknown', NULL, 'WORKGROUP', '192.168.0.11', '80:30:e0:3c:d3:c0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80,443', '{\"80\": \"HTTP\", \"443\": \"HTTPS\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:10', '2026-06-07 07:19:23'),
(76, 'LSPMAIN', 'LSPMAIN', NULL, 'WORKGROUP', '192.168.1.253', '00:11:32:ea:34:5b', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '139,445,80,443', '{\"80\": \"Web Server\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"443\": \"HTTPS\"}', 'Web Server', 'online', '2026-06-11 11:11:38', '2026-06-07 07:19:24'),
(77, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.0.7', '80:30:e0:3c:e3:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 07:19:24'),
(78, 'PRSM12', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.173', '00:19:17:b9:9a:d3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 07:19:24'),
(79, 'PAYDBS', 'Unknown', NULL, 'WORKGROUP', '192.168.0.4', 'dc:fe:07:1a:4c:81', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:24'),
(80, 'PRSM13', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.174', '00:19:17:b9:9a:b8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 07:19:24'),
(81, 'PRSM9', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.170', '00:19:17:33:c9:11', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 07:19:24'),
(82, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.0.112', '80:30:e0:3c:e3:13', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:24'),
(83, 'Supermarket', 'Unknown', NULL, '', '192.168.0.12', '80:30:e0:3b:f4:d8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,443', '{\"445\": \"SMB\", \"443\": \"HTTPS\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:12:00', '2026-06-07 07:19:24'),
(84, 'PRSM5', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.166', '00:19:17:33:c9:88', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 07:19:24'),
(85, 'SSLPH6', 'Unknown', NULL, 'WORKGROUP', '192.168.1.68', '00:19:17:b9:99:f0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:24'),
(86, 'PRSM11', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.172', '00:19:17:33:c9:fd', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:24'),
(87, 'PRS6', 'Unknown', NULL, 'WORKGROUP', '192.168.0.120', '00:19:17:33:ca:2d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:24'),
(88, 'SSLPH13', 'Unknown', NULL, 'WORKGROUP', '192.168.1.72', '00:19:17:33:c9:3a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:24'),
(89, 'PRS2', 'Unknown', NULL, 'WORKGROUP', '192.168.0.116', '00:19:17:b9:9a:1d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:24'),
(90, 'PRF2', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.144', '00:19:17:33:c9:aa', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-07 17:35:41', '2026-06-07 07:19:24'),
(91, 'PRSM10', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.171', '00:19:17:b9:9a:73', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 07:19:24'),
(93, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.10.104', '80:30:e0:3c:e3:11', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:29', '2026-06-07 07:19:24'),
(94, 'PRSM14', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.176', '00:19:17:41:10:41', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:24'),
(95, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.10.100', '80:30:e0:3c:e3:12', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:29', '2026-06-07 07:19:24'),
(96, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.0.109', '80:30:e0:3c:e3:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 07:19:24'),
(97, 'EDPDGRECEIVE2', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.72', '7c:05:07:0e:0c:59', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(98, 'DSRECEIVE3', 'Unknown', NULL, 'WORKGROUP', '192.168.0.84', 'ec:a8:6b:f6:26:e6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(99, 'DSPURCHASE10', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.48', 'd8:5e:d3:4e:7a:b5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(100, 'OS1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.100', '18:60:24:8a:a5:56', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(101, 'AUDITING1', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.92', 'fc:aa:14:84:4d:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:25'),
(102, 'EDP1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.76', 'e8:9c:25:23:88:88', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(103, 'AUDITING5', 'Unknown', NULL, 'WORKGROUP', '192.168.0.96', '38:60:77:25:4e:c5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(104, 'EDPRR', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.79', 'ec:a8:6b:f5:ad:c5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(105, 'CONCESSION1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.32', 'd8:43:ae:93:e5:a8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(106, 'DSPURCHASE6', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.44', '2c:f0:5d:8f:5c:7d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(107, 'PO8', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.56', 'fc:aa:14:84:4d:e2', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(108, 'SMPO2', 'Unknown', NULL, 'WORKGROUP', '192.168.0.186', '18:c0:4d:4f:49:4d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(109, 'PO4', 'Unknown', NULL, 'WORKGROUP', '192.168.0.58', '7c:05:07:0f:d5:70', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 07:19:25'),
(110, 'FINANCE3', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.200', 'd8:5e:d3:c6:8e:8d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(111, 'SMPRETURN', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.196', 'b8:ae:ed:ff:65:03', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(112, 'PRFF3', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.152', 'c8:d9:d2:2a:f5:58', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(113, 'SMPURCHASE', 'Unknown', NULL, 'WORKGROUP', '192.168.0.191', '7c:05:07:11:34:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(114, 'SMRECEIVE', 'Unknown', NULL, 'WORKGROUP', '192.168.0.194', '1c:1b:0d:1e:10:c5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:25'),
(115, 'PRSM20', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.181', 'd8:bb:c1:29:16:01', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 07:19:25'),
(116, 'SMPO6', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.190', '84:a9:3e:6c:84:1b', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:20', '2026-06-07 07:19:25'),
(117, 'PO3', 'Unknown', NULL, 'WORKGROUP', '192.168.0.51', '74:d4:35:bf:46:87', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(118, 'PRSM19', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.180', 'd8:bb:c1:29:16:68', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:25'),
(119, 'SMRECEIVE2', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.198', 'e0:d5:5e:70:9e:9a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:20', '2026-06-07 07:19:25'),
(120, 'SMPO4', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.188', '4c:cc:6a:8f:b8:24', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:25'),
(121, 'PRSM17', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.178', 'd8:bb:c1:29:15:9b', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:20', '2026-06-07 07:19:25'),
(122, 'SMPO3', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.187', '4c:cc:6a:8f:b7:b3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:20', '2026-06-07 07:19:25'),
(123, 'LHMBO', 'Unknown', NULL, 'WORKGROUP', '192.168.1.48', 'b8:ae:ed:ff:c0:32', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:32'),
(124, 'LHMEDP', 'Unknown', NULL, 'WORKGROUP', '192.168.1.33', 'b4:2e:99:dd:03:a8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', NULL, '2026-06-07 07:19:32'),
(125, 'PRS9', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.124', '84:a9:3e:6c:83:75', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:32'),
(126, 'OFFTAKE1', 'Unknown', NULL, 'WORKGROUP', '192.168.1.36', 'b4:2e:99:dd:03:a3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:33'),
(127, 'LHMAUDITING', 'Unknown', NULL, 'WORKGROUP', '192.168.1.52', 'f4:b5:20:44:9e:79', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:33'),
(128, 'LHMRECEIVING2', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.44', 'f4:b5:20:40:9c:76', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:57', '2026-06-07 07:19:33'),
(129, 'PRF6', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.148', '84:a9:3e:6c:84:0e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:33'),
(130, 'LPHFINANCE', 'Unknown', NULL, 'WORKGROUP', '192.168.1.32', '10:78:d2:84:3f:ad', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:33'),
(131, 'CWH_SMRELEASE', 'Unknown', NULL, 'WORKGROUP', '192.168.2.4', 'b4:2e:99:dc:7c:63', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:33'),
(132, 'PERSONNEL10', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.220', 'f4:b5:20:78:33:d8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:57', '2026-06-07 07:19:33'),
(133, 'OSFSNB', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.232', 'c8:5b:76:71:d7:9c', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:33'),
(134, 'CWH_DGRELEASE4', 'Unknown', NULL, 'CWAREHOUSE', '192.168.2.16', 'b4:2e:99:52:19:1e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:33'),
(135, 'CWH_RECEIVE', 'Unknown', NULL, 'WORKGROUP', '192.168.2.3', '4c:cc:6a:6d:21:26', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 07:19:34'),
(136, 'LSPCORP', 'Unknown', NULL, 'WORKGROUP', '192.168.1.248', 'b8:ae:ed:ff:bf:36', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 07:19:34'),
(137, 'POS03-', 'Unknown', NULL, 'WORKGROUP', '192.168.1.60', 'fc:aa:14:84:4d:e6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:34'),
(138, 'HR2', 'Unknown', NULL, 'WORKGROUP', '192.168.1.202', 'b8:ae:ed:ff:e2:f0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 07:19:34'),
(139, 'LPHAUDITING4', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.64', '10:e7:c6:2e:88:ef', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:34'),
(140, 'LHMDGPROMOTION', 'Unknown', NULL, 'WORKGROUP', '192.168.1.34', 'e0:69:95:eb:7a:aa', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:34'),
(141, 'LHMEDP1', 'Unknown', NULL, 'WORKGROUP', '192.168.1.232', 'f4:b5:20:75:3e:17', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:34'),
(142, 'SMRECEIVE4', 'Unknown', NULL, 'WORKGROUP', '192.168.0.244', 'ec:a8:6b:71:09:0e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 07:19:34'),
(143, 'SSLPH19', 'Unknown', NULL, 'WORKGROUP', '192.168.1.92', '2c:f0:5d:c8:af:f6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-07 17:35:50', '2026-06-07 07:19:34'),
(144, 'OFFTAKE2', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.37', 'f4:b5:20:44:9e:22', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-07 17:26:20', '2026-06-07 07:19:34'),
(145, 'LHMAUDITING1', 'Unknown', NULL, 'WORKGROUP', '192.168.1.40', '2c:f0:5d:8f:5b:ae', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-07 07:19:34'),
(146, 'LHMTIMEKEEPER', 'Unknown', NULL, 'WORKGROUP', '192.168.1.49', 'f4:4d:30:9c:cf:26', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:34'),
(147, 'CUSTOMERSERVICE', 'Unknown', NULL, 'WORKGROUP', '192.168.0.235', 'b8:ae:ed:ff:c0:26', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:34'),
(148, 'PRT7', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.136', '84:a9:3e:6c:83:82', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 07:19:34'),
(149, 'CWH_DGRELEASE7', 'Unknown', NULL, 'WORKGROUP', '192.168.2.28', 'f4:b5:20:4c:36:cc', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 07:19:34'),
(150, 'CWH_RECEIVE6', 'Unknown', NULL, 'WORKGROUP', '192.168.2.48', 'ec:a8:6b:f5:f3:be', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 07:19:34'),
(151, 'CWHDGRELEASE10', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.20', '18:60:24:89:a7:7e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 07:19:34'),
(152, 'AUDITING7', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.40', 'd8:5e:d3:c6:8e:84', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 07:19:34'),
(154, 'SMRECIEVE5', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.100', '18:60:24:89:a7:bd', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 07:19:34'),
(155, 'DSPURCHASE11', 'Unknown', NULL, 'WORKGROUP', '192.168.10.52', '74:d4:35:bf:45:89', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:37', '2026-06-07 07:19:34'),
(156, 'EDPDGRECEIVE', 'Unknown', NULL, 'DEPTSTORE', '192.168.2.24', '1c:1b:0d:1d:a1:34', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:34'),
(157, 'SM2', 'Unknown', NULL, 'WORKGROUP', '192.168.2.200', '4c:cc:6a:6d:21:28', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-07 07:19:34'),
(158, 'AUDITING11', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.44', 'd8:5e:d3:c6:8e:89', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 07:19:34'),
(159, 'AUDITING10', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.43', 'd8:5e:d3:c6:73:ca', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-07 07:19:34'),
(161, 'CWH_DGRECEIVE', 'Unknown', NULL, 'CWAREHOUSE', '192.168.10.60', 'b4:2e:99:6d:4a:ac', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 07:19:34'),
(162, 'CWH_RECEIVE3', 'Unknown', NULL, 'LEE PLAZA', '192.168.2.12', 'f4:b5:20:55:c6:a1', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-07 07:19:34'),
(163, 'DSRELEASE5', 'Unknown', NULL, 'WORKGROUP', '192.168.10.149', 'e0:69:95:eb:7a:3c', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:39', '2026-06-07 07:19:34'),
(164, 'PRSM18', 'Unknown', NULL, 'SUPERMARKET', '192.168.10.179', 'd8:bb:c1:29:14:aa', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-07 07:19:35'),
(165, 'PRSM16', 'Unknown', NULL, 'SUPERMARKET', '192.168.10.177', '2c:f0:5d:c8:af:f3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-07 07:19:35'),
(166, 'VANSKIE30', 'Unknown', NULL, 'WORKGROUP', '192.168.10.248', 'a8:a1:59:3f:6a:52', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 07:19:41'),
(167, 'SMPO1', 'Unknown', NULL, 'SUPERMARKET', '192.168.10.185', '18:c0:4d:72:b7:e8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:39', '2026-06-07 07:19:41'),
(168, 'LSP_CCTV', 'Unknown', NULL, 'WORKGROUP', '192.168.10.200', 'b8:ae:ed:ff:bf:62', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 07:19:41'),
(169, 'DESKTOP-KG86156', 'Unknown', NULL, 'WORKGROUP', '192.168.10.236', '40:8d:5c:d5:8b:41', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-07 17:35:58', '2026-06-07 07:19:42'),
(170, 'PC-192-168-0-16', 'Unknown', NULL, '', '192.168.0.16', '00:15:5d:00:07:06', '', 'Linux', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '22,80', '{\"80\": \"Web Server\", \"22\": \"SSH\"}', 'Linux/Unix', 'online', '2026-06-11 11:12:12', '2026-06-07 07:19:48'),
(171, 'PC-192-168-1-16', 'Unknown', NULL, '', '192.168.1.16', '00:15:5d:00:07:06', '', 'Linux', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '22,80', '{\"80\": \"Web Server\", \"22\": \"SSH\"}', 'Linux/Unix', 'online', '2026-06-11 11:12:12', '2026-06-07 07:19:48'),
(172, 'PC-192-168-0-2', 'Unknown', NULL, '', '192.168.0.2', '38:0e:4d:34:3c:53', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80,443,23', '{\"80\": \"Web Server\", \"443\": \"HTTPS\"}', 'Web Server', 'online', '2026-06-11 11:12:14', '2026-06-07 07:19:50'),
(173, 'PC-192-168-0-1', 'Unknown', 'EDP Server', 'EDP', '192.168.0.1', '18:c2:41:7c:38:47', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', 'Trellix', 'N/A (non-Windows)', '0000-00-00', '', '0000-00-00', '80,443', '{\"80\": \"Web Server\", \"443\": \"HTTPS\"}', 'Web Server', 'online', '2026-06-11 11:12:14', '2026-06-07 07:19:50'),
(174, 'PC-192-168-0-132', 'Unknown', NULL, '', '192.168.0.132', '00:19:17:41:10:5d', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80', '{\"80\": \"HTTP\"}', 'Web Server', 'online', '2026-06-11 11:12:15', '2026-06-07 07:19:51'),
(175, 'PC-192-168-0-168', 'Unknown', NULL, '', '192.168.0.168', '00:19:17:33:c9:db', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80', '{\"80\": \"HTTP\"}', 'Web Server', 'online', '2026-06-11 11:12:15', '2026-06-07 07:19:51'),
(176, 'DSPURCHASE1', 'Unknown', NULL, '', '192.168.0.248', '18:60:24:8a:a4:e8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:12:32', '2026-06-07 07:19:56'),
(193, 'PO1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.49', 'e0:d5:5e:7e:27:fb', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-07 17:35:42', '2026-06-07 08:33:49'),
(217, 'SMRECEIVE1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.241', 'e0:d5:5e:70:9e:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-07 08:33:49'),
(226, 'PC-192-168-0-164', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.164', '00:19:17:33:ca:00', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80', '{\"80\": \"HTTP\"}', 'Web Server', 'online', '2026-06-11 11:12:15', '2026-06-07 08:33:57'),
(229, 'PO7', 'Unknown', NULL, 'WORKGROUP', '192.168.10.55', '2c:f0:5d:8f:5c:7f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-07 08:33:57'),
(252, 'SMPO8', 'Unknown', NULL, 'WORKGROUP', '192.168.0.247', 'e0:d5:5e:05:21:ac', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-07 17:35:50', '2026-06-07 08:33:58'),
(388, 'DSPURCHASE8', 'Unknown', NULL, 'WORKGROUP', '192.168.0.46', '18:c0:4d:9d:54:52', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 08:48:54'),
(424, 'SM_EDP', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.184', '74:d4:35:64:de:6d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-07 08:49:02'),
(982, 'CWH_DEPTHEAD3', 'Unknown', NULL, 'WORKGROUP', '192.168.2.33', 'f4:b5:20:4b:47:4e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-07 09:16:31'),
(1548, 'BOOK_KEEP3', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.70', 'f4:4d:30:90:9d:34', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-10 01:15:39'),
(1552, 'LPHEDPTECH01', 'Unknown', NULL, '', '192.168.10.15', 'c8:d9:d2:2a:f5:41', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:29', '2026-06-10 01:15:40'),
(1554, 'HR4', 'Unknown', NULL, 'HR & PERSONNEL', '192.168.1.204', 'f4:4d:30:0b:6a:b7', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-10 01:15:40'),
(1561, 'ACCTG12', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.68', 'd8:43:ae:93:e5:b2', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-10 01:15:40'),
(1569, 'CWH_DEPTHEAD1', 'Unknown', NULL, 'C_WAREHOUSE', '192.168.2.26', 'f4:b5:20:40:9c:7e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-10 01:15:40'),
(1570, 'EDP_EL', 'Unknown', NULL, 'WORKGROUP', '192.168.0.127', 'f4:4d:30:9c:a7:49', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:20', '2026-06-10 01:15:40'),
(1574, 'ACCTG15', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.64', 'd8:43:ae:93:e5:b6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-10 01:15:40'),
(1575, 'DWHPC', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.231', 'd8:5e:d3:c5:ab:6e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:20', '2026-06-10 01:15:40'),
(1577, 'ACCTG16', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.128', '10:ff:e0:40:cb:f5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-10 01:15:40'),
(1581, 'LEEDEPT', 'Unknown', NULL, 'WORKGROUP', '192.168.0.13', '80:30:e0:2e:94:c8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-10 01:15:40'),
(1586, 'LPDATA', 'Unknown', NULL, 'WORKGROUP', '192.168.0.10', 'b4:2e:99:4b:75:2f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-10 01:15:40'),
(1587, 'AUDITING4', 'Unknown', NULL, 'WORKGROUP', '192.168.0.95', 'd8:5e:d3:4e:6c:a7', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-10 01:15:40'),
(1589, 'CONCESSION2', 'Unknown', NULL, 'WORKGROUP', '192.168.0.25', 'd8:43:ae:93:e5:b3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-10 01:15:40'),
(1591, 'LHMRECEIVING8', 'Unknown', NULL, 'HYPERMART', '192.168.1.56', 'd8:5e:d3:c6:93:1e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-10 01:15:48'),
(1604, 'ACCOUNTING22', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.202', 'e0:d5:5e:05:21:b0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:20', '2026-06-10 01:15:49'),
(1606, 'PROCUREMENT', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.224', '18:c0:4d:09:91:05', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-10 01:15:49'),
(1608, 'PERSONNEL6', 'Unknown', NULL, 'WORKGROUP', '192.168.1.217', '4c:cc:6a:6d:21:2d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:29', '2026-06-10 01:15:49'),
(1609, 'OFFTAKE4', 'Unknown', NULL, 'WORKGROUP', '192.168.1.39', 'd8:5e:d3:c5:ab:f9', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:21', '2026-06-10 01:15:49'),
(1610, 'ACCTG7', 'Unknown', NULL, 'ACCOUNTING', '192.168.5.27', 'f4:b5:20:69:35:74', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:37', '2026-06-10 01:15:49'),
(1611, 'ACCTG6', 'Unknown', NULL, 'ACCOUNTING', '192.168.10.75', 'f4:b5:20:69:36:b7', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:38', '2026-06-10 01:15:49'),
(1615, 'ACCTG18', 'Unknown', NULL, 'ACCOUNTING', '192.168.5.38', 'f4:b5:20:78:33:d7', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:39', '2026-06-10 01:15:50'),
(1621, 'ACCTG3', 'Unknown', NULL, 'ACCOUNTING', '192.168.5.23', 'f4:b5:20:69:33:be', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:37', '2026-06-10 01:15:50'),
(1622, 'ACCOUNTINGN', 'Unknown', NULL, 'ACCOUNTING', '192.168.10.204', '74:56:3c:93:4d:fb', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-10 01:15:50'),
(1624, 'ACCTG9', 'Unknown', NULL, 'ACCOUNTING', '192.168.5.29', 'f4:b5:20:69:35:31', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-10 01:15:50'),
(1627, 'BOOKKEEP_ASIST', 'Unknown', NULL, 'WORKGROUP', '192.168.10.169', 'd8:5e:d3:94:52:81', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:39', '2026-06-10 01:15:51'),
(1629, 'DSRELEASE2', 'Unknown', NULL, 'LEEPLAZA', '192.168.10.222', '00:1c:c0:69:fa:b8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:39', '2026-06-10 01:15:51'),
(1672, 'PRSM1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.162', '00:19:17:b9:9a:7a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:20', '2026-06-10 01:17:39'),
(1702, 'DSRECEIVE1', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.226', '10:e7:c6:2e:88:f9', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:20', '2026-06-10 01:17:53'),
(1736, 'LPHEDPTECH01', 'Unknown', NULL, 'WORKGROUP', '192.168.10.30', 'e0:d5:5e:03:e1:2a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:39', '2026-06-10 01:17:58'),
(1738, 'ACCTG5', 'Unknown', NULL, 'ACCOUNTING', '192.168.10.82', '04:7c:16:bc:bd:f5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:37', '2026-06-10 01:17:58'),
(1780, 'OS', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.99', '1c:1b:0d:1d:a2:44', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-10 01:26:24'),
(1793, 'DSPURCHASE', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.45', '58:11:22:95:83:ed', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-10 01:26:24');
INSERT INTO `computer_monitoring` (`id`, `computer_name`, `user_name`, `location`, `department`, `ip_address`, `mac_address`, `mac_vendor`, `os`, `os_version`, `bit`, `ram`, `storage`, `processor`, `antivirus`, `ms_license_type`, `license_activation`, `license_duration`, `license_expiry`, `open_ports`, `services`, `host_type`, `status`, `last_checked`, `created_at`) VALUES
(1815, 'PO10', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.237', '10:e7:c6:23:4d:fb', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:21', '2026-06-10 01:26:33'),
(1817, 'LPHFINANCE2', 'Unknown', NULL, 'WORKGROUP', '192.168.1.30', 'd8:5e:d3:c5:ab:fd', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:20', '2026-06-10 01:26:33'),
(1843, 'CWH_DGRELEASE8', 'Unknown', NULL, 'WORKGROUP', '192.168.2.29', 'f4:b5:20:4c:37:04', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-10 01:26:33'),
(1849, 'OFGIPC1', 'Unknown', NULL, 'WORKGROUP', '192.168.4.18', 'd8:5e:d3:4e:6c:69', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-10 01:26:42'),
(1853, 'SMRELEASE1', 'Unknown', NULL, 'WORKGROUP', '192.168.2.195', '18:60:24:89:a6:6d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-10 01:26:42'),
(1856, 'ANGKUSINA', 'Unknown', NULL, 'WORKGROUP', '192.168.4.42', 'e4:3a:6e:3a:7a:6b', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-10 01:26:42'),
(1860, 'BACKOFFICE01', 'Unknown', NULL, 'WORKGROUP', '192.168.4.21', '00:e0:4c:68:0b:73', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:58', '2026-06-10 01:26:42'),
(1862, 'ACCTG1', 'Unknown', NULL, 'WORKGROUP', '192.168.5.21', '04:7c:16:bc:bd:f2', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-10 01:26:42'),
(1912, 'PO2', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.50', 'e0:d5:5e:05:20:fb', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-10 01:30:59'),
(1913, 'CHU-PC', 'Unknown', NULL, 'WORKGROUP', '192.168.0.28', '18:c0:4d:72:a4:6a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:49', '2026-06-10 01:30:59'),
(2062, 'ACCOUNTING8', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.65', 'b4:2e:99:48:5c:81', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-10 01:46:15'),
(2071, 'FINANCEGC', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.74', 'd8:43:ae:93:e5:b1', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-10 01:46:15'),
(2078, 'FCRECEIVE', 'Unknown', NULL, 'FASTFOOD', '192.168.0.220', '18:c0:4d:fe:3a:f8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-10 01:46:24'),
(2136, 'SMRECEIVE3', 'Unknown', NULL, 'WORKGROUP', '192.168.2.243', 'e0:d5:5e:70:9f:6d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:59', '2026-06-10 01:47:01'),
(2144, 'CWH_DEPTHEAD4', 'Unknown', NULL, 'WORKGROUP', '192.168.2.34', 'f4:b5:20:4a:8d:8a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-10 01:47:01'),
(2198, 'ACCTG13', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.60', 'd8:43:ae:93:e5:ab', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-10 02:46:11'),
(2212, 'BENGPC', 'Unknown', NULL, 'WORKGROUP', '192.168.0.23', 'b4:2e:99:c9:97:b7', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-11 11:11:50', '2026-06-10 02:46:11'),
(2218, 'DSPURCHASE9', 'Unknown', NULL, 'WORKGROUP', '192.168.0.47', '18:60:24:89:a7:98', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:11'),
(2219, 'PRF5', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.147', '84:a9:3e:6c:84:15', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:19'),
(2241, 'ACCTG17', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.87', '10:ff:e0:40:cb:87', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:20'),
(2251, 'CUSTODIAN', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.249', '00:1c:c0:59:b2:40', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:21'),
(2264, 'PERSONNEL5', 'Unknown', NULL, 'HR & PERSONNEL', '192.168.1.215', '4c:cc:6a:6d:21:5f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:28'),
(2267, 'ACCTG2', 'Unknown', NULL, 'ACCOUNTING', '192.168.5.22', 'f4:b5:20:69:37:4c', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:29'),
(2277, 'FINANCE1', 'Unknown', NULL, 'WORKGROUP', '192.168.1.249', '00:e0:4c:30:19:32', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:29'),
(2278, 'PERSONNEL9', 'Unknown', NULL, 'HR & PERSONNEL', '192.168.1.219', '4c:cc:6a:8b:dc:b4', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:29'),
(2280, 'PERSONNEL4', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.214', 'b4:2e:99:83:ae:be', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:29'),
(2302, 'CWH_DEPTHEAD2', 'Unknown', NULL, 'WORKGROUP', '192.168.2.27', 'f4:b5:20:40:9c:73', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:30'),
(2329, 'LOC4757', 'Unknown', NULL, 'WORKGROUP', '192.168.10.91', 'f4:8c:eb:9b:61:04', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:39'),
(2330, 'HR5', 'Unknown', NULL, 'HR & PERSONNEL', '192.168.10.205', 'f4:b5:20:1b:dd:59', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:39'),
(2331, 'AUDITING12', 'Unknown', NULL, 'LEEPLAZA', '192.168.10.98', 'b4:2e:99:dc:7c:5f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:39'),
(2416, 'CWH_DEPTHEAD5', 'Unknown', NULL, 'WORKGROUP', '192.168.2.35', 'f4:b5:20:4b:b6:57', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', NULL, '2026-06-11 03:11:59'),
(2429, 'PC-192-168-10-1', 'Unknown', NULL, '', '192.168.10.1', '1c:ef:03:ef:80:90', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80,443', '{\"80\": \"Web Server\", \"443\": \"HTTPS\"}', 'Web Server', 'online', NULL, '2026-06-11 03:12:17');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `location`) VALUES
(1, 'EDP', 'Fifth floor'),
(2, 'HR', 'Floor 2'),
(3, 'Finance', 'Floor 2'),
(4, 'Sales', 'Floor 1'),
(6, 'Marketing', 'Floor 1'),
(7, 'Executive', 'Floor 4'),
(8, 'Bookeeping', '04 Office'),
(9, 'Auditing', 'second floor'),
(10, 'Personnel', 'second floor'),
(11, 'Accounting', '04 Office'),
(12, 'Section Head', '04 Office'),
(13, 'Buyer', '04 Office');

-- --------------------------------------------------------

--
-- Table structure for table `department_roles`
--

CREATE TABLE `department_roles` (
  `id` int(11) NOT NULL,
  `department_name` varchar(100) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `role_value` varchar(50) NOT NULL,
  `role_description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department_roles`
--

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

--
-- Table structure for table `job_orders`
--

CREATE TABLE `job_orders` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_orders`
--

INSERT INTO `job_orders` (`id`, `job_order_number`, `date`, `company`, `crtk_no`, `date_needed`, `department`, `is_charge`, `is_expense`, `request_dept`, `particulars`, `job_order_for`, `requested_date`, `requested_name`, `approved_name`, `received_date`, `received_name`, `requested_signature`, `approved_signature`, `received_signature`, `submitted_by`, `status`, `created_at`, `updated_at`) VALUES
(1, 'JO-20260507-BMZ8', '2026-05-07', 'Lee Super Plaza', 'CRTL-260507-IHA', '2026-05-13', 'Personnel', 1, 0, 'EDP', 'Replace tonner', 'James Cauzarin', '2026-05-07', 'User Agent', 'Marevel Jumalon', NULL, NULL, 'data:image/png;base64,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', 'data:image/png;base64,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', NULL, 1, 'approved', '2026-05-07 08:34:19', '2026-05-07 09:46:44'),
(2, 'JO-20260508-ESDK', '2026-05-08', 'Lee Super Plaza', 'CRTL-260508-8VN', '2026-05-15', 'Personnel', 1, 0, 'Operations', 'Relocate the SMPO3 to Basement..........', 'Jonathan Lopez', '2026-05-08', 'User Agent', 'Marevel Jumalon', '2026-05-08', 'System Administrator', 'data:image/png;base64,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', 'data:image/png;base64,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', NULL, 1, 'approved', '2026-05-08 03:14:47', '2026-05-08 05:54:51');

-- --------------------------------------------------------

--
-- Table structure for table `knowledge_base`
--

CREATE TABLE `knowledge_base` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `knowledge_base`
--

INSERT INTO `knowledge_base` (`id`, `title`, `category`, `summary`, `content`, `featured`, `author_name`, `views`, `helpful_yes`, `helpful_no`, `created_at`, `updated_at`) VALUES
(1, 'How to Submit a Support Ticket', 'getting-started', 'Learn how to create and submit tickets for IT support.', '<h4>Step-by-Step Guide</h4><ol><li>Navigate to My Tickets</li><li>Click New Ticket</li><li>Fill in the details</li><li>Submit</li></ol>', 1, 'IT Support Team', 0, 0, 0, '2026-06-08 09:24:38', '2026-06-08 09:24:38'),
(2, 'Understanding Ticket Statuses', 'tickets', 'Learn what each ticket status means.', '<h4>Ticket Lifecycle</h4><ul><li>New - Just submitted</li><li>Assigned - Given to technician</li><li>In Progress - Being worked on</li><li>Resolved - Fixed</li></ul>', 0, 'IT Admin', 0, 0, 0, '2026-06-08 09:24:38', '2026-06-08 09:24:38'),
(3, 'Frequently Asked Questions', 'faq', 'Quick answers to common questions.', '<h4>Common Questions</h4><p><strong>Q: How do I check ticket status?</strong></p><p>A: Go to My Tickets.</p>', 0, 'IT Support Team', 0, 0, 0, '2026-06-08 09:24:38', '2026-06-08 09:24:38');

-- --------------------------------------------------------

--
-- Table structure for table `new_user`
--

CREATE TABLE `new_user` (
  `id` int(11) NOT NULL,
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
  `failed_attempts` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `new_user`
--

INSERT INTO `new_user` (`id`, `username`, `password`, `fullname`, `role`, `department`, `email`, `birthdate`, `workDays`, `dayOff`, `workStart`, `workEnd`, `lunchStart`, `lunchEnd`, `leaveEntries`, `avatar_color`, `photo_url`, `registration_key`, `key_used_at`, `is_verified`, `created_at`, `locked_until`, `failed_attempts`) VALUES
(1, 'user', '$2a$10$3rG.TxX5s1.oNRfJR9w4supu007VVHYcf7GxqC5RZafpuUq0fN8wu', 'User Agent', 'staff', 'Personnel', 'clamihoy20@gmail.com', '1899-11-29', '[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]', '[\"Saturday\",\"Sunday\"]', '08:00', '17:00', '12:00', '13:00', NULL, '#e17055', '/uploads/profiles/profile-1777359299502-894214923.png', 'Leeplaza', '2026-04-26 06:47:59', 1, '2026-04-26 06:47:59', NULL, 0),
(2, 'EDPtech', '$2a$10$TDGtylfG0kafdJOP4ffgZeZ0DGGGoxfR7YHGvk.DYkyvq3hQizWZa', 'Charlie Amihoy', 'recruiter', 'Human Resource', 'camihoy96@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#00c878', NULL, 'Leeplaza', '2026-05-05 10:12:45', 1, '2026-05-05 10:12:45', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_table` varchar(50) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `target_user_id` varchar(100) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `is_read` tinyint(4) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`id`, `email`, `code`, `expires_at`, `created_at`) VALUES
(1, 'camihoy96@gmail.com', '649203', '2026-06-09 15:30:39', '2026-06-09 06:32:10'),
(2, 'user@gmail.com', '528390', '2026-06-09 15:29:40', '2026-06-09 06:39:51'),
(5, 'clamihoy20@gmail.com', '530280', '2026-06-09 16:37:27', '2026-06-09 07:17:49');

-- --------------------------------------------------------

--
-- Table structure for table `registration_keys`
--

CREATE TABLE `registration_keys` (
  `id` int(11) NOT NULL,
  `key_code` varchar(50) NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registration_keys`
--

INSERT INTO `registration_keys` (`id`, `key_code`, `used`, `created_at`) VALUES
(2, 'Leeplaza', 1, '2026-05-05 07:15:07');

-- --------------------------------------------------------

--
-- Table structure for table `requisitions`
--

CREATE TABLE `requisitions` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `requisitions`
--

INSERT INTO `requisitions` (`id`, `requisition_number`, `ctrl_no`, `request_from`, `attn`, `date`, `remarks`, `status`, `prepared_name`, `prepared_signature`, `prepared_date`, `approved_name`, `approved_signature`, `approved_date`, `items_prepared_name`, `items_prepared_signature`, `items_prepared_date`, `returned_name`, `returned_signature`, `returned_date`, `submitted_by`, `created_at`, `updated_at`) VALUES
(3, 'REQ-20260508-HAF', NULL, 'Personnel', 'User Agent', '2026-05-08', 'Defect UPS at SM_EDP', 'pending', 'User Agent', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAA8CAYAAAAjW/WRAAAJB0lEQVR4AezdO8s11RUH8JOrCeTW5FKkCgkkRbpAqpAqbZIiaQIR/ASWCoJY2GglfgIFwUIbsbMUrGwFRQsrBcXCG95v6/c6C+aZd2bOzJnrOWfLXmfN7L32Wv/132s95/Icn/e7h/JfYaAw0MlAaZBOaspCYeBwKA1SqqAw0MNAaZAecspSYaA0SKmBwkAPAws2SE/UslQY2IaBdyPsVyGDR2mQwVQVwzNnQHP8PHL4TsjgJikNEmyVcfEMfBAZao6vQ5NQw0ZpkGE8FavzZuAnAV9jjK730RsiUBmFgXNk4MUA/XGIl1ihho3zbJBhuRWrwgAG8v3GX+LmRyGjnklKgwRjZVw0A54xsilSD064NMjtVH0ZU37qpMRtGWfOQL1JRqVSGuRwyIbw04XgBKEpGmUUqcV4Nwzk2eW5jgamGEZvuqANmgMHmgGJn0VurkmSG1NlnCEDnwRm5+hcnXHcjh8nbxwfanc7sjkQiEhc3BEozZtznzqmyzgjBjTHHRVen15Vl+OVIhi/6+YOP2mHiuK7uXubO3jl3tYAmsX8+wGNTagyzogBNaY5nCHYf/VwqsxRAApqqIgngVPxzrEPcfBmk3T59JvXrrUyv08GPg1YaizPmI6p0wdnp+/+dqdiGyoAs/1257qPGlN8Ud+Lh++FNAebrfA1sZT7cQxojh/GFmf8UmjjXx6myBwNMiX+GnsVPdLkSmuAX7QEZpc2dItJmRrBAD5HmE8yrTeHs/tz5e3ZSp+sODt58843OiANIUf67cDrOtRtg601dvRtBjNMXJOL5NPL2KXzbjZHxnsnL6boSy4GuSn4t4Ig178O3TWss6W7bMr8cAbwiM/hO06zbGuObMpfnuby5i6J3Jy5jLskSX6/GZiSn3oDTYtZDwPJfY/JLEttzcGxl9CzNacC4vQSZShJeaA/uEQSVsrp9xEHjziftUDDb9voag4fvrCfra5ncwTVGYpnjTUO9AypGQQZf5ritbBOHukl66qrOQLC4WfxAE+oecaSiTQRIhN5zfkt7+WPUHpLHBNjr7r91YiWzxbJW55t3ofJrTH3eYuTH+U2Y91/K+Lh8EKlZ1HNILM4bXEiMbH2WIywtUAuUw0Gsin+EPMK31nS5Psx1xzO25x99FThh09x6aa/B6qJv1V6FtUWaBbHNScKUJyuxGqmq14iXMDy3gML7fJ5TOPJ2WkE+sOYc+1M47J32M9WDfQaHlkUlx9YuuJaF++Iq3HLXcHGeem2RowYEqS7LddfQShc60fef0SFiBvPDHhyTzvDn46A3/VyaKgLXzqEg/2j8dD27YeYPsBHi0fPJhKezVmLI6RKcOk4LaF7p2BisDdcMG0lfpjhheS5/S/AuO4qzFg+OpLjLOKjGyoD9vmlQxjurubblHW429YmzSX4SU46NiMc8I7lzaYRL/h/PVyxOB9cKCyStWDeubl/8jAPQfzzSfN/zCs79vDB0Wf/RbV4zK4yG6cWcRoQkMC3ROmY2sWAK4l/eheI1gMhdwXnTIhzwYVrX+13TbysmhuVWI+FU7Fcw9ElbML00PeSynqKZze+8n5WDeysDsOZg+BXonRM7WbAAxdSdwNqISDOQeHIl8hdA7iuN4T5Nb7af1fkKZb4cHRJrve9pApXt4b8XCx2ngALMKdIXJJL+J6CM8ncG64pOdX37q0h6tjq1/hXI11ivW7fd81HvsTqszt5bQyYk4NssFGDIo8mmiPvN4CzWEhNIT/iLDPHLZ4hFkuyw7EztbTox/RIFeTSxFOuYvFHGBSPaznS7pGruMydm8AtB5LnJx+5EXNrvGSazNsEB76AKle/k5ng5vhWZB63Ol+L/JhQBgqr3jByV2REgZHZf9Ek8AwCO5wEbi7hVSTEDwRz1yJvVomO+Z1MtWWcSrLH7Tofa4UlR4Xl0xkN415RkXrDuGfDti4KkR+/tFozczETB8xiwwInubamkD95JB7k/0boxUcSv3igFQM0C0uRdeXZbBjEawSFaB/Y5uxnay6FDfEm8UGGM0gTO5diwECutSnwkJKfbv02J5bUDn5J/2v7VmCZUxZW3g/F8uMwVIj2Kcq6aIZskJxne1/syXlabDLkJRvM9hAxw9Wtr07U/Zsrcjjk37h6fi0y8kDWirdUnCwy+Sg0xaVw547nExMxiBgp/49AiSHjW2u+ZNM0pG7LV2wvTYGEI+IvtDP5u4cemW0pD2c2h5UjxaEIqttFlYKTh8L08abrRQO2OH8i5jSD2ET+Kf4HHxjhyzk2seXGsMZuyLPOjY1XcuNvC0j1Xg9rSdtBTY3Np2Kgp/rq268BxcnCEm9vH2/C6L0LbHDKRxO4JtblQNwTjeY+hT1h+zIHVyq/irxx8lDo1YaDWyJY+nWwS/hXLGIgTFEt8XLqVNywwUVg5AcP7gm87kmus7HWJuwJ2z+GYd2Gj7ECX7g5q5GYcbAq8CUDOkgHS7cdYiY9NmG+4OaXHrt/CXu5wEPaMJnDxSnSh/cUf7DA2+d3b2sw43Z1XAIvFZRv7wkk1naQ1o8dlHUNkZK+3Nu/FPYhfj8KIzhgamIxR6y/EnZt+S8xV3+/I36Ebh17esZtBVibzDyaHNdMlru8Pei8sbwnEKOtGCRuTRF1ifX6Xnvcb3HA9WaFw8fBsCRjcnBP4CZw/ikNVtD+DT4xxSawtMkKUGYJ4WN1ju7xsIUgcYu4Yoqt0NoOMOea6/bYu7ZoDrETV8avN4XCzPmipzPweLjAqW87PBzXmwyHvkngKqj4WXRt2npluqlyUADUGwLenLdWZF4G7qzc+RSwulxf7aUA1898fMTSEOM5O3WHH0T24pzeTEqDbEZ9CdzBgPcdGuP1jvVVp1dtkFUzK8HOkYGnArSXrd57/i6uNx+lQTY/ggKgYuAfof8Tojl2U5e7ARLElHHdDDxXpb+rmtwVmIqgoq6PAc8asvbeg96NlAbZzVFcLZDdNocTuZQGkUuR82MgP879516hlwbZ68lcPi7N4SXVM5Hq5H+NNnwsMkqDLEJrcXqEAV8f0Rx+1/HvI7abLpcG2ZT+qwzu3xH0vy5/ENnv4ncdgaNzfAMAAP//xlT8DwAAAAZJREFUAwD96Npqsy+B3wAAAABJRU5ErkJggg==', '2026-05-08', 'Marevel Jumalon', 'data:image/png;base64,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', '2026-05-08', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-08 09:29:41', '2026-05-08 09:29:41');

-- --------------------------------------------------------

--
-- Table structure for table `requisition_items`
--

CREATE TABLE `requisition_items` (
  `id` int(11) NOT NULL,
  `requisition_id` int(11) DEFAULT NULL,
  `qty` int(5) DEFAULT NULL,
  `item` varchar(150) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `requisition_items`
--

INSERT INTO `requisition_items` (`id`, `requisition_id`, `qty`, `item`, `unit_price`) VALUES
(3, 3, 1, 'UPS', 1200.00);

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL,
  `level` varchar(20) DEFAULT 'info',
  `type` varchar(50) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `user_table` varchar(50) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_logs`
--

INSERT INTO `system_logs` (`id`, `level`, `type`, `user_id`, `user_name`, `user_table`, `action`, `details`, `ip_address`, `created_at`) VALUES
(1, 'info', 'database_export', 1, 'EDPtech', 'users', 'Database exported', NULL, '192.168.10.250', '2026-06-09 09:17:44'),
(2, 'info', 'database_export', 1, 'EDPtech', 'users', 'Database exported', NULL, '192.168.10.250', '2026-06-09 09:18:18'),
(3, 'info', 'database_export', 11, 'camihoy96', 'users', 'Database exported', NULL, '192.168.10.250', '2026-06-10 05:58:06');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `settings_key` varchar(100) NOT NULL,
  `settings_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
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
  `resolved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tickets`
--

INSERT INTO `tickets` (`id`, `ticket_number`, `title`, `description`, `priority`, `status`, `location`, `department_id`, `created_by`, `created_by_name`, `assigned_to`, `is_major_incident`, `reported_via`, `created_at`, `updated_at`, `resolved_at`) VALUES
(10, 'MK-20260427-IWSGRZ', 'No internet Connection', 'This is the problem<div><br></div><div><img src=\"data:image/jpeg;base64,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\" alt=\"image-20260417-064616.png\" style=\"max-width: 300px; border: 1px solid rgb(204, 204, 204); margin-top: 6px; margin-bottom: 6px; display: block;\"><div class=\"file-reference\">📎 image-20260417-064616.png (290.2 KB)</div></div>', 'high', 'resolved', 'Auditing 4', 6, 1, 'User Agent', 11, 0, 'web', '2026-04-27 09:52:38', '2026-04-28 17:43:51', '2026-04-28 09:43:51'),
(11, 'HR-20260429-8PYMSL', 'dfdfdgd', 'egrfgfdg', 'medium', 'resolved', 'Worklynx', 2, 11, 'Charlie Amihoy', 12, 0, 'web', '2026-04-29 03:58:54', '2026-05-01 13:51:00', '2026-05-01 05:51:00'),
(12, 'OP-20260429-03G7I4', ' effgfg', 'fddd', 'medium', 'resolved', 'section head', 5, 1, 'User Agent', 11, 0, 'web', '2026-04-29 05:13:09', '2026-04-29 14:38:10', '2026-04-29 06:38:10'),
(20, 'SA-20260611-8WPTRV', 'fasf', 'DSAGHsd', 'high', 'resolved', 'GFG', 4, 1, 'User Agent', 11, 0, 'web', '2026-06-11 07:45:46', '2026-06-11 16:50:24', '2026-06-11 08:50:24'),
(21, 'SA-20260611-HQQ1O4', 'DEFECT RAM', 'BLUE SCREEN', 'medium', 'resolved', 'CENTRAL WAREHOUSE', 4, 1, 'User Agent', 11, 0, 'web', '2026-06-11 08:44:14', '2026-06-11 16:54:46', '2026-06-11 08:54:46'),
(22, 'IT-20260611-YMD0KC', 'DEFECT SCREEN', 'REPLACE NEW MONITOR&nbsp;', 'medium', 'assigned', '2ND FLOOR ', 1, 1, 'User Agent', 11, 0, 'web', '2026-06-11 08:57:07', '2026-06-11 16:57:50', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `ticket_attachments`
--

CREATE TABLE `ticket_attachments` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ticket_attachments`
--

INSERT INTO `ticket_attachments` (`id`, `ticket_id`, `filename`, `original_name`, `file_path`, `file_type`, `file_size`, `uploaded_by`, `created_at`) VALUES
(10, 10, '1777283559174-25094963.png', 'image-20260417-064616.png', '/uploads/tickets/1777283559174-25094963.png', 'image/png', 297124, 1, '2026-04-27 09:52:39'),
(11, 12, '1777439590137-559858167.jpeg', '8468b4c9-72b3-4f4d-b5ac-2e07d3d9de79.jpeg', '/uploads/tickets/1777439590137-559858167.jpeg', 'image/jpeg', 300962, 1, '2026-04-29 05:13:10');

-- --------------------------------------------------------

--
-- Table structure for table `ticket_comments`
--

CREATE TABLE `ticket_comments` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_table` varchar(10) DEFAULT 'users',
  `comment` text DEFAULT NULL,
  `is_internal` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ticket_comments`
--

INSERT INTO `ticket_comments` (`id`, `ticket_id`, `user_id`, `user_table`, `comment`, `is_internal`, `created_at`) VALUES
(1, 10, 1, 'users', 'Fixed', 0, '2026-04-28 02:16:33'),
(3, 10, 1, 'users', 'gffgfg', 0, '2026-04-29 05:55:22'),
(4, 10, 1, 'users', 'nice', 0, '2026-04-29 05:55:40'),
(5, 12, 11, 'users', 'nice', 0, '2026-04-29 06:37:20'),
(6, 12, 11, 'users', '@System Administrator \nit should be great', 0, '2026-04-29 06:37:53'),
(9, 12, 1, 'users', 'Great', 0, '2026-04-29 07:07:59'),
(10, 12, 1, 'users', '@System Administrator thanks', 0, '2026-04-29 07:30:56'),
(11, 12, 1, 'users', '@System Administrator thanks', 0, '2026-04-29 07:33:12'),
(13, 12, 1, 'users', 'goods', 0, '2026-04-29 07:51:37'),
(14, 12, 1, 'new_user', '@System Administrator thanks', 0, '2026-04-29 07:51:54'),
(15, 12, 1, 'new_user', '@Charlie Amihoy thanks ', 0, '2026-04-29 07:56:24');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
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
  `failed_attempts` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `fullname`, `role`, `department`, `email`, `birthdate`, `workDays`, `dayOff`, `workStart`, `workEnd`, `lunchStart`, `lunchEnd`, `leaveEntries`, `avatar_color`, `photo_url`, `registration_key`, `key_used_at`, `is_verified`, `created_at`, `locked_until`, `failed_attempts`) VALUES
(1, 'EDPtech', '$2a$10$BllYyx9WehP5ZTozs/X8guf8vgwWrUTPZVZ856alPInpuP.O8sZdC', 'System Administrator', 'admin', 'IT Department', 'admin@edptech.com', '2026-02-08', '[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\",\"Sunday\"]', '[\"Saturday\"]', '08:00', '19:00', '12:00', '13:00', NULL, '#ef4444', '/uploads/profiles/profile-1777357959878-350084720.png', NULL, NULL, 0, '2026-04-12 02:08:30', NULL, 0),
(3, 'jsmith', '$2y$10$WA3UhYRpfoZ98uUcizB6bee3KkhWzucsiuiuknA7tle32tfU9UYYi', 'John Smith', 'user', 'Human Resources', 'jsmith@edptech.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#10b981', NULL, NULL, NULL, 0, '2026-04-12 02:08:30', NULL, 0),
(11, 'camihoy96', '$2a$10$ViKJPMqHQNY5hVfI1itq4OXLW1Cy95c/NLajEqSdgmRYCZM09UGAe', 'Charlie Amihoy', 'Technician', 'EDP', 'camihoy96@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#ffd93d', NULL, 'Leeplaza', '2026-04-26 03:51:27', 1, '2026-04-26 03:51:27', NULL, 0),
(12, 'kyle', '$2a$10$IhQHj9pKb7YY3Xn4Xmnb9OrMDYZjT2laIMsqNf1NAtiNiNudKaLy.', 'Kyle Kuzma', 'Technician', 'EDP', 'kyle1@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#e17055', NULL, 'Leeplaza', '2026-04-29 06:25:52', 1, '2026-04-29 06:25:52', NULL, 0),
(13, 'EDP_EL', '$2a$10$JWK589fvX.HY0jv/tO454ezgp0gnTPFZ6Zn58knfzhWmPhTtXSZwa', 'Abrencillo Elisha', 'Technician', 'EDP', 'elishaabrencillo762@gmail.com', '0000-00-00', '[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]', '[\"Saturday\",\"Sunday\"]', '08:00', '17:00', '12:00', '12:00', NULL, '#6c5ce7', '/uploads/profiles/profile-1781056554398-743387567.jpg', 'Leeplaza', '2026-06-10 01:54:20', 1, '2026-06-10 01:54:20', NULL, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `asset_tag` (`asset_tag`),
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_from_username` (`from_username`),
  ADD KEY `idx_to_username` (`to_username`);

--
-- Indexes for table `computer_monitoring`
--
ALTER TABLE `computer_monitoring`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_ip` (`ip_address`),
  ADD KEY `idx_computer_name` (`computer_name`),
  ADD KEY `idx_user_name` (`user_name`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `department_roles`
--
ALTER TABLE `department_roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_orders`
--
ALTER TABLE `job_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `job_order_number` (`job_order_number`);

--
-- Indexes for table `knowledge_base`
--
ALTER TABLE `knowledge_base`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `new_user`
--
ALTER TABLE `new_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email` (`email`);

--
-- Indexes for table `registration_keys`
--
ALTER TABLE `registration_keys`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key_code` (`key_code`);

--
-- Indexes for table `requisitions`
--
ALTER TABLE `requisitions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `requisition_number` (`requisition_number`);

--
-- Indexes for table `requisition_items`
--
ALTER TABLE `requisition_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `requisition_id` (`requisition_id`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `settings_key` (`settings_key`),
  ADD KEY `idx_settings_key` (`settings_key`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticket_number` (`ticket_number`),
  ADD KEY `tickets_ibfk_1` (`department_id`),
  ADD KEY `tickets_ibfk_2` (`created_by`),
  ADD KEY `tickets_ibfk_3` (`assigned_to`);

--
-- Indexes for table `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`);

--
-- Indexes for table `ticket_comments`
--
ALTER TABLE `ticket_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assets`
--
ALTER TABLE `assets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `computer_monitoring`
--
ALTER TABLE `computer_monitoring`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2431;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `department_roles`
--
ALTER TABLE `department_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `job_orders`
--
ALTER TABLE `job_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `knowledge_base`
--
ALTER TABLE `knowledge_base`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `new_user`
--
ALTER TABLE `new_user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `registration_keys`
--
ALTER TABLE `registration_keys`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `requisitions`
--
ALTER TABLE `requisitions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `requisition_items`
--
ALTER TABLE `requisition_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `ticket_comments`
--
ALTER TABLE `ticket_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assets`
--
ALTER TABLE `assets`
  ADD CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `assets_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);

--
-- Constraints for table `requisition_items`
--
ALTER TABLE `requisition_items`
  ADD CONSTRAINT `requisition_items_ibfk_1` FOREIGN KEY (`requisition_id`) REFERENCES `requisitions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  ADD CONSTRAINT `ticket_attachments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ticket_comments`
--
ALTER TABLE `ticket_comments`
  ADD CONSTRAINT `ticket_comments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  ADD CONSTRAINT `ticket_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
