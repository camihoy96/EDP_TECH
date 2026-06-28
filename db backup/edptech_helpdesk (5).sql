-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Jun 21, 2026 at 11:56 AM
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
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `registration_key` varchar(50) NOT NULL,
  `address` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `name`, `company_name`, `registration_key`, `address`, `is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'LSP - Main', '1Prime Retail Corporation', 'Leeplaza', 'Perdices Street, Dumaguete City, Negros Oriental 6200 Philippines', 1, NULL, 1, '2026-06-16 06:36:59', '2026-06-17 06:34:48'),
(2, 'LP - Hypermart', 'Superstore Retail Corporation', 'hyper', 'Jose E. Romero Sr. Avenue cor colon st, Bagacay, Dumaguete City, 6200 Negros Oriental', 1, 1, 1, '2026-06-16 08:46:04', '2026-06-21 06:05:16'),
(3, 'LP - Bayawan', 'Luxe Prime Retail Corporation', 'lpbayawan', ' Puregold building, directly beside the city plaza in Bayawan City, Negros Oriental', 1, 1, 1, '2026-06-16 08:47:32', '2026-06-19 10:27:56'),
(4, 'LP - Dipolog', 'Luxe Prime Retail Corporation', 'lpdipolog', 'Quezon Ave, Dipolog City, Zamboanga del Norte', 1, 1, 1, '2026-06-16 08:48:34', '2026-06-19 10:28:04'),
(5, 'LSP - Main', 'Dynamic Development Corporation', 'lsp_ddc', 'Perdices Street, Dumaguete City, Negros Oriental 6200 Philippines', 1, 1, NULL, '2026-06-21 07:56:04', '2026-06-21 07:56:04');

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
-- Table structure for table `client_notifications`
--

CREATE TABLE `client_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('info','success','warning','error') DEFAULT 'info',
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `ticket_id` int(11) DEFAULT NULL,
  `ticket_number` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `client_notifications`
--

