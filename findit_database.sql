-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 11, 2026 at 11:42 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lost_and_found`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Phone', NULL, '2026-07-06 01:49:06', '2026-07-06 01:49:06'),
(2, 'Wallet', NULL, '2026-07-06 01:49:06', '2026-07-06 01:49:06'),
(3, 'Bag', NULL, '2026-07-06 01:49:06', '2026-07-06 01:49:06'),
(4, 'Keys', NULL, '2026-07-06 01:49:06', '2026-07-06 01:49:06'),
(5, 'ID Card', NULL, '2026-07-06 01:49:06', '2026-07-06 01:49:06'),
(6, 'Documents', NULL, '2026-07-06 01:49:06', '2026-07-06 01:49:06'),
(7, 'Electronics', NULL, '2026-07-06 01:49:06', '2026-07-06 01:49:06'),
(8, 'Clothes', NULL, '2026-07-06 01:49:06', '2026-07-06 01:49:06'),
(9, 'Others', NULL, '2026-07-06 01:49:06', '2026-07-06 01:49:06');

-- --------------------------------------------------------

--
-- Table structure for table `claims`
--

CREATE TABLE `claims` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `community_post_id` bigint(20) UNSIGNED DEFAULT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `proof_description` text NOT NULL,
  `contact_phone` varchar(255) NOT NULL,
  `status` enum('pending','approved','rejected','returned') NOT NULL DEFAULT 'pending',
  `admin_note` text DEFAULT NULL,
  `reviewed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `returned_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `claims`
--

INSERT INTO `claims` (`id`, `item_id`, `community_post_id`, `user_id`, `proof_description`, `contact_phone`, `status`, `admin_note`, `reviewed_by`, `reviewed_at`, `returned_at`, `created_at`, `updated_at`) VALUES
(2, NULL, 15, 2, 'အဲ့ထဲမှာ NRC NO လေးက 9/pol(N)989876 ပါ. ပိုက်ဆံက ၆၀၀၀၀ ပါပါတယ်', '09752618310', 'returned', NULL, NULL, NULL, '2026-08-10 14:18:24', '2026-08-10 12:29:59', '2026-08-10 14:18:24'),
(3, NULL, 20, 7, 'Return completed through a FindIt item conversation.', '09754550228', 'returned', NULL, NULL, '2026-08-11 07:01:30', '2026-08-11 07:01:30', '2026-08-11 07:01:30', '2026-08-11 07:01:30'),
(4, NULL, 19, 7, 'This is my cap . it size is 32.', '09754550228', 'returned', NULL, NULL, NULL, '2026-08-11 07:10:39', '2026-08-11 07:05:06', '2026-08-11 07:10:39'),
(5, NULL, 8, 7, 'hello connect me , it is my bag.', '09754550228', 'returned', NULL, NULL, NULL, '2026-08-11 08:56:11', '2026-08-11 07:27:19', '2026-08-11 08:56:11'),
(6, NULL, 16, 7, 'This is my jacket.', '09754550228', 'returned', NULL, NULL, NULL, '2026-08-11 11:04:14', '2026-08-11 09:58:53', '2026-08-11 11:04:14');

-- --------------------------------------------------------

--
-- Table structure for table `community_posts`
--

CREATE TABLE `community_posts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `post_type` enum('community','lost','found') NOT NULL DEFAULT 'community',
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `item_date` date DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','claimed','returned') NOT NULL DEFAULT 'pending',
  `admin_note` text DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `returned_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `community_posts`
--

INSERT INTO `community_posts` (`id`, `user_id`, `post_type`, `title`, `content`, `category_id`, `location`, `latitude`, `longitude`, `item_date`, `image`, `status`, `admin_note`, `approved_by`, `approved_at`, `rejected_at`, `returned_at`, `created_at`, `updated_at`) VALUES
(3, 2, 'community', 'Community Post', 'Hello', NULL, NULL, NULL, NULL, NULL, 'community-posts/nZfcauVl6sEZjVH5PjtzhqYSp4K5Kh2m5i9aTMfn.jpg', 'approved', NULL, 1, '2026-08-10 07:49:30', NULL, NULL, '2026-07-06 10:14:08', '2026-08-10 07:49:30'),
(4, 2, 'lost', 'Local Brand Tote Bag', 'အနက်ရောင် tote bag လေးကျန်ခဲ့လို့ပါ.', 3, 'Pat Kone Pyaw Bwei Ward, Chanayethazan, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05021, Myanmar', 21.9753957, 96.1038494, '2026-07-09', 'community-posts/ZzxqGs7crL8uVBwr3MBRyUz75zfbfeRFix8h0oXv.jpg', 'approved', NULL, 1, '2026-08-10 12:17:19', NULL, NULL, '2026-07-06 10:15:15', '2026-08-10 12:17:19'),
(8, 6, 'found', 'Gary Bagpack', 'I found the gray backpack', 3, 'Mingalar Mandalay, Myo Thit No (1) Ward, Chanmyathazi, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 0504-0702, Myanmar', 21.9448795, 96.0926495, '2026-08-10', 'community-posts/KJZe7pCzmwOuvzqasPxgc0U3Wi0nFSpJimTSEZ3K.jpg', 'returned', NULL, 1, '2026-08-10 08:19:05', NULL, '2026-08-11 08:56:11', '2026-08-10 08:18:46', '2026-08-11 08:56:11'),
(9, 6, 'found', 'ID card', 'i found ID card.', 5, 'Kan Thar Yar Ward, Chanmyathazi, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05041, Myanmar', 21.9299729, 96.1178903, '2026-08-10', 'community-posts/20cftio2eWhIsAnnNtIN280dMtpYLpCXIgBQfd4C.webp', 'approved', NULL, 1, '2026-08-10 08:22:40', NULL, NULL, '2026-08-10 08:21:36', '2026-08-10 08:22:40'),
(12, 6, 'lost', 'I phone 15 , Black', 'I found the iphone 15 Black Colour near the CoCo Market.', 1, 'Kan Thar Yar Ward, Chanmyathazi, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05041, Myanmar', 21.9299650, 96.1177527, '2026-08-10', 'community-posts/l950mV54TYBa9o7yJQmIov60nNkz7RK8u02uHRgk.jpg', 'approved', NULL, 1, '2026-08-10 10:17:04', NULL, NULL, '2026-08-10 10:16:27', '2026-08-10 10:17:04'),
(13, 7, 'lost', 'Keys', 'I found the keys near the police station.', 4, 'Mandalay, Mandalay City, Mandalay, 05024, Myanmar', 21.9596834, 96.0948743, '2026-08-10', 'community-posts/loicgRRpsdQgyUObWujiLOQQgaWaip2Wcgay3RLu.webp', 'approved', NULL, 1, '2026-08-10 11:30:22', NULL, NULL, '2026-08-10 11:29:16', '2026-08-10 11:30:22'),
(14, 3, 'lost', 'Hyper Bicycles 26 Havoc Mountain Bike', 'I lost the bike near the central point shopping mall. Hyper Bicycles 26 Havoc Mountain Bike. It\'s Black Colour.', 9, 'Central Point Shopping Mall, 62nd Street, Myo Thit No (3) Ward, Chanmyathazi, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05041, Myanmar', 21.9339338, 96.1109250, '2026-08-08', 'community-posts/Yx6wi75yxfysunEgZr4QrgnPNJcmbubjm3rpe1t1.jpg', 'approved', NULL, 1, '2026-08-10 11:44:41', NULL, NULL, '2026-08-10 11:41:55', '2026-08-10 11:44:41'),
(15, 3, 'found', 'Black Wallet', 'Gucci Wallet တစ်လုံး ရှာတွေ့ထားပါတယ်ဗျ. 69 လမ်းနားမှာ ပြူတ်ကျ နေလို့ သိမ်းထားပါတယ်. အထဲ မှာ id card ပါပါတယ်.', 2, '69th Street, Ma Har Nwe Sin Ward, Maha Aungmye, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05071, Myanmar', 21.9596662, 96.1013603, '2026-08-10', 'community-posts/6yxX5egvrpMMQBm6W434IaD4RuKsscKQVkHhtwbS.jpg', 'returned', NULL, 1, '2026-08-10 11:44:46', NULL, '2026-08-10 14:18:24', '2026-08-10 11:44:25', '2026-08-10 14:18:24'),
(16, 3, 'found', 'Blue Jean Jacket', 'ဘုရားကြီးမှာ Blue Jean Jacket တစ်ထည် ရှာတွေ့ထားပါတယ်, အထဲမှာ wallet လည်းပါပါတယ်. wallet ထဲမှာ လည်း id card ပါပါတယ်.', 8, 'Kywe Ser Kan Road, Chan Mya Thar Yar Ward, Pyigyidagun, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 66151, Myanmar', 21.9239411, 96.0824883, '2026-08-10', 'community-posts/mOLcibHrCG8avUvRVKtxCCv0mVQ65fDRd62XICz1.webp', 'returned', NULL, 1, '2026-08-10 11:50:28', NULL, '2026-08-11 11:04:14', '2026-08-10 11:50:09', '2026-08-11 11:04:14'),
(17, 6, 'lost', 'စာရွက်စာတမ်း', 'လမ်းမှာ ဆိုင်ကယ်စိီးရင်း စာရွက်စာတမ်း ပြူတ်ကျခဲလို့ပါ. အရေးကြီးလို့ပါ', 6, '115th Street (Thayawaddy Min Gyi Street), (Kha Gway) Ward, Pyigyidagun, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05041, Myanmar', 21.9222121, 96.1095257, '2026-08-09', 'community-posts/zvHw1oe0rDFH3WiQajLKcgYVvECDht6bVs6eCAuw.jpg', 'approved', NULL, 1, '2026-08-10 12:10:16', NULL, NULL, '2026-08-10 12:09:55', '2026-08-10 12:10:16'),
(18, 8, 'lost', 'Smart Watch', 'ဆိုင်ကယ် စီးရင်းနဲ့ အိတ်ထဲကနေ smart watch လေး ပြုတ်ကျသွားလို့ပါ. အမဲရောင်လေးပါ,Karan Sales T800 Ultra Smart Watch Series 8.', 7, 'HA HA, 76th Street, Maw Ra Gi War Ward, Chanayethazan, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05024, Myanmar', 21.9714470, 96.0903740, '2026-08-07', 'community-posts/UBVdHRiitUW6HZugsOvs5E5ISzC66zOtrmVyEEym.jpg', 'approved', NULL, 1, '2026-08-10 13:49:43', NULL, NULL, '2026-08-10 13:46:26', '2026-08-10 13:49:43'),
(19, 8, 'found', 'Cap', 'ဦးထူတ် အမဲရောင်လေးတစ်လုံ ကောက်ရထားပါတယ်.', 8, '23th Street, Ah Hneik Taw Ward, Aungmyethazan, Aungmyaythazan District, Mandalay, Mandalay City, Mandalay, 05021, Myanmar', 21.9859018, 96.1083126, '2026-08-10', 'community-posts/ckQe4GQOkrLvem5PIQ7wDcLcBokCpanJeNKb7Al2.jpg', 'returned', NULL, 1, '2026-08-10 13:49:46', NULL, '2026-08-11 07:10:39', '2026-08-10 13:48:41', '2026-08-11 07:10:39'),
(20, 8, 'lost', 'Macbook Air (2023)', 'Macbook Air M2 အမဲရောင်လေး ပျောက်သွာလို့ပါ.', 7, '38th Street, Ma Har Myaing (2) Ward, Maha Aungmye, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05071, Myanmar', 21.9628503, 96.1089134, '2026-08-04', 'community-posts/KsSgV8fJt1fcEzJEmo7JIA8J3dRjb7qoI1bFvpaA.jpg', 'returned', NULL, 1, '2026-08-10 13:51:59', NULL, '2026-08-11 07:01:30', '2026-08-10 13:51:51', '2026-08-11 07:01:30'),
(21, 7, 'lost', 'Pink Wallet', 'ပန်းရောင် wallet လေး ပျောက်သွားလို့ပါ. အထဲမှာ ID card လေးက အရေးကြီးလို့ပါ.', 2, 'Yan Myo Lon Ward, Chanayethazan, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05021, Myanmar', 21.9733573, 96.0994720, '2026-08-11', 'community-posts/qMlxI3FcIXFZ1rAclo8ANrHKWxnibAEQhBoB0iX5.jpg', 'approved', NULL, 1, '2026-08-11 00:47:30', NULL, NULL, '2026-08-11 00:46:17', '2026-08-11 00:47:30'),
(22, 7, 'lost', 'Cycle Keys', 'ဆိုင်ကယ် သော့လေး ကျပျောက်သွားလို့ပါ. အိမ်တံခါးသော့ လေးပါ ပါနေလို့ပါ.', 4, '66th Street, Ma Har Myaing (1) Ward, Chanmyathazi, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05041, Myanmar', 21.9522483, 96.1047935, '2026-08-10', 'community-posts/FCr9xiVb8ZbFd0Wfvbon0aACWF8yNlXQhJbqtDFs.jpg', 'approved', 'သော့လေးက ကျပျောက်တာ မှန်ကန်ပါတယ်.', 1, '2026-08-11 03:30:55', NULL, NULL, '2026-08-11 03:29:46', '2026-08-11 03:30:55'),
(23, 7, 'found', 'Men\'s Black Watch', 'i found a black watch .', 9, 'Ma Har Myaing (1) Ward, Maha Aungmye, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05071, Myanmar', 21.9556393, 96.1030769, '2026-08-11', 'community-posts/f5zCMzfJJhm9WzaOfihGUiOd5Lua3gzvnuGYIvOP.webp', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-08-11 03:42:13', '2026-08-11 03:42:13'),
(24, 6, 'found', 'Gucci Black Bag', 'အိတ်အမဲရောင်လေး ရှာတွေလို့ပါ.', 3, 'Hay Ma Mar Lar (South) Ward, Maha Aungmye, Mahaaungmyay District, Mandalay, Mandalay City, Mandalay, 05024, Myanmar', 21.9631065, 96.0926056, '2026-08-10', 'community-posts/Y7tKBWlJoUyhWvhbBy9sRDMtYVBEZRa933Mm9bBp.webp', 'approved', 'အိတ်လေးပျောင်နေပါတယ်. အထဲမှာ ပါတဲ့ အသေးစိတ်လေးကို ပြောပြပြီး cliam လို့ရပါတယ်.', 1, '2026-08-11 10:02:40', NULL, NULL, '2026-08-11 10:01:23', '2026-08-11 10:02:40');

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('pending','in_progress','resolved') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact_messages`
--

