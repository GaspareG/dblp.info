-- phpMyAdmin SQL Dump
-- version 4.7.4
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jul 06, 2018 at 10:19 AM
-- Server version: 5.5.59-0+deb8u1-log
-- PHP Version: 7.0.28-1~dotdeb+8.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dblp`
--
DROP DATABASE `dblp`;

CREATE DATABASE IF NOT EXISTS `dblp` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;

USE `dblp`;

-- --------------------------------------------------------

--
-- Table structure for table `authors`
--

DROP TABLE IF EXISTS `authors`;
CREATE TABLE `authors` (
  `id` int(11) NOT NULL,
  `name` varchar(256) NOT NULL,
  `affiliation` varchar(256) NOT NULL,
  `website` varchar(1024) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `conferences`
--

DROP TABLE IF EXISTS `conferences`;
CREATE TABLE `conferences` (
  `id` int(11) NOT NULL,
  `tag` varchar(128) NOT NULL,
  `title` varchar(1024) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `journals`
--

DROP TABLE IF EXISTS `journals`;
CREATE TABLE `journals` (
  `id` int(11) NOT NULL,
  `tag` varchar(128) NOT NULL,
  `title` varchar(1024) NOT NULL,
  `link` varchar(2048) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `papers`
--

DROP TABLE IF EXISTS `papers`;
CREATE TABLE `papers` (
  `id` int(11) NOT NULL,
  `tag` varchar(128) NOT NULL,
  `title` varchar(1024) NOT NULL,
  `year` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `present`
--

DROP TABLE IF EXISTS `present`;
CREATE TABLE `present` (
  `idC` int(11) NOT NULL,
  `idP` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `publish`
--

DROP TABLE IF EXISTS `publish`;
CREATE TABLE `publish` (
  `idJ` int(11) NOT NULL,
  `idP` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `wrote`
--

DROP TABLE IF EXISTS `wrote`;
CREATE TABLE `wrote` (
  `idA` int(11) NOT NULL,
  `idP` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `coauthorship`
--

DROP TABLE IF EXISTS `coauthorship`;
CREATE TABLE `coauthorship` (
  `idA1` int(11) NOT NULL,
  `idA2` int(11) NOT NULL,
  `idP` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `authors`
--
ALTER TABLE `authors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `name` (`name`),
  ADD KEY `affiliation` (`affiliation`),
  ADD KEY `website` (`website`);

--
-- Indexes for table `conferences`
--
ALTER TABLE `conferences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tag` (`tag`),
  ADD KEY `title` (`title`);

--
-- Indexes for table `journals`
--
ALTER TABLE `journals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tag` (`tag`),
  ADD KEY `title` (`title`),
  ADD KEY `link` (`link`);

--
-- Indexes for table `papers`
--
ALTER TABLE `papers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tag` (`tag`),
  ADD KEY `title` (`title`),
  ADD KEY `year` (`year`);

--
-- Indexes for table `present`
--
ALTER TABLE `present`
  ADD PRIMARY KEY (`idC`,`idP`),
  ADD KEY `idC` (`idC`),
  ADD KEY `idP` (`idP`);

--
-- Indexes for table `publish`
--
ALTER TABLE `publish`
  ADD PRIMARY KEY (`idJ`,`idP`),
  ADD KEY `idJ` (`idJ`),
  ADD KEY `idP` (`idP`);

--
-- Indexes for table `wrote`
--
ALTER TABLE `wrote`
  ADD PRIMARY KEY (`idA`,`idP`),
  ADD KEY `idA` (`idA`),
  ADD KEY `idP` (`idP`);

--
-- Indexes for table `coauthorship`
--
ALTER TABLE `coauthorship`
  ADD PRIMARY KEY (`idA1`, `idA2`, `idP`),
  ADD KEY `idA1` (`idA1`),
  ADD KEY `idA2` (`idA2`),
  ADD KEY `idP` (`idP`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `present`
--
ALTER TABLE `present`
  ADD CONSTRAINT `present_ibfk_2` FOREIGN KEY (`idP`) REFERENCES `papers` (`id`),
  ADD CONSTRAINT `present_ibfk_1` FOREIGN KEY (`idC`) REFERENCES `conferences` (`id`);

--
-- Constraints for table `publish`
--
ALTER TABLE `publish`
  ADD CONSTRAINT `publish_ibfk_2` FOREIGN KEY (`idP`) REFERENCES `papers` (`id`),
  ADD CONSTRAINT `publish_ibfk_1` FOREIGN KEY (`idJ`) REFERENCES `journals` (`id`);

--
-- Constraints for table `wrote`
--
ALTER TABLE `wrote`
  ADD CONSTRAINT `wrote_ibfk_2` FOREIGN KEY (`idA`) REFERENCES `authors` (`id`),
  ADD CONSTRAINT `wrote_ibfk_1` FOREIGN KEY (`idP`) REFERENCES `papers` (`id`);
COMMIT;

--
-- Constraints for table `coauthorship`
--
ALTER TABLE `coauthorship`
  ADD CONSTRAINT `coauthorship_ibfk_3` FOREIGN KEY (`idA2`) REFERENCES `authors` (`id`),
  ADD CONSTRAINT `coauthorship_ibfk_2` FOREIGN KEY (`idA1`) REFERENCES `authors` (`id`),
  ADD CONSTRAINT `coauthorship_ibfk_1` FOREIGN KEY (`idP`) REFERENCES `papers` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

/*!
SELECT "authors" AS table_name, COUNT(*) AS exact_row_count FROM `dblp`.`authors` UNION
SELECT "coauthorship" AS table_name, COUNT(*) AS exact_row_count FROM `dblp`.`coauthorship` UNION
SELECT "conferences" AS table_name, COUNT(*) AS exact_row_count FROM `dblp`.`conferences` UNION
SELECT "journals" AS table_name, COUNT(*) AS exact_row_count FROM `dblp`.`journals` UNION
SELECT "papers" AS table_name, COUNT(*) AS exact_row_count FROM `dblp`.`papers` UNION
SELECT "present" AS table_name, COUNT(*) AS exact_row_count FROM `dblp`.`present` UNION
SELECT "publish" AS table_name, COUNT(*) AS exact_row_count FROM `dblp`.`publish` UNION
SELECT "wrote" AS table_name, COUNT(*) AS exact_row_count FROM `dblp`.`wrote`;
*/;
