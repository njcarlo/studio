-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 12, 2026 at 02:48 AM
-- Server version: 8.0.37
-- PHP Version: 8.4.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cogdasma_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `ministry`
--

CREATE TABLE `ministry` (
  `id` int NOT NULL,
  `name` varchar(45) NOT NULL,
  `department_id` int NOT NULL,
  `head_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `ministry`
--

INSERT INTO `ministry` (`id`, `name`, `department_id`, `head_id`) VALUES
(1, 'Crusade', 1, NULL),
(2, 'Arts', 5, 6586),
(3, 'Dance', 1, NULL),
(4, 'Musician', 1, NULL),
(5, 'PMT', 1, NULL),
(6, 'Singers', 1, 580),
(7, 'WhiteLight', 1, NULL),
(8, 'Cluster 1', 2, NULL),
(9, 'Cluster 2', 2, NULL),
(10, 'Cluster 3', 2, NULL),
(11, 'Cluster 4', 2, NULL),
(12, 'Cluster 5', 2, NULL),
(13, 'Cluster 6', 2, NULL),
(14, 'Cluster 7', 2, NULL),
(15, 'Cluster 8', 2, NULL),
(16, 'Cluster 9', 2, NULL),
(17, 'Medical', 2, NULL),
(18, 'WEYJ', 2, NULL),
(19, 'Guest Experience Ministry', 3, NULL),
(20, 'Ladies', 3, NULL),
(21, 'Mens', 3, NULL),
(22, 'Sports', 3, NULL),
(23, 'Ushering', 3, NULL),
(24, 'YA', 3, NULL),
(25, 'Youth Empowered', 3, NULL),
(26, 'CLDP', 4, NULL),
(27, 'Kapehan', 4, NULL),
(28, 'KCA', 4, NULL),
(29, 'KID', 4, NULL),
(30, 'Childrens', 4, NULL),
(31, 'Engineering', 5, NULL),
(32, 'Finance', 5, NULL),
(33, 'In-House Services', 5, NULL),
(36, 'Security and Shuttle', 5, NULL),
(38, 'Linkages', 5, NULL),
(41, 'Pastor', 6, NULL),
(46, 'Technology', 5, NULL),
(47, 'Pastor (Outreach)', 2, NULL),
(48, 'Pastor (Relationship)', 3, NULL),
(49, 'Pastor (Discipleship)', 4, NULL),
(50, 'Pastor (Administration)', 5, NULL),
(53, 'One Liner', 4, NULL),
(54, 'J12', 4, NULL),
(55, 'Ventures', 5, NULL),
(56, 'Fishers of Men', 2, NULL),
(57, 'Music Research & Development', 1, NULL),
(58, 'Audio', 1, NULL),
(59, 'LIFE Institute', 4, NULL),
(60, 'TAPAT', 2, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ministry`
--
ALTER TABLE `ministry`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name_UNIQUE` (`name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ministry`
--
ALTER TABLE `ministry`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