INSERT INTO `contact_messages` (`id`, `name`, `email`, `phone`, `subject`, `message`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Charm', 'aungaung@gmail.com', NULL, 'Cap', 'I wanna give back cap for this .', 'resolved', '2026-08-10 06:26:27', '2026-08-11 05:53:02'),
(2, 'Cecilia', 'cecilia@gmail.com', NULL, 'Black Cap', 'I wanna pick up my Black Cap', 'resolved', '2026-08-10 23:11:29', '2026-08-11 05:52:59');

-- --------------------------------------------------------

--
-- Table structure for table `conversation_deletions`
--

CREATE TABLE `conversation_deletions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `participant_id` bigint(20) UNSIGNED NOT NULL,
  `community_post_id` bigint(20) UNSIGNED DEFAULT NULL,
  `item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `deleted_before` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conversation_deletions`
--

INSERT INTO `conversation_deletions` (`id`, `user_id`, `participant_id`, `community_post_id`, `item_id`, `deleted_before`, `created_at`, `updated_at`) VALUES
(1, 3, 2, NULL, NULL, '2026-08-10 14:18:15', '2026-08-10 14:18:15', '2026-08-10 14:18:15'),
(2, 2, 3, NULL, NULL, '2026-08-10 14:19:02', '2026-08-10 14:19:02', '2026-08-10 14:19:02'),
(3, 7, 1, NULL, NULL, '2026-08-11 06:39:15', '2026-08-11 06:39:15', '2026-08-11 06:39:15'),
(4, 6, 7, 8, NULL, '2026-08-11 08:02:37', '2026-08-11 08:02:37', '2026-08-11 08:02:37'),
(5, 8, 1, NULL, NULL, '2026-08-11 12:41:36', '2026-08-11 12:41:36', '2026-08-11 12:41:36'),
(6, 7, 8, 20, NULL, '2026-08-11 13:06:02', '2026-08-11 13:06:02', '2026-08-11 13:06:02');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` varchar(255) NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` enum('lost','found') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `location` varchar(255) NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `item_date` date NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','claimed','returned') NOT NULL DEFAULT 'pending',
  `admin_note` text DEFAULT NULL,
  `approved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `returned_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `user_id`, `category_id`, `type`, `title`, `description`, `location`, `latitude`, `longitude`, `item_date`, `image`, `status`, `admin_note`, `approved_by`, `approved_at`, `rejected_at`, `returned_at`, `created_at`, `updated_at`) VALUES
(1, 3, 3, 'lost', 'Convas', 'Inside the bag , there is a wallet .', 'Near 73 , Mandalay', NULL, NULL, '2026-02-03', 'item-images/FrmbWZa4hNo5aRNukdN0fRddUvitLnlBiztSUa71.jpg', 'approved', 'This is true!', 1, '2026-07-06 09:35:38', NULL, NULL, '2026-07-06 08:53:20', '2026-07-06 09:35:38'),
(2, 3, 8, 'found', 'Gucci', 'Red shirt.', 'Mandalay ,near 73', NULL, NULL, '0026-02-22', 'item-images/jGVeBKuVJxvVlveXSGOBbnopeOCZ4oofeZa72kyn.webp', 'approved', 'this is true!', 1, '2026-07-06 09:38:46', NULL, NULL, '2026-07-06 09:37:48', '2026-07-06 09:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `sender_id` bigint(20) UNSIGNED NOT NULL,
  `receiver_id` bigint(20) UNSIGNED NOT NULL,
  `support_conversation_id` bigint(20) UNSIGNED DEFAULT NULL,
  `item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `community_post_id` bigint(20) UNSIGNED DEFAULT NULL,
  `message` text DEFAULT NULL,
  `attachment_path` varchar(255) DEFAULT NULL,
  `attachment_type` varchar(255) DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `support_conversation_id`, `item_id`, `community_post_id`, `message`, `attachment_path`, `attachment_type`, `attachment_name`, `is_read`, `read_at`, `deleted_at`, `created_at`, `updated_at`) VALUES