INSERT INTO `client_notifications` (`id`, `user_id`, `type`, `title`, `message`, `ticket_id`, `ticket_number`, `is_read`, `created_at`) VALUES
(1, 1, 'info', '⚙️ Ticket in progress', 'Charlie Amihoy started working on your ticket #TK-20260615-NRTJ2R: \"hsdfh\"', 32, 'TK-20260615-NRTJ2R', 0, '2026-06-15 06:04:01'),
(2, 1, 'info', '📌 Ticket Assigned', 'System Administrator assigned your ticket #TK-20260615-NRTJ2R to an agent', 32, 'TK-20260615-NRTJ2R', 0, '2026-06-15 06:30:15'),
(3, 1, 'info', '⏳ Ticket pending', 'Charlie Amihoy set as pending your ticket #TK-20260615-NRTJ2R: \"hsdfh\"', 32, 'TK-20260615-NRTJ2R', 0, '2026-06-15 06:50:12'),
(4, 1, 'success', '✅ Ticket resolved', 'Charlie Amihoy resolved your ticket #TK-20260615-NRTJ2R: \"hsdfh\"', 32, 'TK-20260615-NRTJ2R', 0, '2026-06-15 07:05:32'),
(5, 1, 'info', '📌 Ticket Assigned', 'System Administrator assigned your ticket #TK-20260615-BIKUSJ to an agent', 33, 'TK-20260615-BIKUSJ', 0, '2026-06-15 07:12:20'),
(6, 1, 'info', '📌 Ticket Assigned', 'System Administrator assigned your ticket #TK-20260615-BITIJX to an agent', 34, 'TK-20260615-BITIJX', 0, '2026-06-15 07:40:23');

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
(32, 'EDPTECHUSER1', 'Unknown', NULL, '', '192.168.10.35', '4c:cc:6a:8f:b7:88', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389,80', '{\"80\": \"HTTP\", \"3389\": \"RDP\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:29', '2026-06-04 09:54:11'),
(33, 'PC-192-168-10-40', 'Unknown', NULL, '', '192.168.10.40', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 13:16:28', '2026-06-04 09:54:27'),
(34, 'CLP_SERVER', 'Unknown', NULL, '', '192.168.10.105', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 13:16:28', '2026-06-04 09:54:27'),
(35, 'SAOSVRLPC', 'Unknown', NULL, '', '192.168.10.106', 'b4:45:06:f8:1f:8e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389,80', '{\"80\": \"HTTP\", \"3389\": \"RDP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-12 12:25:27', '2026-06-04 09:54:28'),
(36, 'PRSM6', 'Unknown', NULL, '', '192.168.10.167', '00:19:17:33:c7:e2', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:40', '2026-06-04 09:54:28'),
(37, 'EDTECH20', 'Unknown', NULL, '', '192.168.10.250', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 13:16:37', '2026-06-04 09:54:35'),
(38, 'LPSALESDEPT', 'Unknown', NULL, '', '192.168.10.251', '', NULL, 'Unknown', NULL, '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'offline', '2026-06-07 13:16:40', '2026-06-04 09:54:37'),
(39, 'LP_C2BACKUP', 'LP_C2BACKUP', NULL, '', '192.168.10.252', '90:09:d0:4b:53:b2', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '139,445,80,443', '{\"80\": \"Web Server\", \"445\": \"SMB\", \"443\": \"HTTPS\", \"139\": \"NetBIOS-SSN\"}', 'Web Server', 'offline', '2026-06-12 12:25:32', '2026-06-04 09:54:40'),
(73, 'LEESM', 'Unknown', NULL, 'WORKGROUP', '192.168.0.108', '80:30:e0:3c:d3:c1', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80,443', '{\"80\": \"HTTP\", \"135\": \"RPC\", \"443\": \"HTTPS\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-11 11:11:49', '2026-06-07 07:19:23'),
(74, 'SAOSVRLPC', 'Unknown', NULL, 'WORKGROUP', '192.168.0.36', 'b4:45:06:f8:1f:8e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389,80', '{\"3389\": \"RDP\", \"80\": \"HTTP\", \"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:23'),
(75, 'LEESM', 'Unknown', NULL, 'WORKGROUP', '192.168.0.11', '80:30:e0:3c:d3:c0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80,443', '{\"80\": \"HTTP\", \"443\": \"HTTPS\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:17', '2026-06-07 07:19:23'),
(76, 'LSPMAIN', 'LSPMAIN', NULL, 'WORKGROUP', '192.168.1.253', '00:11:32:ea:34:5b', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '139,445,80,443', '{\"80\": \"Web Server\", \"139\": \"NetBIOS-SSN\", \"443\": \"HTTPS\", \"445\": \"SMB\"}', 'Web Server', 'offline', '2026-06-12 12:24:53', '2026-06-07 07:19:24'),
(77, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.0.7', '80:30:e0:3c:e3:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:17', '2026-06-07 07:19:24'),
(78, 'PRSM12', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.173', '00:19:17:b9:9a:d3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:22', '2026-06-07 07:19:24'),
(79, 'PAYDBS', 'Unknown', NULL, 'WORKGROUP', '192.168.0.4', 'dc:fe:07:1a:4c:81', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:24'),
(80, 'PRSM13', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.174', '00:19:17:b9:9a:b8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:22', '2026-06-07 07:19:24'),
(81, 'PRSM9', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.170', '00:19:17:33:c9:11', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:22', '2026-06-07 07:19:24'),
(82, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.0.112', '80:30:e0:3c:e3:13', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-11 11:11:49', '2026-06-07 07:19:24'),
(83, 'Supermarket', 'Unknown', NULL, '', '192.168.0.12', '80:30:e0:3b:f4:d8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,443', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\", \"443\": \"HTTPS\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:24'),
(84, 'PRSM5', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.166', '00:19:17:33:c9:88', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:22', '2026-06-07 07:19:24'),
(85, 'SSLPH6', 'Unknown', NULL, 'WORKGROUP', '192.168.1.68', '00:19:17:b9:99:f0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:18', '2026-06-07 07:19:24'),
(86, 'PRSM11', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.172', '00:19:17:33:c9:fd', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:31', '2026-06-07 07:19:24'),
(87, 'PRS6', 'Unknown', NULL, 'WORKGROUP', '192.168.0.120', '00:19:17:33:ca:2d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:24'),
(88, 'SSLPH13', 'Unknown', NULL, 'WORKGROUP', '192.168.1.72', '00:19:17:33:c9:3a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:31', '2026-06-07 07:19:24'),
(89, 'PRS2', 'Unknown', NULL, 'WORKGROUP', '192.168.0.116', '00:19:17:b9:9a:1d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:33', '2026-06-07 07:19:24'),
(90, 'PRF2', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.144', '00:19:17:33:c9:aa', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:24'),
(91, 'PRSM10', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.171', '00:19:17:b9:9a:73', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:24', '2026-06-07 07:19:24'),
(93, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.10.104', '80:30:e0:3c:e3:11', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:29', '2026-06-07 07:19:24'),
(94, 'PRSM14', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.176', '00:19:17:41:10:41', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:24'),
(95, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.10.100', '80:30:e0:3c:e3:12', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:29', '2026-06-07 07:19:24'),
(96, 'VPNSERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.0.109', '80:30:e0:3c:e3:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 07:19:24'),
(97, 'EDPDGRECEIVE2', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.72', '7c:05:07:0e:0c:59', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(98, 'DSRECEIVE3', 'Unknown', NULL, 'WORKGROUP', '192.168.0.84', 'ec:a8:6b:f6:26:e6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(99, 'DSPURCHASE10', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.48', 'd8:5e:d3:4e:7a:b5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(100, 'OS1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.100', '18:60:24:8a:a5:56', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:18', '2026-06-07 07:19:25'),
(101, 'AUDITING1', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.92', 'fc:aa:14:84:4d:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(102, 'PC-192-168-0-76', 'Unknown', NULL, 'WORKGROUP', '192.168.0.76', 'e8:9c:25:23:88:88', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '', '{\"139\": \"NetBIOS-SSN\"}', 'Unknown', 'online', '2026-06-19 10:08:01', '2026-06-07 07:19:25'),
(103, 'AUDITING5', 'Unknown', NULL, 'WORKGROUP', '192.168.0.96', '38:60:77:25:4e:c5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:31', '2026-06-07 07:19:25'),
(104, 'EDPRR', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.79', 'ec:a8:6b:f5:ad:c5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(105, 'CONCESSION1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.32', 'd8:43:ae:93:e5:a8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(106, 'DSPURCHASE6', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.44', '2c:f0:5d:8f:5c:7d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(107, 'PO8', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.56', 'fc:aa:14:84:4d:e2', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:18', '2026-06-07 07:19:25'),
(108, 'SMPO2', 'Unknown', NULL, 'WORKGROUP', '192.168.0.186', '18:c0:4d:4f:49:4d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(109, 'PO4', 'Unknown', NULL, 'WORKGROUP', '192.168.0.58', '7c:05:07:0f:d5:70', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:25', '2026-06-07 07:19:25'),
(110, 'FINANCE3', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.200', 'd8:5e:d3:c6:8e:8d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(111, 'SMPRETURN', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.196', 'b8:ae:ed:ff:65:03', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(112, 'PRFF3', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.152', 'c8:d9:d2:2a:f5:58', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-15 10:06:52', '2026-06-07 07:19:25'),
(113, 'SMPURCHASE', 'Unknown', NULL, 'WORKGROUP', '192.168.0.191', '7c:05:07:11:34:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(114, 'SMRECEIVE', 'Unknown', NULL, 'WORKGROUP', '192.168.0.194', '1c:1b:0d:1e:10:c5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(115, 'PRSM20', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.181', 'd8:bb:c1:29:16:01', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:35', '2026-06-07 07:19:25'),
(116, 'SMPO6', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.190', '84:a9:3e:6c:84:1b', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:31', '2026-06-07 07:19:25'),
(117, 'PO3', 'Unknown', NULL, 'WORKGROUP', '192.168.0.51', '74:d4:35:bf:46:87', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:18', '2026-06-07 07:19:25'),
(118, 'PRSM19', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.180', 'd8:bb:c1:29:16:68', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(119, 'SMRECEIVE2', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.198', 'e0:d5:5e:70:9e:9a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:33', '2026-06-07 07:19:25'),
(120, 'SMPO4', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.188', '4c:cc:6a:8f:b8:24', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:25'),
(121, 'PRSM17', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.178', 'd8:bb:c1:29:15:9b', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:23', '2026-06-07 07:19:25'),
(122, 'SMPO3', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.187', '4c:cc:6a:8f:b7:b3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:31', '2026-06-07 07:19:25'),
(123, 'LHMBO', 'Unknown', NULL, 'WORKGROUP', '192.168.1.48', 'b8:ae:ed:ff:c0:32', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:32'),
(124, 'LHMEDP', 'Unknown', NULL, 'WORKGROUP', '192.168.1.33', 'b4:2e:99:dd:03:a8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-15 10:06:52', '2026-06-07 07:19:32'),
(125, 'PRS9', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.124', '84:a9:3e:6c:83:75', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:31', '2026-06-07 07:19:32'),
(126, 'OFFTAKE1', 'Unknown', NULL, 'WORKGROUP', '192.168.1.36', 'b4:2e:99:dd:03:a3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:33'),
(127, 'LHMAUDITING', 'Unknown', NULL, 'WORKGROUP', '192.168.1.52', 'f4:b5:20:44:9e:79', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:33'),
(128, 'LHMRECEIVING2', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.44', 'f4:b5:20:40:9c:76', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:33'),
(129, 'PRF6', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.148', '84:a9:3e:6c:84:0e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:33'),
(130, 'LPHFINANCE', 'Unknown', NULL, 'WORKGROUP', '192.168.1.32', '10:78:d2:84:3f:ad', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:31', '2026-06-07 07:19:33'),
(131, 'CWH_SMRELEASE', 'Unknown', NULL, 'WORKGROUP', '192.168.2.4', 'b4:2e:99:dc:7c:63', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:33'),
(132, 'PERSONNEL10', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.220', 'f4:b5:20:78:33:d8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:33'),
(133, 'OSFSNB', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.232', 'c8:5b:76:71:d7:9c', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:31', '2026-06-07 07:19:33'),
(134, 'CWH_DGRELEASE4', 'Unknown', NULL, 'CWAREHOUSE', '192.168.2.16', 'b4:2e:99:52:19:1e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:33'),
(135, 'CWH_RECEIVE', 'Unknown', NULL, 'WORKGROUP', '192.168.2.3', '4c:cc:6a:6d:21:26', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-11 11:11:59', '2026-06-07 07:19:34'),
(136, 'LSPCORP', 'Unknown', NULL, 'WORKGROUP', '192.168.1.248', 'b8:ae:ed:ff:bf:36', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:29', '2026-06-07 07:19:34'),
(137, 'POS03-', 'Unknown', NULL, 'WORKGROUP', '192.168.1.60', 'fc:aa:14:84:4d:e6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:43', '2026-06-07 07:19:34'),
(138, 'HR2', 'Unknown', NULL, 'WORKGROUP', '192.168.1.202', 'b8:ae:ed:ff:e2:f0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-12 12:25:22', '2026-06-07 07:19:34'),
(139, 'LPHAUDITING4', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.64', '10:e7:c6:2e:88:ef', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(140, 'LHMDGPROMOTION', 'Unknown', NULL, 'WORKGROUP', '192.168.1.34', 'e0:69:95:eb:7a:aa', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:18', '2026-06-07 07:19:34'),
(141, 'LHMEDP1', 'Unknown', NULL, 'WORKGROUP', '192.168.1.232', 'f4:b5:20:75:3e:17', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(142, 'SMRECEIVE4', 'Unknown', NULL, 'WORKGROUP', '192.168.0.244', 'ec:a8:6b:71:09:0e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:34'),
(143, 'SSLPH19', 'Unknown', NULL, 'WORKGROUP', '192.168.1.92', '2c:f0:5d:c8:af:f6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(144, 'OFFTAKE2', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.37', 'f4:b5:20:44:9e:22', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:29', '2026-06-07 07:19:34'),
(145, 'LHMAUDITING1', 'Unknown', NULL, 'WORKGROUP', '192.168.1.40', '2c:f0:5d:8f:5b:ae', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:34'),
(146, 'LHMTIMEKEEPER', 'Unknown', NULL, 'WORKGROUP', '192.168.1.49', 'f4:4d:30:9c:cf:26', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 07:19:34'),
(147, 'CUSTOMERSERVICE', 'Unknown', NULL, 'WORKGROUP', '192.168.0.235', 'b8:ae:ed:ff:c0:26', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-14 11:28:11', '2026-06-07 07:19:34'),
(148, 'PRT7', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.136', '84:a9:3e:6c:83:82', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-14 11:28:02', '2026-06-07 07:19:34'),
(149, 'CWH_DGRELEASE7', 'Unknown', NULL, 'WORKGROUP', '192.168.2.28', 'f4:b5:20:4c:36:cc', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(150, 'CWH_RECEIVE6', 'Unknown', NULL, 'WORKGROUP', '192.168.2.48', 'ec:a8:6b:f5:f3:be', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(151, 'CWHDGRELEASE10', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.20', '18:60:24:89:a7:7e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(152, 'AUDITING7', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.40', 'd8:5e:d3:c6:8e:84', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(154, 'SMRECIEVE5', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.100', '18:60:24:89:a7:bd', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(155, 'DSPURCHASE11', 'Unknown', NULL, 'WORKGROUP', '192.168.10.52', '74:d4:35:bf:45:89', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-14 11:28:12', '2026-06-07 07:19:34'),
(156, 'EDPDGRECEIVE', 'Unknown', NULL, 'DEPTSTORE', '192.168.2.24', '1c:1b:0d:1d:a1:34', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(157, 'SM2', 'Unknown', NULL, 'WORKGROUP', '192.168.2.200', '4c:cc:6a:6d:21:28', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(158, 'AUDITING11', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.44', 'd8:5e:d3:c6:8e:89', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(159, 'AUDITING10', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.43', 'd8:5e:d3:c6:73:ca', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:42', '2026-06-07 07:19:34'),
(161, 'CWH_DGRECEIVE', 'Unknown', NULL, 'CWAREHOUSE', '192.168.10.60', 'b4:2e:99:6d:4a:ac', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(162, 'CWH_RECEIVE3', 'Unknown', NULL, 'LEE PLAZA', '192.168.2.12', 'f4:b5:20:55:c6:a1', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:34'),
(163, 'DSRELEASE5', 'Unknown', NULL, 'WORKGROUP', '192.168.10.149', 'e0:69:95:eb:7a:3c', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-14 11:28:20', '2026-06-07 07:19:34'),
(164, 'PRSM18', 'Unknown', NULL, 'SUPERMARKET', '192.168.10.179', 'd8:bb:c1:29:14:aa', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-07 07:19:35'),
(165, 'PRSM16', 'Unknown', NULL, 'SUPERMARKET', '192.168.10.177', '2c:f0:5d:c8:af:f3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-07 07:19:35'),
(166, 'VANSKIE30', 'Unknown', NULL, 'WORKGROUP', '192.168.10.248', 'a8:a1:59:3f:6a:52', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:41'),
(167, 'SMPO1', 'Unknown', NULL, 'SUPERMARKET', '192.168.10.185', '18:c0:4d:72:b7:e8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:37', '2026-06-07 07:19:41'),
(168, 'LSP_CCTV', 'Unknown', NULL, 'WORKGROUP', '192.168.10.200', 'b8:ae:ed:ff:bf:62', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 07:19:41'),
(169, 'DESKTOP-KG86156', 'Unknown', NULL, 'WORKGROUP', '192.168.10.236', '40:8d:5c:d5:8b:41', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:48', '2026-06-07 07:19:42'),
(170, 'PC-192-168-0-16', 'Unknown', NULL, '', '192.168.0.16', '00:15:5d:00:07:06', '', 'Linux', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '22,80', '{\"80\": \"Web Server\", \"22\": \"SSH\"}', 'Linux/Unix', 'online', '2026-06-19 10:07:56', '2026-06-07 07:19:48'),
(171, 'PC-192-168-1-16', 'Unknown', NULL, '', '192.168.1.16', '00:15:5d:00:07:06', '', 'Linux', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '22,80', '{\"80\": \"Web Server\", \"22\": \"SSH\"}', 'Linux/Unix', 'online', '2026-06-19 10:07:56', '2026-06-07 07:19:48'),
(172, 'PC-192-168-0-2', 'Unknown', NULL, '', '192.168.0.2', '38:0e:4d:34:3c:53', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80,443,23', '{\"80\": \"Web Server\", \"443\": \"HTTPS\"}', 'Web Server', 'online', '2026-06-19 10:07:57', '2026-06-07 07:19:50'),
(173, 'PC-192-168-0-1', 'Unknown', 'EDP Server', 'EDP', '192.168.0.1', '18:c2:41:7c:38:47', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', 'Trellix', 'N/A (non-Windows)', '0000-00-00', '', '0000-00-00', '80,443', '{\"80\": \"Web Server\", \"443\": \"HTTPS\"}', 'Web Server', 'online', '2026-06-19 10:07:58', '2026-06-07 07:19:50'),
(174, 'PC-192-168-0-132', 'Unknown', NULL, '', '192.168.0.132', '00:19:17:41:10:5d', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80', '{\"80\": \"HTTP\"}', 'Web Server', 'online', '2026-06-19 10:07:58', '2026-06-07 07:19:51'),
(175, 'PC-192-168-0-168', 'Unknown', NULL, '', '192.168.0.168', '00:19:17:33:c9:db', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80', '{\"80\": \"HTTP\"}', 'Web Server', 'online', '2026-06-19 10:07:58', '2026-06-07 07:19:51'),
(176, 'DSPURCHASE1', 'Unknown', NULL, '', '192.168.0.248', '18:60:24:8a:a4:e8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:50', '2026-06-07 07:19:56'),
(193, 'PO1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.49', 'e0:d5:5e:7e:27:fb', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-15 10:06:44', '2026-06-07 08:33:49'),
(217, 'SMRECEIVE1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.241', 'e0:d5:5e:70:9e:10', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-12 12:25:22', '2026-06-07 08:33:49'),
(226, 'PC-192-168-0-164', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.164', '00:19:17:33:ca:00', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80', '{\"80\": \"HTTP\"}', 'Web Server', 'offline', '2026-06-18 10:58:45', '2026-06-07 08:33:57'),
(229, 'PO7', 'Unknown', NULL, 'WORKGROUP', '192.168.10.55', '2c:f0:5d:8f:5c:7f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-07 08:33:57'),
(252, 'SMPO8', 'Unknown', NULL, 'WORKGROUP', '192.168.0.247', 'e0:d5:5e:05:21:ac', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-07 17:35:50', '2026-06-07 08:33:58'),
(388, 'DSPURCHASE8', 'Unknown', NULL, 'WORKGROUP', '192.168.0.46', '18:c0:4d:9d:54:52', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-07 08:48:54'),
(424, 'SM_EDP', 'Unknown', NULL, 'SUPERMARKET', '192.168.0.184', '74:d4:35:64:de:6d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-07 08:49:02'),
(982, 'CWH_DEPTHEAD3', 'Unknown', NULL, 'WORKGROUP', '192.168.2.33', 'f4:b5:20:4b:47:4e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:43', '2026-06-07 09:16:31'),
(1548, 'BOOK_KEEP3', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.70', 'f4:4d:30:90:9d:34', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-10 01:15:39'),
(1552, 'LPHEDPTECH01', 'Unknown', NULL, '', '192.168.10.15', 'c8:d9:d2:2a:f5:41', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:29', '2026-06-10 01:15:40'),
(1554, 'HR4', 'Unknown', NULL, 'HR & PERSONNEL', '192.168.1.204', 'f4:4d:30:0b:6a:b7', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:31', '2026-06-10 01:15:40'),
(1561, 'ACCTG12', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.68', 'd8:43:ae:93:e5:b2', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-10 01:15:40'),
(1569, 'CWH_DEPTHEAD1', 'Unknown', NULL, 'C_WAREHOUSE', '192.168.2.26', 'f4:b5:20:40:9c:7e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-10 01:15:40'),
(1570, 'EDP_EL', 'Unknown', NULL, 'WORKGROUP', '192.168.0.127', 'f4:4d:30:9c:a7:49', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-12 12:25:01', '2026-06-10 01:15:40'),
(1574, 'ACCTG15', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.64', 'd8:43:ae:93:e5:b6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-10 01:15:40'),
(1575, 'DWHPC', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.231', 'd8:5e:d3:c5:ab:6e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:31', '2026-06-10 01:15:40'),
(1577, 'ACCTG16', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.128', '10:ff:e0:40:cb:f5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-10 01:15:40'),
(1581, 'LEEDEPT', 'Unknown', NULL, 'WORKGROUP', '192.168.0.13', '80:30:e0:2e:94:c8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-10 01:15:40'),
(1586, 'LPDATA', 'Unknown', NULL, 'WORKGROUP', '192.168.0.10', 'b4:2e:99:4b:75:2f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:31', '2026-06-10 01:15:40'),
(1587, 'AUDITING4', 'Unknown', NULL, 'WORKGROUP', '192.168.0.95', 'd8:5e:d3:4e:6c:a7', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:25', '2026-06-10 01:15:40'),
(1589, 'CONCESSION2', 'Unknown', NULL, 'WORKGROUP', '192.168.0.25', 'd8:43:ae:93:e5:b3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:11', '2026-06-10 01:15:40'),
(1591, 'LHMRECEIVING8', 'Unknown', NULL, 'HYPERMART', '192.168.1.56', 'd8:5e:d3:c6:93:1e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-10 01:15:48'),
(1604, 'ACCOUNTING22', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.202', 'e0:d5:5e:05:21:b0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-10 01:15:49'),
(1606, 'PROCUREMENT', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.224', '18:c0:4d:09:91:05', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-10 01:15:49'),
(1608, 'PERSONNEL6', 'Unknown', NULL, 'WORKGROUP', '192.168.1.217', '4c:cc:6a:6d:21:2d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:29', '2026-06-10 01:15:49'),
(1609, 'OFFTAKE4', 'Unknown', NULL, 'WORKGROUP', '192.168.1.39', 'd8:5e:d3:c5:ab:f9', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:28', '2026-06-10 01:15:49'),
(1610, 'ACCTG7', 'Unknown', NULL, 'ACCOUNTING', '192.168.5.27', 'f4:b5:20:69:35:74', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:45', '2026-06-10 01:15:49'),
(1611, 'ACCTG6', 'Unknown', NULL, 'ACCOUNTING', '192.168.10.75', 'f4:b5:20:69:36:b7', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:45', '2026-06-10 01:15:49'),
(1615, 'ACCTG18', 'Unknown', NULL, 'ACCOUNTING', '192.168.5.38', 'f4:b5:20:78:33:d7', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-15 10:07:02', '2026-06-10 01:15:50'),
(1621, 'ACCTG3', 'Unknown', NULL, 'ACCOUNTING', '192.168.5.23', 'f4:b5:20:69:33:be', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:37', '2026-06-10 01:15:50'),
(1622, 'ACCOUNTINGN', 'Unknown', NULL, 'ACCOUNTING', '192.168.10.204', '74:56:3c:93:4d:fb', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-10 01:15:50'),
(1624, 'ACCTG9', 'Unknown', NULL, 'ACCOUNTING', '192.168.5.29', 'f4:b5:20:69:35:31', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:45', '2026-06-10 01:15:50'),
(1627, 'BOOKKEEP_ASIST', 'Unknown', NULL, 'WORKGROUP', '192.168.10.169', 'd8:5e:d3:94:52:81', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-10 01:15:51'),
(1629, 'DSRELEASE2', 'Unknown', NULL, 'LEEPLAZA', '192.168.10.222', '00:1c:c0:69:fa:b8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-10 01:15:51'),
(1672, 'PRSM1', 'Unknown', NULL, 'WORKGROUP', '192.168.0.162', '00:19:17:b9:9a:7a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:20', '2026-06-10 01:17:39'),
(1702, 'DSRECEIVE1', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.226', '10:e7:c6:2e:88:f9', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:31', '2026-06-10 01:17:53'),
(1736, 'LPHEDPTECH01', 'Unknown', NULL, 'WORKGROUP', '192.168.10.30', 'e0:d5:5e:03:e1:2a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:45', '2026-06-10 01:17:58'),
(1738, 'ACCTG5', 'Unknown', NULL, 'ACCOUNTING', '192.168.10.82', '04:7c:16:bc:bd:f5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-10 01:17:58'),
(1780, 'OS', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.99', '1c:1b:0d:1d:a2:44', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-10 01:26:24'),
(1793, 'DSPURCHASE', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.45', '58:11:22:95:83:ed', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:17', '2026-06-10 01:26:24');
INSERT INTO `computer_monitoring` (`id`, `computer_name`, `user_name`, `location`, `department`, `ip_address`, `mac_address`, `mac_vendor`, `os`, `os_version`, `bit`, `ram`, `storage`, `processor`, `antivirus`, `ms_license_type`, `license_activation`, `license_duration`, `license_expiry`, `open_ports`, `services`, `host_type`, `status`, `last_checked`, `created_at`) VALUES
(1815, 'PO10', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.237', '10:e7:c6:23:4d:fb', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:34', '2026-06-10 01:26:33'),
(1817, 'LPHFINANCE2', 'Unknown', NULL, 'WORKGROUP', '192.168.1.30', 'd8:5e:d3:c5:ab:fd', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:34', '2026-06-10 01:26:33'),
(1843, 'CWH_DGRELEASE8', 'Unknown', NULL, 'WORKGROUP', '192.168.2.29', 'f4:b5:20:4c:37:04', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:43', '2026-06-10 01:26:33'),
(1849, 'OFGIPC1', 'Unknown', NULL, 'WORKGROUP', '192.168.4.18', 'd8:5e:d3:4e:6c:69', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-15 10:07:02', '2026-06-10 01:26:42'),
(1853, 'SMRELEASE1', 'Unknown', NULL, 'WORKGROUP', '192.168.2.195', '18:60:24:89:a6:6d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-10 10:46:30', '2026-06-10 01:26:42'),
(1856, 'ANGKUSINA', 'Unknown', NULL, 'WORKGROUP', '192.168.4.42', 'e4:3a:6e:3a:7a:6b', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-10 01:26:42'),
(1860, 'BACKOFFICE01', 'Unknown', NULL, 'WORKGROUP', '192.168.4.21', '00:e0:4c:68:0b:73', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:45', '2026-06-10 01:26:42'),
(1862, 'ACCTG1', 'Unknown', NULL, 'WORKGROUP', '192.168.5.21', '04:7c:16:bc:bd:f2', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:29', '2026-06-10 01:26:42'),
(1912, 'PO2', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.50', 'e0:d5:5e:05:20:fb', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:18', '2026-06-10 01:30:59'),
(1913, 'CHU-PC', 'Unknown', NULL, 'WORKGROUP', '192.168.0.28', '18:c0:4d:72:a4:6a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:17', '2026-06-10 01:30:59'),
(2062, 'ACCOUNTING8', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.65', 'b4:2e:99:48:5c:81', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-15 10:06:43', '2026-06-10 01:46:15'),
(2071, 'FINANCEGC', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.74', 'd8:43:ae:93:e5:b1', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:23', '2026-06-10 01:46:15'),
(2078, 'FCRECEIVE', 'Unknown', NULL, 'FASTFOOD', '192.168.0.220', '18:c0:4d:fe:3a:f8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-10 01:46:24'),
(2136, 'SMRECEIVE3', 'Unknown', NULL, 'WORKGROUP', '192.168.2.243', 'e0:d5:5e:70:9f:6d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:29', '2026-06-10 01:47:01'),
(2144, 'CWH_DEPTHEAD4', 'Unknown', NULL, 'WORKGROUP', '192.168.2.34', 'f4:b5:20:4a:8d:8a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:43', '2026-06-10 01:47:01'),
(2198, 'ACCTG13', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.60', 'd8:43:ae:93:e5:ab', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-10 02:46:11'),
(2212, 'BENGPC', 'Unknown', NULL, 'WORKGROUP', '192.168.0.23', 'b4:2e:99:c9:97:b7', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:18', '2026-06-10 02:46:11'),
(2218, 'DSPURCHASE9', 'Unknown', NULL, 'WORKGROUP', '192.168.0.47', '18:60:24:89:a7:98', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-15 10:06:53', '2026-06-10 02:46:11'),
(2219, 'PRF5', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.147', '84:a9:3e:6c:84:15', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:25', '2026-06-10 02:46:19'),
(2241, 'ACCTG17', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.87', '10:ff:e0:40:cb:87', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-15 10:06:44', '2026-06-10 02:46:20'),
(2251, 'CUSTODIAN', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.249', '00:1c:c0:59:b2:40', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-10 02:46:21'),
(2264, 'PERSONNEL5', 'Unknown', NULL, 'HR & PERSONNEL', '192.168.1.215', '4c:cc:6a:6d:21:5f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:17', '2026-06-10 02:46:28'),
(2267, 'ACCTG2', 'Unknown', NULL, 'ACCOUNTING', '192.168.5.22', 'f4:b5:20:69:37:4c', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,3389', '{\"3389\": \"RDP\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:31', '2026-06-10 02:46:29'),
(2277, 'FINANCE1', 'Unknown', NULL, 'WORKGROUP', '192.168.1.249', '00:e0:4c:30:19:32', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:35', '2026-06-10 02:46:29'),
(2278, 'PERSONNEL9', 'Unknown', NULL, 'HR & PERSONNEL', '192.168.1.219', '4c:cc:6a:8b:dc:b4', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:40', '2026-06-10 02:46:29'),
(2280, 'PERSONNEL4', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.214', 'b4:2e:99:83:ae:be', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-15 10:06:53', '2026-06-10 02:46:29'),
(2302, 'CWH_DEPTHEAD2', 'Unknown', NULL, 'WORKGROUP', '192.168.2.27', 'f4:b5:20:40:9c:73', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:43', '2026-06-10 02:46:30'),
(2329, 'LOC4757', 'Unknown', NULL, 'WORKGROUP', '192.168.10.91', 'f4:8c:eb:9b:61:04', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-10 02:46:39'),
(2330, 'HR5', 'Unknown', NULL, 'HR & PERSONNEL', '192.168.10.205', 'f4:b5:20:1b:dd:59', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-10 02:46:39'),
(2331, 'AUDITING12', 'Unknown', NULL, 'LEEPLAZA', '192.168.10.98', 'b4:2e:99:dc:7c:5f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:49', '2026-06-10 02:46:39'),
(2416, 'CWH_DEPTHEAD5', 'Unknown', NULL, 'WORKGROUP', '192.168.2.35', 'f4:b5:20:4b:b6:57', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:43', '2026-06-11 03:11:59'),
(2429, 'PC-192-168-10-1', 'Unknown', NULL, '', '192.168.10.1', '1c:ef:03:ef:80:90', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80,443', '{\"80\": \"Web Server\", \"443\": \"HTTPS\"}', 'Web Server', 'offline', NULL, '2026-06-11 03:12:17'),
(2439, 'PRS8', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.123', '80:e8:2c:de:bb:68', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:25', '2026-06-12 04:24:59'),
(2444, 'LPHDEPTHEAD', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.55', 'd8:5e:d3:26:ee:36', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-15 10:06:53', '2026-06-12 04:25:00'),
(2462, 'S8', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.122', '70:71:bc:7c:ba:aa', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-12 04:25:00'),
(2467, 'CHINAPC', 'Unknown', NULL, 'C_WAREHOUSE', '192.168.0.85', 'b4:2e:99:dc:7c:60', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:25', '2026-06-12 04:25:00'),
(2470, 'LHMRECEIVE6', 'Unknown', NULL, 'HYPERMART', '192.168.1.51', '18:60:24:89:a7:54', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:47', '2026-06-12 04:25:00'),
(2490, 'HYPERPRICE-2', 'Unknown', NULL, 'WORKGROUP', '192.168.1.82', 'fc:06:8c:0c:4b:15', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:28', '2026-06-12 04:25:17'),
(2492, 'CWH_RECEIVE2', 'Unknown', NULL, 'WORKGROUP', '192.168.2.11', 'b8:ae:ed:ff:71:28', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', NULL, '2026-06-12 04:25:19'),
(2498, 'LPHALT', 'Unknown', NULL, 'WORKGROUP', '192.168.1.7', 'd8:5e:d3:c5:ab:7b', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-15 10:06:52', '2026-06-12 04:25:23'),
(2512, 'LHMHR', 'Unknown', NULL, 'WORKGROUP', '192.168.1.157', 'f4:b5:20:55:c8:d7', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-12 04:25:27'),
(2525, 'ACCTG10', 'Unknown', NULL, 'ACCOUNTING', '192.168.5.30', 'f4:b5:20:69:36:b9', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:49', '2026-06-12 04:25:28'),
(2526, 'EDPTECH00', 'Unknown', NULL, 'LEEPLAZA', '192.168.4.218', 'd8:5e:d3:c6:8e:91', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:29', '2026-06-12 04:25:28'),
(2541, 'PRT9', 'Unknown', NULL, 'DEPTSTORE', '192.168.11.10', '84:a9:3e:6c:83:7f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', NULL, '2026-06-12 04:25:54'),
(2542, 'ARCHITECH2', 'Unknown', NULL, 'LEEPLAZA', '192.168.10.249', 'fc:aa:14:ab:3a:db', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:43', '2026-06-12 04:25:56'),
(2555, 'PRT4', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.133', '00:19:17:33:ca:2a', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,80', '{\"80\": \"HTTP\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:17', '2026-06-14 03:28:02'),
(2596, 'SSLPH17', 'Unknown', NULL, 'WORKGROUP', '192.168.1.90', '2c:f0:5d:c8:af:c8', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:42', '2026-06-14 03:28:02'),
(2601, 'LHMBM', 'Unknown', NULL, 'WORKGROUP', '192.168.1.31', 'e0:d5:5e:70:9e:87', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', NULL, '2026-06-14 03:28:11'),
(2614, 'CWHDGRELEASE2', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.14', '18:60:24:89:a7:c0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:29', '2026-06-14 03:28:11'),
(2616, 'OFGIPC2', 'Unknown', NULL, 'OFGI', '192.168.4.19', 'f4:b5:20:4a:88:3c', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:45', '2026-06-14 03:28:11'),
(2621, 'DSPURCHASE12', 'Unknown', NULL, 'LEEPLAZA', '192.168.10.53', '40:8d:5c:4a:b1:a2', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:45', '2026-06-14 03:28:11'),
(2622, 'OFGI_PASEO', 'Unknown', NULL, 'WORKGROUP', '192.168.4.20', '1c:69:7a:a2:31:05', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-15 10:07:02', '2026-06-14 03:28:11'),
(2634, 'LPOSNB', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.223', 'e8:80:88:cc:07:f4', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-14 03:28:12'),
(2650, 'PC-192-168-0-169', 'Unknown', NULL, '', '192.168.0.169', '00:19:17:b9:9a:59', '', 'Unknown', 'Unknown', '64', 'Unknown', '', 'Unknown', '', 'N/A (non-Windows)', NULL, NULL, NULL, '80', '{\"80\": \"HTTP\"}', 'Web Server', 'offline', '2026-06-15 10:07:10', '2026-06-14 03:28:28'),
(2675, 'ACCOUNTING2', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.59', 'e0:d5:5e:05:21:ab', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-15 02:06:43'),
(2685, 'EDPDGRECEIVE1', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.77', 'f4:b5:20:46:f5:38', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:18', '2026-06-15 02:06:44'),
(2686, 'SALESINVOICE', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.71', 'd8:43:ae:93:e5:bd', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:25', '2026-06-15 02:06:44'),
(2687, 'ACCOUNTING4', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.61', 'e0:d5:5e:ea:cb:26', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-15 02:06:44'),
(2695, 'AUDITING', 'Unknown', NULL, 'WORKGROUP', '192.168.0.98', 'e8:9c:25:23:89:34', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:25', '2026-06-15 02:06:44'),
(2696, 'AUDITING3', 'Unknown', NULL, 'WORKGROUP', '192.168.0.94', 'b4:2e:99:64:0c:f0', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:31', '2026-06-15 02:06:44'),
(2698, 'PRS10', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.125', 'c8:d9:d2:2a:f5:57', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:25', '2026-06-15 02:06:44'),
(2707, 'BOOKKEEP6', 'Unknown', NULL, 'WORKGROUP', '192.168.0.252', '80:e8:2c:fd:b8:b4', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-15 02:06:52'),
(2711, 'BOOKKEEP4', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.250', 'e0:d5:5e:7e:29:f3', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:29', '2026-06-15 02:06:52'),
(2713, 'BOOKKEEP5', 'Unknown', NULL, 'LEEPLAZA', '192.168.0.251', '9c:7b:ef:4b:ea:75', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"139\": \"NetBIOS-SSN\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:35', '2026-06-15 02:06:52'),
(2717, 'LHM_CCTV', 'Unknown', NULL, 'WORKGROUP', '192.168.1.6', 'e0:d5:5e:7e:26:ed', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:32', '2026-06-15 02:06:52'),
(2723, 'LHMRECEIVE5', 'Unknown', NULL, 'WORKGROUP', '192.168.1.50', 'f4:b5:20:30:87:86', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-15 02:06:53'),
(2727, 'LHMAUDITING2', 'Unknown', NULL, 'LEEPLAZA', '192.168.1.41', 'e0:d5:5e:06:60:42', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:35', '2026-06-15 02:06:53'),
(2728, 'LPH_OFFTAKE', 'Unknown', NULL, 'WORKGROUP', '192.168.1.35', 'f4:b5:20:46:f5:9e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:34', '2026-06-15 02:06:53'),
(2746, 'ACCOUNTING10', 'Unknown', NULL, 'ACCOUNTING', '192.168.1.250', 'e0:d5:5e:05:21:ad', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', NULL, '2026-06-15 02:07:01'),
(2749, 'CWHDGRELEASE9', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.19', '10:e7:c6:24:42:7e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:35', '2026-06-15 02:07:01'),
(2752, 'CWH_DGRELEASE6', 'Unknown', NULL, 'WORKGROUP', '192.168.2.18', 'f4:b5:20:46:f0:d5', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', NULL, '2026-06-15 02:07:01'),
(2759, 'CWHDEPTHEAD8', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.38', 'b4:2e:99:64:0d:1f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:41', '2026-06-15 02:07:02'),
(2765, 'AUDITING9', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.42', 'b4:2e:99:83:ae:bc', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-15 02:07:02'),
(2775, 'FOI', 'Unknown', NULL, 'WORKGROUP', '192.168.4.52', 'e4:3a:6e:3a:7a:9f', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:44', '2026-06-15 02:07:02'),
(2786, 'LEASINGTEMP', 'Unknown', NULL, 'ACCOUNTING', '192.168.10.58', 'b4:2e:99:83:b9:63', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:38', '2026-06-15 02:07:09'),
(2844, 'ACCOUNTING5', 'Unknown', NULL, 'ACCOUNTING', '192.168.0.62', 'b4:2e:99:64:0d:1e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:25', '2026-06-16 02:07:35'),
(2900, 'LPHMLD', 'Unknown', NULL, 'ORIENTAL', '192.168.4.26', '1c:69:7a:a8:40:0e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"135\": \"RPC\", \"445\": \"SMB\"}', 'Windows Workstation', 'offline', '2026-06-18 10:58:29', '2026-06-16 02:07:54'),
(2943, 'DC', 'Unknown', NULL, 'WORKGROUP', '192.168.0.27', '8c:ae:4c:f3:5f:1b', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:23', '2026-06-16 07:20:06'),
(2954, 'PRF4', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.146', '00:19:17:33:c9:ac', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:23', '2026-06-16 07:20:06'),
(2965, 'PRT8', 'Unknown', NULL, 'DEPTSTORE', '192.168.0.137', 'c8:d9:d2:2a:f4:f6', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:23', '2026-06-16 07:20:06'),
(3081, 'B1', 'Unknown', NULL, 'DEPTSTORE', '192.168.10.103', '00:1c:c0:f0:2e:9d', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', '2026-06-16 15:20:42', '2026-06-16 07:20:25'),
(3088, 'AUDITING8', 'Unknown', NULL, 'LEEPLAZA', '192.168.2.41', 'd8:5e:d3:c6:93:18', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', '2026-06-17 10:59:43', '2026-06-16 07:20:26'),
(3243, 'CLP_SERVER', 'Unknown', NULL, 'WORKGROUP', '192.168.0.14', '08:f1:ea:6f:ca:5e', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445,443', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\", \"443\": \"HTTPS\"}', 'Windows Workstation', 'offline', NULL, '2026-06-17 02:59:24'),
(3273, 'HR1', 'Unknown', NULL, 'HR & PERSONNEL', '192.168.0.167', '4c:cc:6a:6d:23:89', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'offline', NULL, '2026-06-17 02:59:25'),
(3329, 'PERSONNEL8', 'Unknown', NULL, 'WORKGROUP', '192.168.1.218', '40:8d:5c:6b:0d:ba', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"445\": \"SMB\", \"135\": \"RPC\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', NULL, '2026-06-17 02:59:35'),
(3365, 'BUYER2', 'Unknown', NULL, 'LEEPLAZA', '192.168.10.201', '18:c0:4d:0a:32:ab', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"135\": \"RPC\", \"445\": \"SMB\", \"139\": \"NetBIOS-SSN\"}', 'Windows Workstation', 'offline', NULL, '2026-06-17 02:59:45'),
(3419, 'BUYER4', 'Unknown', NULL, 'WORKGROUP', '192.168.0.80', 'f4:b5:20:7a:7e:52', '', 'Windows', 'Unknown', '64', 'Unknown', '', 'Unknown', '', '', NULL, NULL, NULL, '135,139,445', '{\"139\": \"NetBIOS-SSN\", \"445\": \"SMB\", \"135\": \"RPC\"}', 'Windows Workstation', 'online', '2026-06-19 10:07:32', '2026-06-18 02:58:18');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `branch_id`, `name`, `location`) VALUES
(1, 1, 'EDP/IT', 'Fifth floor'),
(2, 1, 'HR', 'Floor 2'),
(3, 1, 'Finance', 'Floor 2'),
(4, 1, 'Sales', 'Floor 1'),
(6, 1, 'Marketing', 'Floor 1'),
(7, 1, 'Executive', 'Floor 4'),
(8, 1, 'Bookeeping', '04 Office'),
(9, 1, 'Auditing', 'second floor'),
(10, 1, 'Personnel', 'second floor'),
(11, 1, 'Accounting', '04 Office'),
(12, 1, 'Section Head', '04 Office'),
(13, 1, 'Buyer', '04 Office'),
(14, 2, 'EDP/IT', '01'),
(15, 2, 'General', '01'),
(16, 2, 'HR', '02'),
(17, 2, 'Auditing', '03'),
(18, 2, 'Finance', '03'),
(19, 2, 'Accounting', '04'),
(20, 2, 'Electrical', '03'),
(21, 2, 'Marketing', '03'),
(22, 2, 'Section Head', '04'),
(23, 4, 'EDP/IT', '01'),
(24, 4, 'Accounting', '02'),
(25, 4, 'Auditing', '02'),
(26, 4, 'Finance', '03'),
(27, 4, 'Bookeeping', '03'),
(28, 4, 'Executive', '01'),
(29, 4, 'HR', '02'),
(30, 4, 'Personel', '02'),
(31, 4, 'Electrical', '01'),
(32, 4, 'Architect', '02'),
(33, 1, 'Architect', 'Law Office'),
(34, 1, 'Fast Food', '5th Floor'),
(35, 3, 'EDP/IT', '03'),
(36, 3, 'Accounting', '02'),
(37, 3, 'HR', '01'),
(38, 3, 'Auditing', '02'),
(39, 3, 'Executive', '03'),
(40, 3, 'Finance', '03'),
(42, 3, 'Bookeeping', '03'),
(43, 3, 'Marketing', '025'),
(44, 3, 'Personnel', '02'),
(45, 1, 'Supermarket', '01'),
(46, 4, 'Supermarket', '01'),
(47, 4, 'Fast Food', '04'),
(48, 3, 'Supermarket', '01'),
(49, 3, 'Fast Food', '02'),
(50, 1, 'CWH', NULL),
(51, 5, 'Architecture', '3rd Floor'),
(52, 5, 'Leasing', '3rd floor'),
(53, 5, 'Executive', '01');

-- --------------------------------------------------------

--
-- Table structure for table `department_roles`
--

CREATE TABLE `department_roles` (
  `id` int(11) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `department_name` varchar(100) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department_roles`
--

INSERT INTO `department_roles` (`id`, `department_id`, `department_name`, `role_name`, `created_at`) VALUES
(1, 1, 'EDP', 'IT Technician', '2026-04-26 03:18:24'),
(2, 1, 'EDP', 'Staff', '2026-04-26 03:18:24'),
(3, 1, 'EDP', 'Admin', '2026-04-26 03:18:24'),
(4, 2, 'HR', 'Head/Manager', '2026-04-26 03:18:24'),
(5, 2, 'HR', 'Supervisor', '2026-04-26 03:18:24'),
(6, 2, 'HR', 'Staff', '2026-04-26 03:18:24'),
(7, 3, 'Finance', 'Head/Manager', '2026-04-26 03:18:24'),
(8, 3, 'Finance', 'Staff', '2026-04-26 03:18:24'),
(9, 3, 'Finance', 'Supervisor', '2026-04-26 03:18:24'),
(11, 14, 'EDP', 'Supervisor', '2026-06-18 07:36:45'),
(12, 14, 'EDP - IT Department', 'IT Technician', '2026-06-18 07:37:00'),
(13, 19, 'Accounting', 'Head/Manager', '2026-06-18 07:37:56'),
(14, 19, 'Accounting', 'Supervisor', '2026-06-18 07:38:06'),
(15, 19, 'Accounting', 'Accounting Staff', '2026-06-18 07:38:15'),
(16, 19, 'Accounting', 'Staff', '2026-06-18 07:38:37'),
(17, 17, 'Auditing', 'Head/Manager', '2026-06-18 07:38:53'),
(18, 17, 'Auditing', 'Supervisor', '2026-06-18 07:39:04'),
(19, 17, 'Auditing', 'Auditing Staff', '2026-06-18 07:39:28'),
(20, 20, 'Electrical', 'Supervisor', '2026-06-18 07:40:00'),
(21, 20, 'Electrical', 'Electrian', '2026-06-18 07:40:18'),
(22, 18, 'Finance', 'Head/Manager', '2026-06-18 07:40:31'),
(23, 18, 'Finance', 'Supervisor', '2026-06-18 07:42:08'),
(24, 18, 'Finance', 'Finance Staff', '2026-06-18 07:42:18'),
(25, 15, 'General', 'Branch Manager', '2026-06-18 07:57:14'),
(26, 16, 'HR', 'Head/Manager', '2026-06-18 07:58:15'),
(27, 16, 'HR', 'Supervisor', '2026-06-18 07:58:25'),
(28, 16, 'HR', 'HR Staff', '2026-06-18 07:58:35'),
(29, 21, 'Marketing', 'Head/Manager', '2026-06-18 07:58:50'),
(30, 21, 'Marketing', 'Supervisor', '2026-06-18 07:59:05'),
(31, 21, 'Marketing', 'Marketing Staff', '2026-06-18 07:59:17'),
(32, 11, 'Accounting', 'Head/Manager', '2026-06-18 08:05:37'),
(33, 11, 'Accounting', 'Supervisor', '2026-06-18 08:05:49'),
(34, 11, 'Accounting', 'Staff', '2026-06-18 08:05:59'),
(35, 9, 'Auditing', 'Head/Manager', '2026-06-18 08:06:11'),
(36, 9, 'Auditing', 'Supervisor', '2026-06-18 08:06:24'),
(37, 9, 'Auditing', 'Staff', '2026-06-18 08:06:34'),
(38, 8, 'Bookeeping', 'Head/Manager', '2026-06-18 08:06:48'),
(39, 8, 'Bookeeping', 'Supervisor', '2026-06-18 08:06:56'),
(40, 8, 'Bookeeping', 'Staff', '2026-06-18 08:07:10'),
(41, 13, 'Buyer', 'Head/Manager', '2026-06-18 08:07:27'),
(42, 13, 'Buyer', 'Supervisor', '2026-06-18 08:07:35'),
(43, 13, 'Buyer', 'Staff', '2026-06-18 08:08:00'),
(44, 1, 'EDP', 'Head/Manager', '2026-06-18 08:08:19'),
(45, 1, 'EDP', 'Supervisor', '2026-06-18 08:08:31'),
(46, 7, 'Executive', 'CEO', '2026-06-18 08:10:18'),
(47, 7, 'Executive', 'President', '2026-06-18 08:10:27'),
(48, 7, 'Executive', 'Vice President', '2026-06-18 08:10:37'),
(49, 6, 'Marketing', 'Head/Manager', '2026-06-18 08:13:11'),
(50, 6, 'Marketing', 'Supervisor', '2026-06-18 08:13:18'),
(51, 6, 'Marketing', 'Staff', '2026-06-18 08:13:26'),
(52, 10, 'Personnel', 'Head/Manager', '2026-06-18 08:13:44'),
(53, 10, 'Personnel', 'Supervisor', '2026-06-18 08:13:55'),
(54, 10, 'Personnel', 'Staff', '2026-06-18 08:14:01'),
(55, 4, 'Sales', 'Head/Manager', '2026-06-18 08:16:01'),
(56, 4, 'Sales', 'Supervisor', '2026-06-18 08:16:08'),
(57, 12, 'Section Head', 'Head/Manager', '2026-06-18 08:16:29'),
(58, 12, 'Section Head', 'Supervisor', '2026-06-18 08:17:09'),
(59, 12, 'Section Head', 'Staff', '2026-06-18 08:17:15'),
(60, 7, 'Executive', 'Branch Manager', '2026-06-18 08:17:28'),
(61, 33, 'Architect', 'Head/Manager', '2026-06-18 08:21:41'),
(62, 33, 'Architect', 'Supervisor', '2026-06-18 08:21:48'),
(63, 33, 'Architect', 'Staff', '2026-06-18 08:22:02'),
(64, 34, 'Fast Food Office', 'Head/Manager', '2026-06-18 08:23:32'),
(65, 34, 'Fast Food Office', 'Supervisor', '2026-06-18 08:23:39'),
(66, 34, 'Fast Food Office', 'Staff', '2026-06-18 08:23:45'),
(67, 24, 'Accounting', 'Head/Manager', '2026-06-18 08:24:12'),
(68, 24, 'Accounting', 'Supervisor', '2026-06-18 08:24:19'),
(69, 24, 'Accounting', 'Staff', '2026-06-18 08:24:27'),
(70, 32, 'Architect', 'Head/Manager', '2026-06-18 08:24:46'),
(71, 32, 'Architect', 'Supervisor', '2026-06-18 08:24:53'),
(72, 32, 'Architect', 'Staff', '2026-06-18 08:25:03'),
(73, 25, 'Auditing', 'Head/Manager', '2026-06-18 08:25:14'),
(74, 25, 'Auditing', 'Supervisor', '2026-06-18 08:25:23'),
(75, 25, 'Auditing', 'Staff', '2026-06-18 08:25:28'),
(76, 27, 'Bookeeping', 'Staff', '2026-06-18 08:25:36'),
(77, 27, 'Bookeeping', 'Head/Manager', '2026-06-18 08:25:49'),
(78, 27, 'Bookeeping', 'Supervisor', '2026-06-18 08:25:58'),
(79, 23, 'EDP', 'Supervisor', '2026-06-18 08:26:07'),
(80, 23, 'EDP', 'IT Technician', '2026-06-18 08:26:35'),
(81, 23, 'EDP', 'Head/Manager', '2026-06-18 08:26:55'),
(82, 23, 'EDP', 'Staff', '2026-06-18 08:27:08'),
(83, 14, 'EDP - IT Department', 'Staff', '2026-06-18 08:27:32'),
(84, 31, 'Electrical', 'Supervisor', '2026-06-18 08:27:59'),
(85, 31, 'Electrical', 'Staff', '2026-06-18 08:28:03'),
(86, 28, 'Executive', 'Branch Manager', '2026-06-18 08:28:25'),
(87, 26, 'Finance', 'Head/Manager', '2026-06-18 08:29:06'),
(88, 26, 'Finance', 'Supervisor', '2026-06-18 08:29:20'),
(89, 26, 'Finance', 'Staff', '2026-06-18 08:29:25'),
(90, 29, 'HR', 'Head/Manager', '2026-06-18 08:29:39'),
(91, 29, 'HR', 'Supervisor', '2026-06-18 08:29:51'),
(92, 29, 'HR', 'Staff', '2026-06-18 08:29:56'),
(93, 30, 'Personel', 'Head/Manager', '2026-06-18 08:30:36'),
(94, 30, 'Personel', 'Supervisor', '2026-06-18 08:30:45'),
(95, 30, 'Personel', 'Staff', '2026-06-18 08:30:51'),
(96, 7, 'Executive', 'Management', '2026-06-18 08:31:10'),
(97, 45, 'Supermarket Office', 'Head/Manager', '2026-06-18 08:38:28'),
(98, 45, 'Supermarket Office', 'Supervisor', '2026-06-18 08:38:33'),
(99, 45, 'Supermarket Office', 'Staff', '2026-06-18 08:38:38'),
(100, 46, 'Supermarket', 'Head/Manager', '2026-06-18 08:39:26'),
(101, 46, 'Supermarket', 'Supervisor', '2026-06-18 08:39:32'),
(102, 46, 'Supermarket', 'Staff', '2026-06-18 08:39:36'),
(103, 47, 'Fast Food', 'Head/Manager', '2026-06-18 08:40:15'),
(104, 47, 'Fast Food', 'Supervisor', '2026-06-18 08:40:27'),
(105, 47, 'Fast Food', 'Staff', '2026-06-18 08:40:32'),
(106, 36, 'Accounting', 'Head/Manager', '2026-06-18 08:41:32'),
(107, 36, 'Accounting', 'Supervisor', '2026-06-18 08:41:41'),
(108, 36, 'Accounting', 'Staff', '2026-06-18 08:41:46'),
(109, 38, 'Auditing', 'Head/Manager', '2026-06-18 08:42:01'),
(110, 42, 'Bookeeping', 'Head/Manager', '2026-06-18 08:42:28'),
(111, 38, 'Auditing', 'Supervisor', '2026-06-18 08:42:37'),
(112, 38, 'Auditing', 'Staff', '2026-06-18 08:42:42'),
(113, 42, 'Bookeeping', 'Supervisor', '2026-06-18 08:42:55'),
(114, 42, 'Bookeeping', 'Staff', '2026-06-18 08:43:00'),
(115, 35, 'EDP', 'Head/Manager', '2026-06-18 08:43:18'),
(116, 35, 'EDP', 'Supervisor', '2026-06-18 08:43:29'),
(117, 35, 'EDP', 'IT Technician', '2026-06-18 08:44:04'),
(118, 35, 'EDP', 'Staff', '2026-06-18 08:44:11'),
(119, 39, 'Executive', 'Branch Manager', '2026-06-18 08:44:21'),
(120, 40, 'Finance', 'Head/Manager', '2026-06-18 08:44:37'),
(121, 40, 'Finance', 'Supervisor', '2026-06-18 08:44:46'),
(122, 40, 'Finance', 'Staff', '2026-06-18 08:44:51'),
(123, 37, 'HR', 'Head/Manager', '2026-06-18 08:45:05'),
(124, 37, 'HR', 'Supervisor', '2026-06-18 08:45:13'),
(125, 37, 'HR', 'Staff', '2026-06-18 08:45:19'),
(126, 43, 'Marketing', 'Head/Manager', '2026-06-18 08:45:33'),
(127, 43, 'Marketing', 'Supervisor', '2026-06-18 08:45:41'),
(128, 43, 'Marketing', 'Staff', '2026-06-18 08:45:47'),
(129, 44, 'Personnel', 'Head/Manager', '2026-06-18 08:46:00'),
(130, 44, 'Personnel', 'Supervisor', '2026-06-18 08:46:09'),
(131, 44, 'Personnel', 'Staff', '2026-06-18 08:46:17'),
(132, 48, 'Supermarket', 'Head/Manager', '2026-06-18 08:46:32'),
(133, 48, 'Supermarket', 'Supervisor', '2026-06-18 08:46:40'),
(134, 48, 'Supermarket', 'Staff', '2026-06-18 08:46:46'),
(135, 49, 'Fast Food', 'Head/Manager', '2026-06-18 08:47:56'),
(136, 49, 'Fast Food', 'Supervisor', '2026-06-18 08:48:04'),
(137, 49, 'Fast Food', 'Staff', '2026-06-18 08:48:08'),
(138, 50, 'CWH', 'Head/Manager', '2026-06-18 08:49:04'),
(139, 50, 'CWH', 'Supervisor', '2026-06-18 08:49:09'),
(140, 50, 'CWH', 'Staff', '2026-06-18 08:49:14'),
(141, 51, 'Architect', 'Head/Manager', '2026-06-21 07:57:57'),
(142, 51, 'Architect', 'Supervisor', '2026-06-21 07:58:08'),
(143, 51, 'Architecture', 'Architect', '2026-06-21 07:58:27'),
(144, 52, 'Leasing', 'Head/Manager', '2026-06-21 08:01:57'),
(145, 52, 'Leasing', 'Supervisor', '2026-06-21 08:02:09'),
(146, 52, 'Leasing', 'Staff', '2026-06-21 08:02:19'),
(147, 53, 'Executive', 'CEO', '2026-06-21 08:03:06'),
(148, 53, 'Executive', 'President', '2026-06-21 08:03:16'),
(149, 53, 'Executive', 'Vice President', '2026-06-21 08:03:26'),
(150, 53, 'Executive', 'Branch Manager', '2026-06-21 08:03:50'),
(151, 53, 'Executive', 'Management', '2026-06-21 08:03:59');

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
  `done_name` varchar(100) DEFAULT NULL,
  `done_date` date DEFAULT NULL,
  `submitted_by` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_orders`
--

INSERT INTO `job_orders` (`id`, `job_order_number`, `date`, `company`, `crtk_no`, `date_needed`, `department`, `is_charge`, `is_expense`, `request_dept`, `particulars`, `job_order_for`, `requested_date`, `requested_name`, `approved_name`, `received_date`, `received_name`, `requested_signature`, `approved_signature`, `received_signature`, `done_name`, `done_date`, `submitted_by`, `status`, `created_at`, `updated_at`) VALUES
(1, 'JO-20260507-BMZ8', '2026-05-07', 'Lee Super Plaza', 'CRTL-260507-IHA', '2026-05-13', 'Personnel', 1, 0, 'EDP', 'Replace tonner', 'James Cauzarin', '2026-05-07', 'User Agent', 'Marevel Jumalon', NULL, NULL, 'data:image/png;base64,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', 'data:image/png;base64,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', NULL, NULL, NULL, 1, 'approved', '2026-05-07 08:34:19', '2026-05-07 09:46:44'),
(2, 'JO-20260508-ESDK', '2026-05-08', 'Lee Super Plaza', 'CRTL-260508-8VN', '2026-05-15', 'Personnel', 1, 0, 'Operations', 'Relocate the SMPO3 to Basement..........', 'Jonathan Lopez', '2026-05-08', 'User Agent', 'Marevel Jumalon', '2026-05-08', 'System Administrator', 'data:image/png;base64,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', 'data:image/png;base64,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', NULL, 'System Administrator', '2026-06-14', 1, 'done', '2026-05-08 03:14:47', '2026-06-14 04:06:30');

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
  `branch_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
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

INSERT INTO `new_user` (`id`, `username`, `password`, `fullname`, `role`, `department`, `branch_id`, `department_id`, `email`, `birthdate`, `workDays`, `dayOff`, `workStart`, `workEnd`, `lunchStart`, `lunchEnd`, `leaveEntries`, `avatar_color`, `photo_url`, `registration_key`, `key_used_at`, `is_verified`, `created_at`, `locked_until`, `failed_attempts`) VALUES
(101, 'user', '$2a$10$3rG.TxX5s1.oNRfJR9w4supu007VVHYcf7GxqC5RZafpuUq0fN8wu', 'User Agent', 'staff', 'Personnel', 1, 10, 'clamihoy20@gmail.com', '1899-11-29', '[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]', '[\"Saturday\",\"Sunday\"]', '08:00', '17:00', '12:00', '13:00', NULL, '#e17055', '/uploads/profiles/profile-1777359299502-894214923.png', 'Leeplaza', '2026-04-26 06:47:59', 1, '2026-04-26 06:47:59', NULL, 0),
(105, 'hyper@edp', '$2a$10$DRl6wLMoajC/75Tjo/PcX.RiyZvp2RAdWC/yVbnPRqk4057k80YXi', 'Sample User', 'Supervisor', 'EDP/IT', 2, 14, 'hype.edp@gmail.com', '0000-00-00', '[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]', '[\"Saturday\",\"Sunday\"]', '08:00', '17:00', '12:00', '13:00', NULL, '#4f6ef7', '/uploads/profiles/profile-1781860574568-810344910.png', 'Hyper', '2026-06-19 03:51:06', 1, '2026-06-19 03:51:06', NULL, 0),
(106, 'lp@dipolog', '$2a$10$.F8yfApzp940TZfy0Yp9rOCQVsLln/Doq3epgnBZFRGI3jPB43FfS', 'Sample User', 'Head/Manager', 'HR', 4, 29, 'lpdipoloag@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#4f6ef7', NULL, 'lpdipolog', '2026-06-19 10:25:18', 1, '2026-06-19 10:25:18', NULL, 0),
(107, 'manager', '$2a$10$Z4GGfPqLtqFfEUCm.FfLnuOw5GKlR1mx9X2RfwvRSr7vmAmVKzPLS', 'Branch Manager', 'Branch Manager', 'Executive', 1, 7, 'branch@manager.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#4f6ef7', NULL, 'Leeplaza', '2026-06-21 06:07:43', 1, '2026-06-21 06:07:43', NULL, 0),
(108, 'finance', '$2a$10$r19xovJM1U6PCUPQ2xygcODR48x9ANp8Li.PdlGwbq58d3k0hsDoS', 'Finance Sample User', 'Head/Manager', 'Finance', 1, 3, 'finance@user.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#4f6ef7', NULL, 'Leeplaza', '2026-06-21 06:11:32', 1, '2026-06-21 06:11:32', NULL, 0);

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
  `branch_id` int(11) DEFAULT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registration_keys`
--

INSERT INTO `registration_keys` (`id`, `key_code`, `branch_id`, `used`, `created_at`) VALUES
(2, 'Leeplaza', NULL, 1, '2026-05-05 07:15:07');

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
  `released_name` varchar(255) DEFAULT NULL,
  `released_date` date DEFAULT NULL,
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

INSERT INTO `requisitions` (`id`, `requisition_number`, `ctrl_no`, `request_from`, `attn`, `date`, `remarks`, `status`, `prepared_name`, `prepared_signature`, `prepared_date`, `approved_name`, `approved_signature`, `approved_date`, `released_name`, `released_date`, `items_prepared_name`, `items_prepared_signature`, `items_prepared_date`, `returned_name`, `returned_signature`, `returned_date`, `submitted_by`, `created_at`, `updated_at`) VALUES
(4, 'REQ-20260612-6Z3', NULL, 'Personnel', 'System Administrator', '2026-06-12', 'BVHB', 'released', 'User Agent', 'data:image/png;base64,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', '2026-06-12', 'frgd ,x', 'data:image/png;base64,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', NULL, 'System Administrator', '2026-06-14', 'System Administrator', 'data:image/png;base64,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', '2026-06-12', NULL, NULL, NULL, 1, '2026-06-12 06:39:44', '2026-06-14 03:53:56');

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
(4, 4, 1, 'Backup', 0.00);

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
(3, 'info', 'database_export', 11, 'camihoy96', 'users', 'Database exported', NULL, '192.168.10.250', '2026-06-10 05:58:06'),
(4, 'info', 'database_export', 1, 'EDPtech', 'users', 'Database exported', NULL, '192.168.10.250', '2026-06-12 09:04:17'),
(5, 'info', 'database_export', 1, 'EDPtech', 'users', 'Database exported', NULL, '192.168.10.250', '2026-06-14 10:55:47'),
(6, 'info', 'database_export', 1, 'EDPtech', 'users', 'Database exported', NULL, '192.168.10.250', '2026-06-15 09:52:29');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `settings_key` varchar(100) NOT NULL,
  `settings_value` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `settings_key`, `settings_value`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'branches', '{\"default_branch\": 1}', NULL, '2026-06-16 07:08:14', '2026-06-16 07:08:14'),
(2, 'notification', '[{\"label\":\"New Tickets\",\"description\":\"Notify when new tickets are created\",\"enabled\":true},{\"label\":\"Ticket Assigned\",\"description\":\"Notify when tickets are assigned\",\"enabled\":true},{\"label\":\"Status Changes\",\"description\":\"Notify when ticket status changes\",\"enabled\":true},{\"label\":\"SLA Breaches\",\"description\":\"Notify when SLA deadlines approach\",\"enabled\":true},{\"label\":\"License Expiry\",\"description\":\"Notify when MS licenses expire\",\"enabled\":true}]', 1, '2026-06-16 07:12:38', '2026-06-16 07:12:38'),
(3, 'email', '{\"smtp_server\":\"\",\"smtp_port\":587,\"sender_email\":\"\"}', 1, '2026-06-16 07:12:38', '2026-06-16 07:12:38'),
(4, 'emailTemplates', '{\"new_ticket_subject\":\"🆕 New Ticket Created: #{{ticket_number}}\",\"assigned_subject\":\"📌 Ticket #{{ticket_number}} Assigned to You\",\"resolved_subject\":\"✅ Ticket #{{ticket_number}} Resolved\",\"footer_signature\":\"Thank you,\\nEDPtech Helpdesk Support Team\\nsupport@edptech.com\"}', 1, '2026-06-16 07:12:38', '2026-06-16 07:12:38'),
(5, 'security', '{\"min_password_length\":8,\"password_expiry_days\":90,\"require_special_chars\":true,\"session_timeout\":30,\"max_login_attempts\":5,\"lockout_duration\":15}', 1, '2026-06-16 07:12:38', '2026-06-16 07:21:02'),
(6, 'monitoring', '{\"network_range\":\"192.168.0.0/16\",\"scan_interval\":1,\"auto_scan\":true,\"expiry_alert_days\":30,\"critical_alert_days\":7,\"send_email_alerts\":true,\"auto_mark_offline\":true}', 1, '2026-06-16 07:12:38', '2026-06-16 07:12:38'),
(7, 'appearance', '{\"default_view\":\"list\",\"items_per_page\":25,\"date_format\":\"YYYY-MM-DD\",\"sidebar_default_open\":true,\"show_animations\":true,\"show_priority_widget\":true,\"show_issues_widget\":true,\"show_activity_widget\":true,\"show_requisitions_widget\":true,\"show_joborders_widget\":true}', 1, '2026-06-16 07:12:38', '2026-06-16 07:12:38'),
(8, 'backup', '{\"auto_backup\":\"weekly\",\"backup_time\":\"20:00\",\"backup_location\":\"D:\\\\Backups\\\\\",\"retain_count\":7}', 1, '2026-06-16 07:12:38', '2026-06-16 07:54:09'),
(30, 'general', '{\"company_name\":\"Lee Super Plaza\",\"system_title\":\"EDPtech Helpdesk\",\"contact_email\":\"support@edptech.com\",\"contact_phone\":\"ext. 1234\",\"open_time\":\"08:00\",\"close_time\":\"19:00\",\"default_priority\":\"medium\",\"auto_close_days\":7,\"workingDays\":[{\"name\":\"Mon\",\"selected\":true},{\"name\":\"Tue\",\"selected\":true},{\"name\":\"Wed\",\"selected\":true},{\"name\":\"Thu\",\"selected\":true},{\"name\":\"Fri\",\"selected\":true},{\"name\":\"Sat\",\"selected\":true},{\"name\":\"Sun\",\"selected\":true}]}', 1, '2026-06-16 07:49:24', '2026-06-19 09:37:39'),
(60, 'logo', 'http://192.168.10.250:8000/uploads/logos/logo-1781861794760-445905359.png', 1, '2026-06-19 06:51:38', '2026-06-19 09:37:39');

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
  `assigned_users` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`assigned_users`)),
  `is_major_incident` tinyint(1) DEFAULT 0,
  `reported_via` varchar(50) DEFAULT 'web',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `branch_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
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

INSERT INTO `users` (`id`, `username`, `password`, `fullname`, `role`, `department`, `branch_id`, `department_id`, `email`, `birthdate`, `workDays`, `dayOff`, `workStart`, `workEnd`, `lunchStart`, `lunchEnd`, `leaveEntries`, `avatar_color`, `photo_url`, `registration_key`, `key_used_at`, `is_verified`, `created_at`, `locked_until`, `failed_attempts`) VALUES
(1, 'EDPtech', '$2a$10$BllYyx9WehP5ZTozs/X8guf8vgwWrUTPZVZ856alPInpuP.O8sZdC', 'System Administrator', 'admin', 'IT Department', NULL, NULL, 'admin@edptech.com', '2026-02-08', '[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\",\"Sunday\"]', '[\"Saturday\"]', '08:00', '19:00', '12:00', '13:00', NULL, '#ef4444', '/uploads/profiles/profile-1777357959878-350084720.png', NULL, NULL, 1, '2026-04-12 02:08:30', NULL, 0),
(3, 'jsmith', '$2y$10$WA3UhYRpfoZ98uUcizB6bee3KkhWzucsiuiuknA7tle32tfU9UYYi', 'John Smith', 'user', 'Human Resources', NULL, NULL, 'jsmith@edptech.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#10b981', NULL, NULL, NULL, 0, '2026-04-12 02:08:30', NULL, 0),
(11, 'camihoy96', '$2a$10$ViKJPMqHQNY5hVfI1itq4OXLW1Cy95c/NLajEqSdgmRYCZM09UGAe', 'Charlie Amihoy', 'Technician', 'EDP', NULL, 1, 'camihoy96@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#ffd93d', NULL, 'Leeplaza', '2026-04-26 03:51:27', 1, '2026-04-26 03:51:27', NULL, 0),
(12, 'kyle', '$2a$10$IhQHj9pKb7YY3Xn4Xmnb9OrMDYZjT2laIMsqNf1NAtiNiNudKaLy.', 'Kyle Kuzma', 'Technician', 'EDP', NULL, 1, 'kyle1@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '#e17055', NULL, 'Leeplaza', '2026-04-29 06:25:52', 1, '2026-04-29 06:25:52', NULL, 0),
(13, 'EDP_EL', '$2a$10$JWK589fvX.HY0jv/tO454ezgp0gnTPFZ6Zn58knfzhWmPhTtXSZwa', 'Abrencillo Elisha', 'Technician', 'EDP', NULL, 1, 'elishaabrencillo762@gmail.com', '0000-00-00', '[\"Monday\",\"Tuesday\",\"Wednesday\",\"Thursday\",\"Friday\"]', '[\"Saturday\",\"Sunday\"]', '08:00', '17:00', '12:00', '12:00', NULL, '#6c5ce7', '/uploads/profiles/profile-1781056554398-743387567.jpg', 'Leeplaza', '2026-06-10 01:54:20', 1, '2026-06-10 01:54:20', NULL, 0);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_branch_departments`
-- (See below for the actual view)
--
CREATE TABLE `vw_branch_departments` (
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_branch_users`
-- (See below for the actual view)
--
CREATE TABLE `vw_branch_users` (
);

-- --------------------------------------------------------

--
-- Structure for view `vw_branch_departments`
--
DROP TABLE IF EXISTS `vw_branch_departments`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_branch_departments`  AS SELECT `d`.`id` AS `department_id`, `d`.`name` AS `department_name`, `d`.`location` AS `location`, `b`.`id` AS `branch_id`, `b`.`name` AS `branch_name`, `b`.`code` AS `branch_code` FROM (`departments` `d` left join `branches` `b` on(`d`.`branch_id` = `b`.`id`)) WHERE `d`.`branch_id` is not null ;

-- --------------------------------------------------------

--
-- Structure for view `vw_branch_users`
--
DROP TABLE IF EXISTS `vw_branch_users`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_branch_users`  AS SELECT `u`.`id` AS `user_id`, `u`.`username` AS `username`, `u`.`fullname` AS `fullname`, `u`.`role` AS `role`, `u`.`email` AS `email`, `b`.`id` AS `branch_id`, `b`.`name` AS `branch_name`, `b`.`code` AS `branch_code`, `d`.`id` AS `department_id`, `d`.`name` AS `department_name` FROM ((`users` `u` left join `branches` `b` on(`u`.`branch_id` = `b`.`id`)) left join `departments` `d` on(`u`.`department_id` = `d`.`id`)) ;

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
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `registration_key` (`registration_key`),
  ADD KEY `idx_registration_key` (`registration_key`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_from_username` (`from_username`),
  ADD KEY `idx_to_username` (`to_username`);

--
-- Indexes for table `client_notifications`
--
ALTER TABLE `client_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_user_read` (`user_id`,`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

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
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_department` (`department_id`);

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
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_branch` (`branch_id`),
  ADD KEY `idx_department` (`department_id`);

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
  ADD UNIQUE KEY `key_code` (`key_code`),
  ADD KEY `idx_reg_branch` (`branch_id`);

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
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_branch` (`branch_id`),
  ADD KEY `idx_department` (`department_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assets`
--
ALTER TABLE `assets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `client_notifications`
--
ALTER TABLE `client_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `computer_monitoring`
--
ALTER TABLE `computer_monitoring`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3583;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `department_roles`
--
ALTER TABLE `department_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=152;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `requisition_items`
--
ALTER TABLE `requisition_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `ticket_comments`
--
ALTER TABLE `ticket_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

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
-- Constraints for table `department_roles`
--
ALTER TABLE `department_roles`
  ADD CONSTRAINT `fk_department_roles_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `registration_keys`
--
ALTER TABLE `registration_keys`
  ADD CONSTRAINT `fk_reg_keys_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

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

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