(1, 2, 3, NULL, NULL, NULL, 'hello', NULL, NULL, NULL, 1, NULL, NULL, '2026-07-08 02:21:35', '2026-07-08 02:22:41'),
(2, 3, 2, NULL, NULL, NULL, 'hello , nice to meet you!', NULL, NULL, NULL, 1, NULL, NULL, '2026-07-08 02:22:52', '2026-07-08 02:23:09'),
(3, 2, 3, NULL, NULL, NULL, 'nice to meet you', NULL, NULL, NULL, 1, NULL, NULL, '2026-07-08 02:59:58', '2026-07-08 03:01:45'),
(4, 2, 3, NULL, NULL, NULL, 'where are you , now!', NULL, NULL, NULL, 1, NULL, NULL, '2026-07-08 03:00:17', '2026-07-08 03:01:45'),
(5, 3, 2, NULL, NULL, NULL, 'hello', NULL, NULL, NULL, 1, NULL, NULL, '2026-07-08 03:24:41', '2026-08-05 21:04:27'),
(6, 3, 2, NULL, NULL, NULL, 'hello', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-05 21:03:02', '2026-08-05 21:04:27'),
(7, 3, 2, NULL, NULL, NULL, 'how are you', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-05 21:03:08', '2026-08-05 21:04:27'),
(8, 3, 2, NULL, NULL, NULL, 'nice', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-05 21:04:48', '2026-08-05 21:05:03'),
(9, 3, 2, NULL, NULL, NULL, 'hek', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-07 08:25:17', '2026-08-07 08:29:30'),
(10, 3, 2, NULL, NULL, NULL, 'gg', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-07 08:29:05', '2026-08-07 08:29:30'),
(11, 2, 3, NULL, NULL, NULL, 'ff', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-07 08:29:34', '2026-08-07 08:29:37'),
(12, 2, 3, NULL, NULL, NULL, 'ggg', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-07 08:29:41', '2026-08-07 08:36:09'),
(13, 3, 2, NULL, NULL, NULL, 'gg', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-07 08:30:46', '2026-08-10 01:59:47'),
(14, 3, 2, NULL, NULL, NULL, 'gggggfff', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-07 08:30:54', '2026-08-10 01:59:47'),
(15, 2, 3, NULL, NULL, NULL, 'hello', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-07 08:31:00', '2026-08-07 08:36:09'),
(16, 3, 2, NULL, NULL, NULL, 'hello', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-07 08:31:07', '2026-08-10 01:59:47'),
(17, 3, 2, NULL, NULL, NULL, 'Hello', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-09 07:13:44', '2026-08-10 01:59:47'),
(18, 3, 2, NULL, NULL, NULL, 'Nice to meet you', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-09 07:14:03', '2026-08-10 01:59:47'),
(19, 2, 3, NULL, NULL, NULL, 'Hello', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-09 07:14:21', '2026-08-09 07:25:23'),
(20, 3, 2, NULL, NULL, NULL, 'edsfd', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-10 05:05:01', '2026-08-10 13:14:50'),
(21, 6, 3, NULL, NULL, NULL, 'hello', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-10 07:28:44', '2026-08-10 12:31:58'),
(22, 3, 2, NULL, NULL, NULL, 'hello , ပိုက်ဆံအိပ် ပိုင်ရှင်လားဗျ', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-10 13:20:12', '2026-08-10 13:20:34'),
(23, 2, 3, NULL, NULL, NULL, 'ဟူတ်ပါတယ်', NULL, NULL, NULL, 1, NULL, NULL, '2026-08-10 13:20:42', '2026-08-10 13:20:58'),
(24, 2, 3, NULL, NULL, NULL, 'ဟဲလို', NULL, NULL, NULL, 1, '2026-08-10 14:07:22', NULL, '2026-08-10 14:06:42', '2026-08-10 14:07:22'),
(25, 3, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-08-10 14:07:55', '2026-08-10 14:10:25', '2026-08-10 14:06:48', '2026-08-10 14:10:25'),
(26, 2, 3, NULL, NULL, NULL, 'hlloe', NULL, NULL, NULL, 1, '2026-08-10 14:17:06', NULL, '2026-08-10 14:16:37', '2026-08-10 14:17:06'),
(27, 2, 3, NULL, NULL, 15, 'Hello', NULL, NULL, NULL, 1, '2026-08-10 14:17:45', NULL, '2026-08-10 14:17:43', '2026-08-10 14:17:45'),
(28, 2, 7, NULL, NULL, 21, 'hello', NULL, NULL, NULL, 1, '2026-08-11 01:43:54', NULL, '2026-08-11 01:43:51', '2026-08-11 01:43:54'),
(29, 7, 2, NULL, NULL, 21, 'hello', NULL, NULL, NULL, 1, '2026-08-11 01:44:22', NULL, '2026-08-11 01:44:17', '2026-08-11 01:44:22'),
(30, 2, 7, NULL, NULL, 21, 'ပိုက်ဆံအိတ်လေးကောက်ရလို့ပါ', NULL, NULL, NULL, 1, '2026-08-11 01:45:03', NULL, '2026-08-11 01:45:00', '2026-08-11 01:45:03'),
(31, 1, 8, NULL, NULL, NULL, 'Hello', NULL, NULL, NULL, 1, '2026-08-11 07:03:15', NULL, '2026-08-11 03:08:15', '2026-08-11 07:03:15'),
(32, 1, 7, NULL, NULL, NULL, 'Hello', NULL, NULL, NULL, 1, '2026-08-11 03:12:51', NULL, '2026-08-11 03:12:46', '2026-08-11 03:12:51'),
(33, 7, 1, NULL, NULL, NULL, 'hello', NULL, NULL, NULL, 0, NULL, NULL, '2026-08-11 03:13:11', '2026-08-11 03:13:11'),
(34, 7, 8, NULL, NULL, 20, 'hello', NULL, NULL, NULL, 1, '2026-08-11 06:17:52', NULL, '2026-08-11 06:16:25', '2026-08-11 06:17:52'),
(35, 8, 7, NULL, NULL, 20, 'hello', NULL, NULL, NULL, 1, '2026-08-11 06:18:09', NULL, '2026-08-11 06:18:04', '2026-08-11 06:18:09'),
(36, 8, 7, NULL, NULL, 20, 'ok', NULL, NULL, NULL, 1, '2026-08-11 07:02:22', NULL, '2026-08-11 07:01:16', '2026-08-11 07:02:22'),
(37, 8, 7, NULL, NULL, 21, 'hello', NULL, NULL, NULL, 1, '2026-08-11 07:03:49', NULL, '2026-08-11 07:03:42', '2026-08-11 07:03:49'),
(38, 8, 7, NULL, NULL, 19, 'hello', NULL, NULL, NULL, 1, '2026-08-11 07:09:13', NULL, '2026-08-11 07:05:39', '2026-08-11 07:09:13'),
(39, 7, 6, NULL, NULL, 8, 'hello', NULL, NULL, NULL, 1, '2026-08-11 08:02:35', NULL, '2026-08-11 08:01:56', '2026-08-11 08:02:35'),
(40, 6, 7, NULL, NULL, 8, 'hello', NULL, NULL, NULL, 1, '2026-08-11 08:28:19', NULL, '2026-08-11 08:03:28', '2026-08-11 08:28:19'),
(41, 7, 6, NULL, NULL, 8, 'mingalar bar', NULL, NULL, NULL, 1, '2026-08-11 09:50:19', NULL, '2026-08-11 09:50:13', '2026-08-11 09:50:19'),
(42, 7, 6, NULL, NULL, 24, 'hello', NULL, NULL, NULL, 1, '2026-08-11 10:06:21', NULL, '2026-08-11 10:06:10', '2026-08-11 10:06:21'),
(43, 7, 1, 1, NULL, NULL, 'hello', NULL, NULL, NULL, 1, '2026-08-11 11:41:35', NULL, '2026-08-11 11:41:32', '2026-08-11 11:41:35'),
(44, 1, 7, 1, NULL, NULL, 'hello, how can i help you.', NULL, NULL, NULL, 1, '2026-08-11 11:41:58', NULL, '2026-08-11 11:41:53', '2026-08-11 11:41:58'),
(45, 1, 8, NULL, NULL, NULL, 'hello', NULL, NULL, NULL, 1, '2026-08-11 12:41:29', NULL, '2026-08-11 11:44:39', '2026-08-11 12:41:29'),
(46, 1, 7, 1, NULL, NULL, 'good', NULL, NULL, NULL, 1, '2026-08-11 11:53:35', NULL, '2026-08-11 11:53:28', '2026-08-11 11:53:35'),
(47, 7, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-08-11 12:07:21', '2026-08-11 12:38:18', '2026-08-11 12:06:51', '2026-08-11 12:38:18'),
(48, 7, 1, 1, NULL, NULL, 'hello', NULL, NULL, NULL, 1, '2026-08-11 12:07:21', NULL, '2026-08-11 12:06:56', '2026-08-11 12:07:21'),
(49, 7, 1, 1, NULL, NULL, 'hello', NULL, NULL, NULL, 1, '2026-08-11 12:07:21', NULL, '2026-08-11 12:07:02', '2026-08-11 12:07:21'),
(50, 3, 1, 2, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-08-11 12:19:01', '2026-08-11 12:21:23', '2026-08-11 12:14:45', '2026-08-11 12:21:23'),
(51, 1, 7, 1, NULL, NULL, 'This is Ture\n\nContext: Men\'s Black Watch', NULL, NULL, NULL, 1, '2026-08-11 12:40:42', NULL, '2026-08-11 12:40:23', '2026-08-11 12:40:42'),
(52, 1, 3, 2, NULL, NULL, 'Hello', NULL, NULL, NULL, 1, '2026-08-11 13:49:23', NULL, '2026-08-11 12:42:11', '2026-08-11 13:49:23'),
(53, 7, 1, 1, NULL, NULL, 'yes that is true', NULL, NULL, NULL, 1, '2026-08-11 12:46:02', NULL, '2026-08-11 12:44:15', '2026-08-11 12:46:02'),
(54, 1, 7, 1, NULL, NULL, 'Thank You', NULL, NULL, NULL, 1, '2026-08-11 13:42:03', NULL, '2026-08-11 13:41:40', '2026-08-11 13:42:03');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_07_06_000003_create_categories_table', 1),
(5, '2026_07_06_000004_create_items_table', 1),
(6, '2026_07_06_000005_create_claims_table', 1),
(7, '2026_07_06_000006_create_messages_table', 1),
(8, '2026_07_06_000007_create_community_posts_table', 1),
(9, '2026_07_06_000008_create_contact_messages_table', 1),
(10, '2026_07_06_000009_create_activity_logs_table', 1),
(11, '2026_07_06_000010_create_personal_access_tokens_table', 1),
(12, '2026_07_06_000008_add_visibility_fields_to_community_posts_table', 2),
(13, '2026_07_31_000001_update_claims_for_community_posts', 3),
(14, '2026_08_06_000001_extend_claim_and_community_post_statuses', 4),
(15, '2026_08_06_000002_create_user_notifications_table', 5),
(16, '2026_08_07_000001_create_webhook_tables', 6),
(17, '2026_08_10_000001_update_contact_message_statuses', 7),
(18, '2026_08_10_000002_add_coordinates_to_location_tables', 8),
(19, '2026_08_10_000003_create_saved_posts_table', 9),
(20, '2026_08_11_000001_extend_messages_for_phase2_realtime', 10),
(21, '2026_08_11_000002_make_message_text_nullable', 11),
(22, '2026_08_11_000003_add_ban_fields_to_users', 12),
(23, '2026_08_11_000004_add_public_profile_privacy_to_users', 12),
(24, '2026_08_11_000005_create_user_ratings_table', 12),
(25, '2026_08_11_000006_restore_claimed_posts_to_public_approved', 12),
(26, '2026_08_12_000001_create_support_conversations', 13),
(27, '2026_08_12_000002_add_presence_fields_to_users_table', 14);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(4, 'App\\Models\\User', 1, 'findit-auth-token', '485fe2bb923735dbc60a3c4a0c43635f6ffc24c85021291724ededde71dd5846', '[\"*\"]', '2026-07-06 02:45:58', NULL, '2026-07-06 02:45:11', '2026-07-06 02:45:58'),
(5, 'App\\Models\\User', 1, 'findit-auth-token', '09b63dfebc032bb09891b9e3ab865a59887a108bccbe583fb0db2298cc8c668f', '[\"*\"]', '2026-07-06 02:47:03', NULL, '2026-07-06 02:46:47', '2026-07-06 02:47:03'),
(11, 'App\\Models\\User', 3, 'findit-auth-token', '669f9b26a0459d8362cef2a39eee3970b095b762de47580aedf924e730cf115e', '[\"*\"]', '2026-07-06 04:02:00', NULL, '2026-07-06 03:49:17', '2026-07-06 04:02:00'),
(12, 'App\\Models\\User', 1, 'findit-auth-token', '3bc9848d1b4d89eb62c55126c17442563e51251447b959e7810b940ea478180d', '[\"*\"]', '2026-07-08 19:47:30', NULL, '2026-07-06 03:53:07', '2026-07-08 19:47:30'),
(23, 'App\\Models\\User', 1, 'findit-auth-token', 'f66993e2abfdc265a495f0e5f03a6094a7de30691081de3a8a342daf5d449326', '[\"*\"]', NULL, NULL, '2026-07-08 19:22:50', '2026-07-08 19:22:50'),
(24, 'App\\Models\\User', 1, 'findit-auth-token', '0699c7d3b8303321c7f9756b866bde2f62de5beb950543cdb898c2c806b982bc', '[\"*\"]', '2026-07-08 19:30:59', NULL, '2026-07-08 19:23:24', '2026-07-08 19:30:59'),
(26, 'App\\Models\\User', 3, 'findit-auth-token', '0dc1ee3ac90bd6a1e91455231c89fb76a8537222dbfec10c3658ea3a505c90d8', '[\"*\"]', '2026-07-08 19:42:46', NULL, '2026-07-08 19:39:23', '2026-07-08 19:42:46'),
(28, 'App\\Models\\User', 1, 'findit-auth-token', '18af1edab02d6cf7163ba069da9753e37c0a33173634e0f3f5ed353330c1c06e', '[\"*\"]', '2026-07-08 20:00:47', NULL, '2026-07-08 19:48:55', '2026-07-08 20:00:47'),
(32, 'App\\Models\\User', 3, 'findit-auth-token', 'b2427466750ede4c33643994b5cd24618e6fc6caa5b5f1e60f1cd9479a83800d', '[\"*\"]', '2026-07-08 22:41:08', NULL, '2026-07-08 22:19:05', '2026-07-08 22:41:08'),
(34, 'App\\Models\\User', 3, 'findit-auth-token', '95ce3b9b17749a48a4a6642bc9152ffce7098d722a4e931cac4579f6505c7bf9', '[\"*\"]', '2026-07-31 09:54:44', NULL, '2026-07-22 19:23:52', '2026-07-31 09:54:44'),
(38, 'App\\Models\\User', 3, 'findit-auth-token', '0e59df715be172fa4a05a1eb582c062987c9f2f859a58997c6dcef26edd0127b', '[\"*\"]', '2026-08-09 07:27:18', NULL, '2026-08-05 21:04:16', '2026-08-09 07:27:18'),
(40, 'App\\Models\\User', 2, 'findit-auth-token', '2f555e7bce05d3f1c5f98bc21779fd4d7022190e7ffaae79e32374fc63d92012', '[\"*\"]', '2026-08-09 07:25:08', NULL, '2026-08-07 08:29:25', '2026-08-09 07:25:08'),
(41, 'App\\Models\\User', 3, 'findit-auth-token', '7a5a4eb541f3681ab9dce3f51ff6d58b59a272d374d1491a80058af2cc9b2ccb', '[\"*\"]', NULL, NULL, '2026-08-09 07:49:28', '2026-08-09 07:49:28'),
(44, 'App\\Models\\User', 3, 'findit-auth-token', 'eaec21d8e3cb5bac99d576eff4062b22380200602e6cb0087c51dad5d710829f', '[\"*\"]', '2026-08-10 05:30:00', NULL, '2026-08-09 08:08:33', '2026-08-10 05:30:00'),
(46, 'App\\Models\\User', 1, 'findit-auth-token', 'fcaaa3c3b5e22c916b79f1135043bdb0b80272309d8b5bbe1359c15d5e4992fe', '[\"*\"]', '2026-08-10 04:49:58', NULL, '2026-08-10 04:49:40', '2026-08-10 04:49:58'),
(47, 'App\\Models\\User', 5, 'findit-auth-token', '7f34ca4a204a9151d73b77c71b5fd851a8bf5570902d754ba2e82b094cd7d857', '[\"*\"]', '2026-08-10 05:28:20', NULL, '2026-08-10 04:58:01', '2026-08-10 05:28:20'),
(49, 'App\\Models\\User', 6, 'findit-auth-token', 'b610047b1d29dfcfdcf6f4e6900573f6eeb7c970a7e91dabd91ef138736a6826', '[\"*\"]', '2026-08-10 09:07:44', NULL, '2026-08-10 07:20:50', '2026-08-10 09:07:44'),
(52, 'App\\Models\\User', 1, 'findit-auth-token', '3228fbd86667a6f76e8bec85f957fcf951a411c45ad3a12f31500155fb804bcb', '[\"*\"]', '2026-08-10 13:51:59', NULL, '2026-08-10 10:16:54', '2026-08-10 13:51:59'),
(56, 'App\\Models\\User', 2, 'findit-auth-token', '1f7634b28c2a5559e0face53abb73238d36dd6efe844c4d0f44a5b3ab467a5f2', '[\"*\"]', '2026-08-10 14:20:31', NULL, '2026-08-10 12:12:37', '2026-08-10 14:20:31'),
(61, 'App\\Models\\User', 3, 'findit-auth-token', '6658a1b815cbbcaee0664a387876cdbf96f256c54ff138c4ca89a87193365a7e', '[\"*\"]', '2026-08-10 14:20:51', NULL, '2026-08-10 14:16:15', '2026-08-10 14:20:51'),
(68, 'App\\Models\\User', 1, 'findit-auth-token', 'b1fc9c91453f02f0739464a29cb16b7166c04dc6f34fb4669df9080e60ba2d29', '[\"*\"]', '2026-08-11 14:48:28', NULL, '2026-08-11 09:05:05', '2026-08-11 14:48:28'),
(77, 'App\\Models\\User', 3, 'findit-auth-token', '2aac02b2335f312e948510dd2b4c80f4ad0a679e4edb9622610a8670a17a2f7a', '[\"*\"]', '2026-08-11 14:48:30', NULL, '2026-08-11 14:18:43', '2026-08-11 14:48:30'),
(80, 'App\\Models\\User', 1, 'findit-auth-token', '84348a34aa0337787537a3e7201e7b446c33124c4735d1f75dbce1e6e912ec54', '[\"*\"]', '2026-08-11 15:08:09', NULL, '2026-08-11 14:51:09', '2026-08-11 15:08:09');

-- --------------------------------------------------------

--
-- Table structure for table `saved_posts`
--

CREATE TABLE `saved_posts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `community_post_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `saved_posts`
--

INSERT INTO `saved_posts` (`id`, `user_id`, `community_post_id`, `created_at`, `updated_at`) VALUES
(2, 6, 12, '2026-08-10 11:08:24', '2026-08-10 11:08:24'),
(3, 7, 13, '2026-08-10 11:31:13', '2026-08-10 11:31:13'),
(4, 2, 14, '2026-08-10 12:25:26', '2026-08-10 12:25:26'),
(5, 3, 16, '2026-08-10 13:08:52', '2026-08-10 13:08:52');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_conversations`
--

CREATE TABLE `support_conversations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'support',
  `status` varchar(255) NOT NULL DEFAULT 'open',
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `support_conversations`
--

INSERT INTO `support_conversations` (`id`, `user_id`, `admin_id`, `type`, `status`, `resolved_at`, `created_at`, `updated_at`) VALUES
(1, 7, 1, 'support', 'in_progress', NULL, '2026-08-11 11:40:05', '2026-08-11 11:41:53'),
(2, 3, 1, 'support', 'in_progress', NULL, '2026-08-11 11:58:15', '2026-08-11 12:42:11'),
(3, 8, 1, 'support', 'open', NULL, '2026-08-11 12:27:44', '2026-08-11 12:27:44'),
(4, 6, 1, 'support', 'open', NULL, '2026-08-11 14:56:23', '2026-08-11 14:56:23');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `nrc_no` varchar(255) DEFAULT NULL,
  `nrc_front_photo` varchar(255) DEFAULT NULL,
  `nrc_back_photo` varchar(255) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `status` enum('active','disabled','banned') NOT NULL DEFAULT 'active',
  `is_online` tinyint(1) NOT NULL DEFAULT 0,
  `last_seen_at` timestamp NULL DEFAULT NULL,
  `banned_at` timestamp NULL DEFAULT NULL,
  `ban_reason` text DEFAULT NULL,
  `show_phone_publicly` tinyint(1) NOT NULL DEFAULT 0,
  `show_email_publicly` tinyint(1) NOT NULL DEFAULT 0,
  `show_location_publicly` tinyint(1) NOT NULL DEFAULT 0,
  `public_location` varchar(120) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `nrc_no`, `nrc_front_photo`, `nrc_back_photo`, `profile_image`, `email_verified_at`, `password`, `role`, `status`, `is_online`, `last_seen_at`, `banned_at`, `ban_reason`, `show_phone_publicly`, `show_email_publicly`, `show_location_publicly`, `public_location`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'admin@findit.com', NULL, NULL, NULL, NULL, NULL, NULL, '$2y$12$xXBkv.D5B3jj2AEzqqDvNe5EDur/oZXrdTzVfvJ02LzvMik5ukHuG', 'admin', 'active', 1, '2026-08-11 15:08:09', NULL, NULL, 0, 0, 0, NULL, NULL, '2026-07-06 01:49:06', '2026-08-11 15:08:09'),
(2, 'Htet Naing Wai', 'htetnaingwei@gmail.com', '09752618310', '9/POL(N)080575', 'nrc-photos/gmMR4BRgBQSk5qIvHKYU3tnNCux0sFa6zRYIA3F1.jpg', 'nrc-photos/nxSQ2Y5u67AuIrbjR3zhSCpoD1jRRMOPByUwjVfA.jpg', NULL, NULL, '$2y$12$V9MwF1xZPWyjEgXUSYfYR.1uHYFPyOOpFVXm.W3vT8lxDuU74d/Z2', 'user', 'active', 0, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, '2026-07-06 01:51:19', '2026-07-06 02:46:55'),
(3, 'Charm', 'aungaung@gmail.com', '0989978789', '9/PoL(N)93387', 'nrc-photos/qkV81KPeGQ8hJfJedmAaMLSi2M2bEPBxmz84n5Uv.jpg', 'nrc-photos/dDeVRHbAaHuNvAW0n5BED4fCYpiGqIFOfwozvBkZ.jpg', 'profile-images/4Cjyct6m1q2bHTPDqgkghdiLnF2Jt5MRRJKhcROs.png', NULL, '$2y$12$SgPA3im/lWE.Wd6mQFaZ/.C0E0ffGG62xJ.R/1qbcNPlr4EoQM0qi', 'user', 'active', 0, '2026-08-11 15:04:39', NULL, NULL, 0, 0, 0, NULL, NULL, '2026-07-06 02:29:31', '2026-08-11 15:04:39'),
(4, 'Naing Gyi', 'nainggyi@gmail.com', '09098988', '9/pok(n)98989', 'nrc-photos/wjfmy8NUCKHitJUl9fGPzVkhcU5WAVbr7L05weRo.jpg', 'nrc-photos/fFhGWBrw5bMAkuRiq1UraKDeDXUFZZ24AxL9a36Y.jpg', 'profile-images/TiBOI41pFdpT1WrscJjWg7LTAmcj4bSbcVZ3t5u2.jpg', NULL, '$2y$12$m11do574i3aEbhr8Wn8pNO0Ii3dGrZOqR6EoGaLXv8xpyDeEr9Skq', 'user', 'active', 0, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, '2026-07-06 12:09:43', '2026-07-08 02:00:40'),
(6, 'Toe Wai', 'toewai@gmail.com', '09898989898', '9/PPL(N)08738', 'nrc-photos/JTT6uk2kqmw24IEODTThyNKZrizR6wtDHK6qn6wF.jpg', 'nrc-photos/3iiiDFUBl4F4MWSZz5nDNNlkw4uJhXHfr756pfAe.jpg', 'profile-images/GLg5V585WS4g0Lw7wilAXqFXY6GRLNEhuCMOWTUV.png', NULL, '$2y$12$SChqYzbfXVefKNXPBqZajes5bN.TZcrmYHUmSd4fM.jIf12.m8C9y', 'user', 'active', 0, '2026-08-11 15:05:35', NULL, NULL, 0, 0, 0, NULL, NULL, '2026-08-10 07:20:50', '2026-08-11 15:05:35'),
(7, 'Cecilia', 'cecilia@gmail.com', '09754550228', '1/KaAaZa(N)097453', 'nrc-photos/ChOSrkQFQFjayBtzN6GsEofvRqlpWUnUKZfWMqmT.jpg', 'nrc-photos/EZyqt1R7RpuTsrdNb7TE4t755EdloV1L29zbDVDp.jpg', NULL, NULL, '$2y$12$ZC4Rp6tyB5nVTjMfBV243eBeVk/b5VHj.do/clR7pM8VgPNwHFini', 'user', 'active', 0, '2026-08-11 13:48:03', NULL, NULL, 1, 1, 1, NULL, NULL, '2026-08-10 11:27:18', '2026-08-11 13:48:03'),
(8, 'Myo Naing Win', 'myonaingwin@gmail.com', '09876545462', '12/YGN(N)3733', 'nrc-photos/4h8bVrgDdNmXiHVNbD9CVuZWbhZ3vV7leebKaepL.jpg', 'nrc-photos/iU2hf05B7iBSaXABlpOwqHoHJPoQr4PsnU8aIEOO.jpg', 'profile-images/CLqJfytGDhNRAUFgPsLrXxWjQDdnExOHoVUz1VWY.png', NULL, '$2y$12$AZIuC4AnvSzJZLpd7B3xvO1w7bqy23QfblGwfxi43JQLEqV1Y7f2W', 'user', 'active', 0, '2026-08-11 13:40:40', NULL, NULL, 0, 0, 0, NULL, NULL, '2026-08-10 13:42:20', '2026-08-11 13:40:40');

-- --------------------------------------------------------

--
-- Table structure for table `user_notifications`
--

CREATE TABLE `user_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `recipient_user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `detail` text DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_notifications`
--

INSERT INTO `user_notifications` (`id`, `recipient_user_id`, `type`, `title`, `detail`, `data`, `read_at`, `created_at`, `updated_at`) VALUES
(1, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":6,\"sender_id\":3}', '2026-08-05 21:04:22', '2026-08-05 21:03:02', '2026-08-05 21:04:22'),
(2, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":7,\"sender_id\":3}', '2026-08-05 21:04:22', '2026-08-05 21:03:08', '2026-08-05 21:04:22'),
(3, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":8,\"sender_id\":3}', '2026-08-05 21:05:03', '2026-08-05 21:04:48', '2026-08-05 21:05:03'),
(4, 3, 'post_submitted', 'Found post submitted', 'Your post is pending admin review.', '{\"post_id\":6,\"post_type\":\"found\"}', '2026-08-05 21:56:40', '2026-08-05 21:45:21', '2026-08-05 21:56:40'),
(5, 3, 'post_approved', 'Your post was approved', 'Cap is now visible.', '{\"post_id\":6,\"post_type\":\"found\"}', '2026-08-05 21:56:40', '2026-08-05 21:47:52', '2026-08-05 21:56:40'),
(6, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":9,\"sender_id\":3}', '2026-08-07 08:29:27', '2026-08-07 08:25:17', '2026-08-07 08:29:27'),
(7, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":10,\"sender_id\":3}', '2026-08-07 08:29:27', '2026-08-07 08:29:05', '2026-08-07 08:29:27'),
(8, 3, 'message_received', 'New message received', 'Htet Naing Wai sent you a new message.', '{\"message_id\":11,\"sender_id\":2}', '2026-08-07 08:29:37', '2026-08-07 08:29:34', '2026-08-07 08:29:37'),
(9, 3, 'message_received', 'New message received', 'Htet Naing Wai sent you a new message.', '{\"message_id\":12,\"sender_id\":2}', '2026-08-07 08:36:09', '2026-08-07 08:29:41', '2026-08-07 08:36:09'),
(10, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":13,\"sender_id\":3}', '2026-08-07 08:31:18', '2026-08-07 08:30:46', '2026-08-07 08:31:18'),
(11, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":14,\"sender_id\":3}', '2026-08-07 08:31:18', '2026-08-07 08:30:54', '2026-08-07 08:31:18'),
(12, 3, 'message_received', 'New message received', 'Htet Naing Wai sent you a new message.', '{\"message_id\":15,\"sender_id\":2}', '2026-08-07 08:36:09', '2026-08-07 08:31:00', '2026-08-07 08:36:09'),
(13, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":16,\"sender_id\":3}', '2026-08-07 08:31:18', '2026-08-07 08:31:07', '2026-08-07 08:31:18'),
(14, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":17,\"sender_id\":3}', '2026-08-09 08:08:51', '2026-08-09 07:13:44', '2026-08-09 08:08:51'),
(15, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":18,\"sender_id\":3}', '2026-08-09 08:08:51', '2026-08-09 07:14:03', '2026-08-09 08:08:51'),
(16, 3, 'message_received', 'New message received', 'Htet Naing Wai sent you a new message.', '{\"message_id\":19,\"sender_id\":2}', '2026-08-09 07:25:23', '2026-08-09 07:14:21', '2026-08-09 07:25:23'),
(17, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":20,\"sender_id\":3}', '2026-08-10 13:14:50', '2026-08-10 05:05:01', '2026-08-10 13:14:50'),
(18, 3, 'claim_approved', 'Your claim was approved', 'sick has been approved by admin.', '{\"claim_id\":1,\"community_post_id\":5}', '2026-08-10 05:10:03', '2026-08-10 05:05:57', '2026-08-10 05:10:03'),
(19, 2, 'item_claimed', 'A claim was approved for your item', 'Charm has an approved claim for sick.', '{\"claim_id\":1,\"community_post_id\":5}', '2026-08-10 13:20:28', '2026-08-10 05:05:57', '2026-08-10 13:20:28'),
(20, 3, 'item_returned', 'Your claimed item was returned', 'sick has been marked as returned.', '{\"claim_id\":1,\"community_post_id\":5}', '2026-08-10 05:10:03', '2026-08-10 05:06:03', '2026-08-10 05:10:03'),
(21, 2, 'item_returned_owner', 'Your item was marked returned', 'sick has been marked returned by admin.', '{\"claim_id\":1,\"community_post_id\":5}', '2026-08-10 13:20:28', '2026-08-10 05:06:03', '2026-08-10 13:20:28'),
(22, 3, 'message_received', 'New message received', 'Toe Wai sent you a new message.', '{\"message_id\":21,\"sender_id\":6}', '2026-08-10 12:31:58', '2026-08-10 07:28:44', '2026-08-10 12:31:58'),
(23, 6, 'post_submitted', 'Lost post submitted', 'Your post is pending admin review.', '{\"post_id\":7,\"post_type\":\"lost\"}', '2026-08-10 07:44:25', '2026-08-10 07:42:48', '2026-08-10 07:44:25'),
(24, 6, 'post_approved', 'Your post was approved', 'Gray Backpack is now visible.', '{\"post_id\":7,\"post_type\":\"lost\"}', '2026-08-10 07:44:25', '2026-08-10 07:43:14', '2026-08-10 07:44:25'),
(25, 2, 'post_approved', 'Your post was approved', 'Community Post is now visible.', '{\"post_id\":3,\"post_type\":\"community\"}', '2026-08-10 13:20:28', '2026-08-10 07:49:30', '2026-08-10 13:20:28'),
(26, 3, 'post_approved', 'Your post was approved', 'Community Post is now visible.', '{\"post_id\":1,\"post_type\":\"community\"}', '2026-08-11 11:10:35', '2026-08-10 07:49:31', '2026-08-11 11:10:35'),
(27, 6, 'post_submitted', 'Found post submitted', 'Your post is pending admin review.', '{\"post_id\":8,\"post_type\":\"found\"}', '2026-08-10 08:38:00', '2026-08-10 08:18:46', '2026-08-10 08:38:00'),
(28, 6, 'post_approved', 'Your post was approved', 'Gary Bagpack is now visible.', '{\"post_id\":8,\"post_type\":\"found\"}', '2026-08-10 08:38:00', '2026-08-10 08:19:05', '2026-08-10 08:38:00'),
(29, 6, 'post_submitted', 'Found post submitted', 'Your post is pending admin review.', '{\"post_id\":9,\"post_type\":\"found\"}', '2026-08-10 08:38:00', '2026-08-10 08:21:36', '2026-08-10 08:38:00'),
(30, 6, 'post_approved', 'Your post was approved', 'ID card is now visible.', '{\"post_id\":9,\"post_type\":\"found\"}', '2026-08-10 08:38:00', '2026-08-10 08:22:40', '2026-08-10 08:38:00'),
(31, 6, 'post_submitted', 'Lost post submitted', 'Your post is pending admin review.', '{\"post_id\":10,\"post_type\":\"lost\"}', '2026-08-10 10:15:40', '2026-08-10 10:13:41', '2026-08-10 10:15:40'),
(32, 6, 'post_submitted', 'Lost post submitted', 'Your post is pending admin review.', '{\"post_id\":11,\"post_type\":\"lost\"}', '2026-08-10 10:15:40', '2026-08-10 10:14:47', '2026-08-10 10:15:40'),
(33, 6, 'post_submitted', 'Lost post submitted', 'Your post is pending admin review.', '{\"post_id\":12,\"post_type\":\"lost\"}', '2026-08-10 10:56:59', '2026-08-10 10:16:27', '2026-08-10 10:56:59'),
(34, 6, 'post_approved', 'Your post was approved', 'I phone 15 , Black is now visible.', '{\"post_id\":12,\"post_type\":\"lost\"}', '2026-08-10 10:56:59', '2026-08-10 10:17:04', '2026-08-10 10:56:59'),
(35, 6, 'post_approved', 'Your post was approved', 'I phone 15 , Black is now visible.', '{\"post_id\":11,\"post_type\":\"lost\"}', '2026-08-10 10:56:59', '2026-08-10 10:17:07', '2026-08-10 10:56:59'),
(36, 6, 'post_rejected', 'Your post was rejected', 'I phone 15 , Black was rejected by admin.', '{\"post_id\":10,\"post_type\":\"lost\"}', '2026-08-10 10:56:59', '2026-08-10 10:17:17', '2026-08-10 10:56:59'),
(37, 7, 'post_submitted', 'Lost post submitted', 'Your post is pending admin review.', '{\"post_id\":13,\"post_type\":\"lost\"}', '2026-08-10 11:29:38', '2026-08-10 11:29:16', '2026-08-10 11:29:38'),
(38, 7, 'post_approved', 'Your post was approved', 'Keys is now visible.', '{\"post_id\":13,\"post_type\":\"lost\"}', '2026-08-10 21:58:38', '2026-08-10 11:30:22', '2026-08-10 21:58:38'),
(39, 3, 'post_submitted', 'Lost post submitted', 'Your post is pending admin review.', '{\"post_id\":14,\"post_type\":\"lost\"}', '2026-08-11 11:10:35', '2026-08-10 11:41:55', '2026-08-11 11:10:35'),
(40, 3, 'post_submitted', 'Found post submitted', 'Your post is pending admin review.', '{\"post_id\":15,\"post_type\":\"found\"}', '2026-08-11 11:10:35', '2026-08-10 11:44:25', '2026-08-11 11:10:35'),
(41, 3, 'post_approved', 'Your post was approved', 'Hyper Bicycles 26 Havoc Mountain Bike is now visible.', '{\"post_id\":14,\"post_type\":\"lost\"}', '2026-08-11 11:10:35', '2026-08-10 11:44:41', '2026-08-11 11:10:35'),
(42, 3, 'post_approved', 'Your post was approved', 'Black Wallet is now visible.', '{\"post_id\":15,\"post_type\":\"found\"}', '2026-08-11 11:10:35', '2026-08-10 11:44:46', '2026-08-11 11:10:35'),
(43, 3, 'post_submitted', 'Found post submitted', 'Your post is pending admin review.', '{\"post_id\":16,\"post_type\":\"found\"}', '2026-08-11 11:10:35', '2026-08-10 11:50:09', '2026-08-11 11:10:35'),
(44, 3, 'post_approved', 'Your post was approved', 'Blue Jean Jacket is now visible.', '{\"post_id\":16,\"post_type\":\"found\"}', '2026-08-11 11:10:35', '2026-08-10 11:50:28', '2026-08-11 11:10:35'),
(45, 6, 'post_submitted', 'Lost post submitted', 'Your post is pending admin review.', '{\"post_id\":17,\"post_type\":\"lost\"}', '2026-08-11 08:55:53', '2026-08-10 12:09:55', '2026-08-11 08:55:53'),
(46, 6, 'post_approved', 'Your post was approved', 'စာရွက်စာတမ်း is now visible.', '{\"post_id\":17,\"post_type\":\"lost\"}', '2026-08-11 08:55:53', '2026-08-10 12:10:16', '2026-08-11 08:55:53'),
(47, 2, 'post_approved', 'Your post was approved', 'Local Brand Tote Bag is now visible.', '{\"post_id\":4,\"post_type\":\"lost\"}', '2026-08-10 13:20:28', '2026-08-10 12:17:19', '2026-08-10 13:20:28'),
(48, 2, 'post_approved', 'Your post was approved', 'I pad 11 Gen , Pink is now visible.', '{\"post_id\":5,\"post_type\":\"found\"}', '2026-08-10 13:20:28', '2026-08-10 12:17:23', '2026-08-10 13:20:28'),
(49, 2, 'claim_submitted', 'Claim submitted', 'Black Wallet is awaiting admin review.', '{\"claim_id\":2,\"community_post_id\":15}', '2026-08-10 13:20:28', '2026-08-10 12:29:59', '2026-08-10 13:20:28'),
(50, 3, 'claim_received', 'New claim on your found item', 'Htet Naing Wai submitted a claim for Black Wallet.', '{\"claim_id\":2,\"community_post_id\":15,\"claimant_id\":2}', '2026-08-11 11:10:35', '2026-08-10 12:29:59', '2026-08-11 11:10:35'),
(51, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":22,\"sender_id\":3}', '2026-08-10 13:20:28', '2026-08-10 13:20:12', '2026-08-10 13:20:28'),
(52, 3, 'message_received', 'New message received', 'Htet Naing Wai sent you a new message.', '{\"message_id\":23,\"sender_id\":2}', '2026-08-10 13:20:58', '2026-08-10 13:20:42', '2026-08-10 13:20:58'),
(53, 8, 'post_submitted', 'Lost post submitted', 'Your post is pending admin review.', '{\"post_id\":18,\"post_type\":\"lost\"}', NULL, '2026-08-10 13:46:26', '2026-08-10 13:46:26'),
(54, 8, 'post_submitted', 'Found post submitted', 'Your post is pending admin review.', '{\"post_id\":19,\"post_type\":\"found\"}', NULL, '2026-08-10 13:48:41', '2026-08-10 13:48:41'),
(55, 8, 'post_approved', 'Your post was approved', 'Smart Watch is now visible.', '{\"post_id\":18,\"post_type\":\"lost\"}', NULL, '2026-08-10 13:49:43', '2026-08-10 13:49:43'),
(56, 8, 'post_approved', 'Your post was approved', 'Cap is now visible.', '{\"post_id\":19,\"post_type\":\"found\"}', NULL, '2026-08-10 13:49:46', '2026-08-10 13:49:46'),
(57, 8, 'post_submitted', 'Lost post submitted', 'Your post is pending admin review.', '{\"post_id\":20,\"post_type\":\"lost\"}', NULL, '2026-08-10 13:51:51', '2026-08-10 13:51:51'),
(58, 8, 'post_approved', 'Your post was approved', 'Macbook Air (2023) is now visible.', '{\"post_id\":20,\"post_type\":\"lost\"}', NULL, '2026-08-10 13:51:59', '2026-08-10 13:51:59'),
(59, 3, 'message_received', 'New message received', 'Htet Naing Wai sent you a new message.', '{\"message_id\":24,\"sender_id\":2,\"community_post_id\":null,\"item_id\":null}', '2026-08-10 14:07:22', '2026-08-10 14:06:42', '2026-08-10 14:07:22'),
(60, 2, 'message_received', 'New message received', 'Charm sent you a new message.', '{\"message_id\":25,\"sender_id\":3,\"community_post_id\":null,\"item_id\":null}', '2026-08-10 14:07:55', '2026-08-10 14:06:48', '2026-08-10 14:07:55'),
(61, 3, 'message_received', 'New message received', 'Htet Naing Wai sent you a new message.', '{\"message_id\":26,\"sender_id\":2,\"community_post_id\":null,\"item_id\":null}', '2026-08-10 14:17:06', '2026-08-10 14:16:37', '2026-08-10 14:17:06'),
(62, 3, 'message_received', 'New message received', 'Htet Naing Wai sent you a new message.', '{\"message_id\":27,\"sender_id\":2,\"community_post_id\":\"15\",\"item_id\":null}', '2026-08-10 14:17:45', '2026-08-10 14:17:43', '2026-08-10 14:17:45'),
(63, 2, 'item_returned', 'Item returned', 'Black Wallet has been marked as returned.', '{\"claim_id\":2,\"community_post_id\":15,\"finder_id\":3,\"section\":\"my-claims\"}', NULL, '2026-08-10 14:18:24', '2026-08-10 14:18:24'),
(64, 3, 'return_completed', 'Return completed', 'Black Wallet has been recorded as successfully returned.', '{\"claim_id\":2,\"community_post_id\":15,\"claimant_id\":2,\"section\":\"my-found\"}', '2026-08-11 11:10:35', '2026-08-10 14:18:24', '2026-08-11 11:10:35'),
(65, 7, 'post_submitted', 'Lost post submitted', 'Your post is pending admin review.', '{\"post_id\":21,\"post_type\":\"lost\"}', '2026-08-11 01:28:15', '2026-08-11 00:46:17', '2026-08-11 01:28:15'),
(66, 7, 'post_approved', 'Post approved', 'Your Lost item \"Pink Wallet\" has been approved and is now visible.', '{\"post_id\":21,\"post_type\":\"lost\"}', '2026-08-11 01:28:15', '2026-08-11 00:47:30', '2026-08-11 01:28:15'),
(67, 7, 'message_received', 'New message received', 'Htet Naing Wai sent you a new message.', '{\"message_id\":28,\"sender_id\":2,\"community_post_id\":\"21\",\"item_id\":null}', '2026-08-11 01:43:54', '2026-08-11 01:43:51', '2026-08-11 01:43:54'),
(68, 2, 'message_received', 'New message received', 'Cecilia sent you a new message.', '{\"message_id\":29,\"sender_id\":7,\"community_post_id\":\"21\",\"item_id\":null}', '2026-08-11 01:44:22', '2026-08-11 01:44:17', '2026-08-11 01:44:22'),
(69, 7, 'message_received', 'New message received', 'Htet Naing Wai sent you a new message.', '{\"message_id\":30,\"sender_id\":2,\"community_post_id\":\"21\",\"item_id\":null}', '2026-08-11 01:45:03', '2026-08-11 01:45:00', '2026-08-11 01:45:03'),
(70, 8, 'message_received', 'New message received', 'Admin sent you a new message.', '{\"message_id\":31,\"sender_id\":1,\"community_post_id\":null,\"item_id\":null}', '2026-08-11 07:03:15', '2026-08-11 03:08:15', '2026-08-11 07:03:15'),
(71, 7, 'message_received', 'New message received', 'Admin sent you a new message.', '{\"message_id\":32,\"sender_id\":1,\"community_post_id\":null,\"item_id\":null}', '2026-08-11 03:12:51', '2026-08-11 03:12:46', '2026-08-11 03:12:51'),
(72, 1, 'message_received', 'New message received', 'Cecilia sent you a new message.', '{\"message_id\":33,\"sender_id\":7,\"community_post_id\":null,\"item_id\":null}', NULL, '2026-08-11 03:13:11', '2026-08-11 03:13:11'),
(73, 7, 'post_submitted', 'Lost post submitted', 'Your post is pending admin review.', '{\"post_id\":22,\"post_type\":\"lost\"}', '2026-08-11 03:52:23', '2026-08-11 03:29:46', '2026-08-11 03:52:23'),
(74, 7, 'post_approved', 'Post approved', 'Your Lost item \"Cycle Keys\" has been approved and is now visible. Admin feedback: သော့လေးက ကျပျောက်တာ မှန်ကန်ပါတယ်.', '{\"post_id\":22,\"post_type\":\"lost\"}', '2026-08-11 03:52:23', '2026-08-11 03:30:55', '2026-08-11 03:52:23'),
(75, 7, 'post_submitted', 'Found post submitted', 'Your post is pending admin review.', '{\"post_id\":23,\"post_type\":\"found\"}', '2026-08-11 03:52:23', '2026-08-11 03:42:13', '2026-08-11 03:52:23'),
(76, 8, 'message_received', 'New message received', 'Cecilia sent you a new message.', '{\"message_id\":34,\"sender_id\":7,\"community_post_id\":\"20\",\"item_id\":null}', '2026-08-11 06:17:52', '2026-08-11 06:16:25', '2026-08-11 06:17:52'),
(77, 7, 'message_received', 'New message received', 'Myo Naing Win sent you a new message.', '{\"message_id\":35,\"sender_id\":8,\"community_post_id\":\"20\",\"item_id\":null}', '2026-08-11 06:18:09', '2026-08-11 06:18:04', '2026-08-11 06:18:09'),
(78, 7, 'message_received', 'New message received', 'Myo Naing Win sent you a new message.', '{\"message_id\":36,\"sender_id\":8,\"community_post_id\":\"20\",\"item_id\":null}', '2026-08-11 07:02:22', '2026-08-11 07:01:16', '2026-08-11 07:02:22'),
(79, 7, 'item_returned', 'Item returned', 'Macbook Air (2023) has been marked as returned.', '{\"claim_id\":3,\"community_post_id\":20,\"finder_id\":8,\"returned_by\":8,\"section\":\"my-claims\",\"dedupe_key\":\"item_returned:claim:3:recipient:7\"}', '2026-08-11 07:26:23', '2026-08-11 07:01:30', '2026-08-11 07:26:23'),
(80, 8, 'return_completed', 'Return completed', 'Macbook Air (2023) has been recorded as successfully returned.', '{\"claim_id\":3,\"community_post_id\":20,\"claimant_id\":7,\"section\":\"my-lost\",\"dedupe_key\":\"return_completed:claim:3:recipient:8\"}', NULL, '2026-08-11 07:01:30', '2026-08-11 07:01:30'),
(81, 7, 'rating_available', 'Rate your return experience', 'Your return for \"Macbook Air (2023)\" is complete. How was your experience with Myo Naing Win?', '{\"action\":\"rating_available\",\"claim_id\":3,\"community_post_id\":20,\"reviewed_user_id\":8,\"section\":\"my-claims\",\"dedupe_key\":\"rating_available:claim:3:reviewer:7\"}', '2026-08-11 07:26:23', '2026-08-11 07:01:30', '2026-08-11 07:26:23'),
(82, 8, 'rating_available', 'Rate your return experience', 'Your return for \"Macbook Air (2023)\" is complete. How was your experience with Cecilia?', '{\"action\":\"rating_available\",\"claim_id\":3,\"community_post_id\":20,\"reviewed_user_id\":7,\"section\":\"my-lost\",\"dedupe_key\":\"rating_available:claim:3:reviewer:8\"}', NULL, '2026-08-11 07:01:30', '2026-08-11 07:01:30'),
(83, 7, 'message_received', 'New message received', 'Myo Naing Win sent you a new message.', '{\"message_id\":37,\"sender_id\":8,\"community_post_id\":\"21\",\"item_id\":null}', '2026-08-11 07:03:49', '2026-08-11 07:03:42', '2026-08-11 07:03:49'),
(84, 7, 'claim_submitted', 'Claim submitted', 'Cap was sent to the finder for review.', '{\"claim_id\":4,\"community_post_id\":19}', '2026-08-11 07:26:23', '2026-08-11 07:05:06', '2026-08-11 07:26:23'),
(85, 8, 'claim_received', 'New claim received', 'Cecilia submitted a claim for your found item \"Cap\".', '{\"claim_id\":4,\"community_post_id\":19,\"claimant_id\":7,\"section\":\"my-found\"}', NULL, '2026-08-11 07:05:06', '2026-08-11 07:05:06'),
(86, 7, 'message_received', 'New message received', 'Myo Naing Win sent you a new message.', '{\"message_id\":38,\"sender_id\":8,\"community_post_id\":\"19\",\"item_id\":null}', '2026-08-11 07:09:13', '2026-08-11 07:05:39', '2026-08-11 07:09:13'),
(87, 7, 'item_returned', 'Item returned', 'Cap has been marked as returned.', '{\"claim_id\":4,\"community_post_id\":19,\"finder_id\":8,\"returned_by\":8,\"section\":\"my-claims\",\"dedupe_key\":\"item_returned:claim:4:recipient:7\"}', '2026-08-11 07:26:23', '2026-08-11 07:10:39', '2026-08-11 07:26:23'),
(88, 8, 'return_completed', 'Return completed', 'Cap has been recorded as successfully returned.', '{\"claim_id\":4,\"community_post_id\":19,\"claimant_id\":7,\"section\":\"my-found\",\"dedupe_key\":\"return_completed:claim:4:recipient:8\"}', NULL, '2026-08-11 07:10:39', '2026-08-11 07:10:39'),
(89, 7, 'rating_available', 'Rate your return experience', 'Your return for \"Cap\" is complete. How was your experience with Myo Naing Win?', '{\"action\":\"rating_available\",\"claim_id\":4,\"community_post_id\":19,\"reviewed_user_id\":8,\"section\":\"my-claims\",\"dedupe_key\":\"rating_available:claim:4:reviewer:7\"}', '2026-08-11 07:26:23', '2026-08-11 07:10:39', '2026-08-11 07:26:23'),
(90, 8, 'rating_available', 'Rate your return experience', 'Your return for \"Cap\" is complete. How was your experience with Cecilia?', '{\"action\":\"rating_available\",\"claim_id\":4,\"community_post_id\":19,\"reviewed_user_id\":7,\"section\":\"my-found\",\"dedupe_key\":\"rating_available:claim:4:reviewer:8\"}', NULL, '2026-08-11 07:10:39', '2026-08-11 07:10:39'),
(91, 7, 'claim_submitted', 'Claim submitted', 'Gary Bagpack was sent to the finder for review.', '{\"claim_id\":5,\"community_post_id\":8}', '2026-08-11 08:10:01', '2026-08-11 07:27:19', '2026-08-11 08:10:01'),
(92, 6, 'claim_received', 'New claim received', 'Cecilia submitted a claim for your found item \"Gary Bagpack\".', '{\"claim_id\":5,\"community_post_id\":8,\"claimant_id\":7,\"section\":\"my-found\"}', '2026-08-11 08:51:57', '2026-08-11 07:27:19', '2026-08-11 08:51:57'),
(93, 6, 'message_received', 'New message received', 'Cecilia sent you a new message.', '{\"message_id\":39,\"sender_id\":7,\"community_post_id\":\"8\",\"item_id\":null}', '2026-08-11 08:02:35', '2026-08-11 08:01:56', '2026-08-11 08:02:35'),
(94, 7, 'message_received', 'New message received', 'Toe Wai sent you a new message.', '{\"message_id\":40,\"sender_id\":6,\"community_post_id\":\"8\",\"item_id\":null}', '2026-08-11 08:10:01', '2026-08-11 08:03:28', '2026-08-11 08:10:01'),
(95, 7, 'item_returned', 'Item returned', 'Gary Bagpack has been marked as returned.', '{\"claim_id\":5,\"community_post_id\":8,\"returned_by\":6,\"section\":\"my-returns\",\"dedupe_key\":\"item_returned:claim:5:recipient:7\"}', NULL, '2026-08-11 08:56:11', '2026-08-11 08:56:11'),
(96, 6, 'return_completed', 'Return completed', 'Gary Bagpack has been recorded as successfully returned.', '{\"claim_id\":5,\"community_post_id\":8,\"claimant_id\":7,\"section\":\"my-found\",\"dedupe_key\":\"return_completed:claim:5:recipient:6\"}', '2026-08-11 09:57:07', '2026-08-11 08:56:11', '2026-08-11 09:57:07'),
(97, 7, 'rating_available', 'Rate your return experience', 'Your return for \"Gary Bagpack\" is complete. How was your experience with the finder, Toe Wai?', '{\"action\":\"rating_available\",\"claim_id\":5,\"community_post_id\":8,\"reviewed_user_id\":6,\"reviewed_role\":\"finder\",\"section\":\"my-returns\",\"dedupe_key\":\"rating_available:claim:5:reviewer:7\"}', NULL, '2026-08-11 08:56:11', '2026-08-11 08:56:11'),
(98, 6, 'rating_available', 'Rate your return experience', 'Your return for \"Gary Bagpack\" is complete. How was your experience with the owner, Cecilia?', '{\"action\":\"rating_available\",\"claim_id\":5,\"community_post_id\":8,\"reviewed_user_id\":7,\"reviewed_role\":\"owner\",\"section\":\"my-found\",\"dedupe_key\":\"rating_available:claim:5:reviewer:6\"}', '2026-08-11 09:57:07', '2026-08-11 08:56:11', '2026-08-11 09:57:07'),
(99, 7, 'rating_received', 'New review received', 'Toe Wai left you a 3-star rating.', '{\"action\":\"rating_received\",\"rating_id\":1,\"claim_id\":5,\"community_post_id\":8,\"reviewer_id\":6,\"reviewed_user_id\":7,\"section\":\"profile-reviews\",\"dedupe_key\":\"rating_received:rating:1\"}', NULL, '2026-08-11 08:57:09', '2026-08-11 08:57:09'),
(100, 6, 'message_received', 'New message received', 'Cecilia sent you a new message.', '{\"message_id\":41,\"sender_id\":7,\"community_post_id\":\"8\",\"item_id\":null}', '2026-08-11 09:50:19', '2026-08-11 09:50:13', '2026-08-11 09:50:19'),
(101, 7, 'claim_submitted', 'Claim submitted', 'Blue Jean Jacket was sent to the finder for review.', '{\"claim_id\":6,\"community_post_id\":16,\"section\":\"my-returns\"}', NULL, '2026-08-11 09:58:53', '2026-08-11 09:58:53'),
(102, 3, 'claim_received', 'New claim received', 'Cecilia submitted a claim for your found item \"Blue Jean Jacket\".', '{\"claim_id\":6,\"community_post_id\":16,\"claimant_id\":7,\"section\":\"my-found\"}', '2026-08-11 11:10:35', '2026-08-11 09:58:53', '2026-08-11 11:10:35'),
(103, 6, 'post_submitted', 'Found post submitted', 'Your post is pending admin review.', '{\"post_id\":24,\"post_type\":\"found\"}', '2026-08-11 10:07:07', '2026-08-11 10:01:23', '2026-08-11 10:07:07'),
(104, 6, 'post_approved', 'Post approved', 'Your Found item \"Gucci Black Bag\" has been approved and is now visible. Admin feedback: အိတ်လေးပျောင်နေပါတယ်. အထဲမှာ ပါတဲ့ အသေးစိတ်လေးကို ပြောပြပြီး cliam လို့ရပါတယ်.', '{\"post_id\":24,\"post_type\":\"found\"}', '2026-08-11 10:07:07', '2026-08-11 10:02:40', '2026-08-11 10:07:07'),
(105, 6, 'message_received', 'New message received', 'Cecilia sent you a new message.', '{\"message_id\":42,\"sender_id\":7,\"community_post_id\":\"24\",\"item_id\":null}', '2026-08-11 10:06:21', '2026-08-11 10:06:10', '2026-08-11 10:06:21'),
(106, 7, 'item_returned', 'Item returned', 'Blue Jean Jacket has been marked as returned.', '{\"claim_id\":6,\"community_post_id\":16,\"returned_by\":3,\"section\":\"my-returns\",\"dedupe_key\":\"item_returned:claim:6:recipient:7\"}', '2026-08-11 12:59:41', '2026-08-11 11:04:14', '2026-08-11 12:59:41'),
(107, 3, 'return_completed', 'Return completed', 'Blue Jean Jacket has been recorded as successfully returned.', '{\"claim_id\":6,\"community_post_id\":16,\"claimant_id\":7,\"section\":\"my-found\",\"dedupe_key\":\"return_completed:claim:6:recipient:3\"}', '2026-08-11 11:10:35', '2026-08-11 11:04:14', '2026-08-11 11:10:35'),
(108, 7, 'rating_available', 'Rate your return experience', 'Your return for \"Blue Jean Jacket\" is complete. How was your experience with the finder, Charm?', '{\"action\":\"rating_available\",\"claim_id\":6,\"community_post_id\":16,\"reviewed_user_id\":3,\"reviewed_role\":\"finder\",\"section\":\"my-returns\",\"dedupe_key\":\"rating_available:claim:6:reviewer:7\"}', NULL, '2026-08-11 11:04:14', '2026-08-11 11:04:14'),
(109, 3, 'rating_available', 'Rate your return experience', 'Your return for \"Blue Jean Jacket\" is complete. How was your experience with the owner, Cecilia?', '{\"action\":\"rating_available\",\"claim_id\":6,\"community_post_id\":16,\"reviewed_user_id\":7,\"reviewed_role\":\"owner\",\"section\":\"my-found\",\"dedupe_key\":\"rating_available:claim:6:reviewer:3\"}', '2026-08-11 11:10:35', '2026-08-11 11:04:14', '2026-08-11 11:10:35'),
(110, 7, 'rating_received', 'New review received', 'Charm left you a 3-star rating.', '{\"action\":\"rating_received\",\"rating_id\":2,\"claim_id\":6,\"community_post_id\":16,\"reviewer_id\":3,\"reviewed_user_id\":7,\"section\":\"profile-reviews\",\"dedupe_key\":\"rating_received:rating:2\"}', '2026-08-11 12:59:34', '2026-08-11 11:04:29', '2026-08-11 12:59:34'),
(111, 3, 'rating_received', 'New review received', 'Cecilia left you a 4-star rating.', '{\"action\":\"rating_received\",\"rating_id\":3,\"claim_id\":6,\"community_post_id\":16,\"reviewer_id\":7,\"reviewed_user_id\":3,\"section\":\"profile-reviews\",\"dedupe_key\":\"rating_received:rating:3\"}', '2026-08-11 11:10:35', '2026-08-11 11:05:12', '2026-08-11 11:10:35'),
(112, 1, 'support_message_received', 'New support message', 'Cecilia sent a support message.', '{\"support_conversation_id\":1,\"sender_id\":7,\"route\":\"\\/admin\\/contact-messages\"}', NULL, '2026-08-11 11:41:32', '2026-08-11 11:41:32'),
(113, 7, 'support_reply_received', 'Support replied', 'FindIt Admin replied to your support conversation.', '{\"support_conversation_id\":1,\"sender_id\":1,\"route\":\"\\/contact\"}', NULL, '2026-08-11 11:41:53', '2026-08-11 11:41:53'),
(114, 8, 'message_received', 'New message received', 'Admin sent you a new message.', '{\"message_id\":45,\"sender_id\":1,\"community_post_id\":null,\"item_id\":null}', '2026-08-11 12:41:29', '2026-08-11 11:44:39', '2026-08-11 12:41:29'),
(115, 7, 'support_reply_received', 'Support replied', 'FindIt Admin replied to your support conversation.', '{\"support_conversation_id\":1,\"sender_id\":1,\"route\":\"\\/contact\"}', '2026-08-11 12:59:30', '2026-08-11 11:53:28', '2026-08-11 12:59:30'),
(116, 1, 'support_message_received', 'New support message', 'Cecilia sent a support message.', '{\"support_conversation_id\":1,\"sender_id\":7,\"route\":\"\\/admin\\/contact-messages\"}', NULL, '2026-08-11 12:06:51', '2026-08-11 12:06:51'),
(117, 1, 'support_message_received', 'New support message', 'Cecilia sent a support message.', '{\"support_conversation_id\":1,\"sender_id\":7,\"route\":\"\\/admin\\/contact-messages\"}', NULL, '2026-08-11 12:06:56', '2026-08-11 12:06:56'),
(118, 1, 'support_message_received', 'New support message', 'Cecilia sent a support message.', '{\"support_conversation_id\":1,\"sender_id\":7,\"route\":\"\\/admin\\/contact-messages\"}', NULL, '2026-08-11 12:07:02', '2026-08-11 12:07:02'),
(119, 1, 'support_message_received', 'New support message', 'Charm sent a support message.', '{\"support_conversation_id\":2,\"sender_id\":3,\"route\":\"\\/admin\\/contact-messages\"}', NULL, '2026-08-11 12:14:45', '2026-08-11 12:14:45'),
(120, 7, 'support_reply_received', 'Support replied', 'FindIt Admin replied to your support conversation.', '{\"support_conversation_id\":1,\"sender_id\":1,\"route\":\"\\/contact\"}', NULL, '2026-08-11 12:40:23', '2026-08-11 12:40:23'),
(121, 3, 'support_reply_received', 'Support replied', 'FindIt Admin replied to your support conversation.', '{\"support_conversation_id\":2,\"sender_id\":1,\"route\":\"\\/contact\"}', NULL, '2026-08-11 12:42:11', '2026-08-11 12:42:11'),
(122, 1, 'support_message_received', 'New support message', 'Cecilia sent a support message.', '{\"support_conversation_id\":1,\"sender_id\":7,\"route\":\"\\/admin\\/contact-messages\"}', NULL, '2026-08-11 12:44:15', '2026-08-11 12:44:15'),
(123, 8, 'account_banned', 'Account suspended', 'Your account has been suspended by FindIt Admin.', '{\"user_id\":8,\"reason\":null}', NULL, '2026-08-11 12:57:03', '2026-08-11 12:57:03'),
(124, 8, 'account_activated', 'Account reactivated', 'Your FindIt account has been reactivated.', '{\"user_id\":8}', NULL, '2026-08-11 12:57:39', '2026-08-11 12:57:39'),
(125, 7, 'support_reply_received', 'Support replied', 'FindIt Admin replied to your support conversation.', '{\"support_conversation_id\":1,\"sender_id\":1,\"route\":\"\\/contact\"}', NULL, '2026-08-11 13:41:40', '2026-08-11 13:41:40');

-- --------------------------------------------------------

--
-- Table structure for table `user_ratings`
--

CREATE TABLE `user_ratings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `reviewer_id` bigint(20) UNSIGNED NOT NULL,
  `reviewed_user_id` bigint(20) UNSIGNED NOT NULL,
  `community_post_id` bigint(20) UNSIGNED DEFAULT NULL,
  `claim_id` bigint(20) UNSIGNED NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `comment` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_ratings`
--

INSERT INTO `user_ratings` (`id`, `reviewer_id`, `reviewed_user_id`, `community_post_id`, `claim_id`, `rating`, `comment`, `created_at`, `updated_at`) VALUES
(1, 6, 7, 8, 5, 3, 'Thank You', '2026-08-11 08:57:09', '2026-08-11 08:57:09'),
(2, 3, 7, 16, 6, 3, 'She is good person.', '2026-08-11 11:04:29', '2026-08-11 11:04:29'),
(3, 7, 3, 16, 6, 4, 'Thank for helping.', '2026-08-11 11:05:12', '2026-08-11 11:05:12');

-- --------------------------------------------------------

--
-- Table structure for table `webhook_deliveries`
--

CREATE TABLE `webhook_deliveries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `webhook_endpoint_id` bigint(20) UNSIGNED NOT NULL,
  `event_name` varchar(255) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`payload`)),
  `headers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`headers`)),
  `response_status` smallint(5) UNSIGNED DEFAULT NULL,
  `response_body` text DEFAULT NULL,
  `attempts` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `last_attempt_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `failed_at` timestamp NULL DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `webhook_endpoints`
--

CREATE TABLE `webhook_endpoints` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `url` varchar(2048) NOT NULL,
  `secret` varchar(255) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `events` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`events`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_logs_user_id_foreign` (`user_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `claims`
--
ALTER TABLE `claims`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `claims_community_post_id_user_id_unique` (`community_post_id`,`user_id`),
  ADD UNIQUE KEY `claims_item_id_user_id_unique` (`item_id`,`user_id`),
  ADD KEY `claims_user_id_foreign` (`user_id`),
  ADD KEY `claims_reviewed_by_foreign` (`reviewed_by`);

--
-- Indexes for table `community_posts`
--
ALTER TABLE `community_posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `community_posts_user_id_foreign` (`user_id`),
  ADD KEY `community_posts_category_id_foreign` (`category_id`),
  ADD KEY `community_posts_approved_by_foreign` (`approved_by`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `conversation_deletions`
--
ALTER TABLE `conversation_deletions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversation_deletions_participant_id_foreign` (`participant_id`),
  ADD KEY `conversation_deletions_community_post_id_foreign` (`community_post_id`),
  ADD KEY `conversation_deletions_item_id_foreign` (`item_id`),
  ADD KEY `conversation_deletions_user_id_participant_id_index` (`user_id`,`participant_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  ADD KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `items_user_id_foreign` (`user_id`),
  ADD KEY `items_category_id_foreign` (`category_id`),
  ADD KEY `items_approved_by_foreign` (`approved_by`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `messages_sender_id_foreign` (`sender_id`),
  ADD KEY `messages_receiver_id_foreign` (`receiver_id`),
  ADD KEY `messages_item_id_foreign` (`item_id`),
  ADD KEY `messages_community_post_id_foreign` (`community_post_id`),
  ADD KEY `messages_support_conversation_id_foreign` (`support_conversation_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `saved_posts`
--
ALTER TABLE `saved_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `saved_posts_user_id_community_post_id_unique` (`user_id`,`community_post_id`),
  ADD KEY `saved_posts_community_post_id_foreign` (`community_post_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `support_conversations`
--
ALTER TABLE `support_conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `support_conversations_user_id_type_unique` (`user_id`,`type`),
  ADD KEY `support_conversations_admin_id_status_index` (`admin_id`,`status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_notifications_recipient_user_id_foreign` (`recipient_user_id`);

--
-- Indexes for table `user_ratings`
--
ALTER TABLE `user_ratings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_ratings_reviewer_id_claim_id_unique` (`reviewer_id`,`claim_id`),
  ADD KEY `user_ratings_claim_id_foreign` (`claim_id`),
  ADD KEY `user_ratings_reviewed_user_id_index` (`reviewed_user_id`),
  ADD KEY `user_ratings_community_post_id_index` (`community_post_id`),
  ADD KEY `user_ratings_created_at_index` (`created_at`);

--
-- Indexes for table `webhook_deliveries`
--
ALTER TABLE `webhook_deliveries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `webhook_deliveries_webhook_endpoint_id_foreign` (`webhook_endpoint_id`);

--
-- Indexes for table `webhook_endpoints`
--
ALTER TABLE `webhook_endpoints`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `claims`
--
ALTER TABLE `claims`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `community_posts`
--
ALTER TABLE `community_posts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `conversation_deletions`
--
ALTER TABLE `conversation_deletions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT for table `saved_posts`
--
ALTER TABLE `saved_posts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `support_conversations`
--
ALTER TABLE `support_conversations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `user_notifications`
--
ALTER TABLE `user_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=126;

--
-- AUTO_INCREMENT for table `user_ratings`
--
ALTER TABLE `user_ratings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `webhook_deliveries`
--
ALTER TABLE `webhook_deliveries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `webhook_endpoints`
--
ALTER TABLE `webhook_endpoints`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `claims`
--
ALTER TABLE `claims`
  ADD CONSTRAINT `claims_community_post_id_foreign` FOREIGN KEY (`community_post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `claims_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `claims_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `claims_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `community_posts`
--
ALTER TABLE `community_posts`
  ADD CONSTRAINT `community_posts_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `community_posts_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `community_posts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conversation_deletions`
--
ALTER TABLE `conversation_deletions`
  ADD CONSTRAINT `conversation_deletions_community_post_id_foreign` FOREIGN KEY (`community_post_id`) REFERENCES `community_posts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `conversation_deletions_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `conversation_deletions_participant_id_foreign` FOREIGN KEY (`participant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversation_deletions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `items`
--
ALTER TABLE `items`
  ADD CONSTRAINT `items_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `items_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `items_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_community_post_id_foreign` FOREIGN KEY (`community_post_id`) REFERENCES `community_posts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `messages_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `messages_receiver_id_foreign` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_sender_id_foreign` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_support_conversation_id_foreign` FOREIGN KEY (`support_conversation_id`) REFERENCES `support_conversations` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `saved_posts`
--
ALTER TABLE `saved_posts`
  ADD CONSTRAINT `saved_posts_community_post_id_foreign` FOREIGN KEY (`community_post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saved_posts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `support_conversations`
--
ALTER TABLE `support_conversations`
  ADD CONSTRAINT `support_conversations_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `support_conversations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD CONSTRAINT `user_notifications_recipient_user_id_foreign` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_ratings`
--
ALTER TABLE `user_ratings`
  ADD CONSTRAINT `user_ratings_claim_id_foreign` FOREIGN KEY (`claim_id`) REFERENCES `claims` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_ratings_community_post_id_foreign` FOREIGN KEY (`community_post_id`) REFERENCES `community_posts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `user_ratings_reviewed_user_id_foreign` FOREIGN KEY (`reviewed_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_ratings_reviewer_id_foreign` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `webhook_deliveries`
--
ALTER TABLE `webhook_deliveries`
  ADD CONSTRAINT `webhook_deliveries_webhook_endpoint_id_foreign` FOREIGN KEY (`webhook_endpoint_id`) REFERENCES `webhook_endpoints` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
