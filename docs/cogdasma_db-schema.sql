-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 13, 2026 at 08:08 PM
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
-- Table structure for table `action_history`
--

CREATE TABLE `action_history` (
  `id` int NOT NULL,
  `ah_type_id` int NOT NULL,
  `ah_mapping_id` int NOT NULL COMMENT 'ID of service request, work order or other action history type',
  `actor_id` int NOT NULL,
  `action_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `action` varchar(50) NOT NULL,
  `detail` varchar(1000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `action_history_view`
-- (See below for the actual view)
--
CREATE TABLE `action_history_view` (
`action` varchar(50)
,`action_date` datetime
,`actor_first_name` varchar(45)
,`actor_full_name` varchar(91)
,`actor_id` int
,`actor_last_name` varchar(45)
,`ah_mapping_id` int
,`ah_type` varchar(30)
,`ah_type_code` varchar(30)
,`ah_type_id` int
,`detail` varchar(1000)
,`id` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `admin_approver_view`
-- (See below for the actual view)
--
CREATE TABLE `admin_approver_view` (
`approver_id` int
,`email` varchar(45)
,`first_name` varchar(45)
,`id` int
,`last_name` varchar(45)
,`level` varchar(45)
,`name` varchar(91)
);

-- --------------------------------------------------------

--
-- Table structure for table `ah_type`
--

CREATE TABLE `ah_type` (
  `id` int NOT NULL,
  `ah_type` varchar(30) NOT NULL,
  `ah_code` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `all_active_mentors`
-- (See below for the actual view)
--
CREATE TABLE `all_active_mentors` (
`id` int
,`ministry` varchar(45)
,`name` varchar(91)
,`status` varchar(6)
);

-- --------------------------------------------------------

--
-- Table structure for table `approver`
--

CREATE TABLE `approver` (
  `id` int NOT NULL,
  `worker_id` int NOT NULL,
  `level` varchar(45) NOT NULL,
  `ministry_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Stand-in structure for view `approver_view`
-- (See below for the actual view)
--
CREATE TABLE `approver_view` (
`approver_id` int
,`department_id` int
,`email` varchar(45)
,`first_name` varchar(45)
,`id` int
,`last_name` varchar(45)
,`level` varchar(45)
,`ministry_id` int
,`name` varchar(91)
);

-- --------------------------------------------------------

--
-- Table structure for table `area`
--

CREATE TABLE `area` (
  `id` int NOT NULL,
  `name` varchar(45) NOT NULL,
  `short_name` varchar(45) NOT NULL,
  `sys_create_id` int NOT NULL DEFAULT '0',
  `sys_create_date` datetime DEFAULT NULL,
  `sys_update_id` int NOT NULL DEFAULT '0',
  `sys_update_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int NOT NULL,
  `table_name` varchar(100) DEFAULT NULL,
  `action_type` enum('UPDATE','DELETE') DEFAULT NULL,
  `record_id` int DEFAULT NULL,
  `old_values` text,
  `new_values` text,
  `sys_update_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `c2s_attendance_report_view`
-- (See below for the actual view)
--
CREATE TABLE `c2s_attendance_report_view` (
`availability_day` varchar(20)
,`availability_time_id` int
,`category_id` int
,`category_name` varchar(100)
,`contact_number` varchar(45)
,`department_id` int
,`department_name` varchar(45)
,`group_id` int
,`group_name` varchar(200)
,`is_mentor` varchar(3)
,`last_attended_date` datetime
,`mentor_id` int
,`mentor_name` varchar(91)
,`ministry_id` int
,`ministry_name` varchar(45)
,`name` varchar(91)
,`schedule` varchar(100)
,`zoom_link` varchar(100)
,`zoom_link_id` int
);

-- --------------------------------------------------------

--
-- Table structure for table `c2s_ci_sessions`
--

CREATE TABLE `c2s_ci_sessions` (
  `id` varchar(128) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `timestamp` int UNSIGNED NOT NULL DEFAULT '0',
  `data` blob NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `c2s_group`
--

CREATE TABLE `c2s_group` (
  `id` int NOT NULL,
  `mentor_id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `group_type` int NOT NULL DEFAULT '0',
  `status` varchar(20) NOT NULL DEFAULT '',
  `sys_create_by` int DEFAULT NULL,
  `sys_create_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `sys_update_by` int DEFAULT NULL,
  `sys_update_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `c2s_group_summary_view`
-- (See below for the actual view)
--
CREATE TABLE `c2s_group_summary_view` (
`department_id` int
,`department_name` varchar(45)
,`first_name` varchar(45)
,`group_type` int
,`id` int
,`last_name` varchar(45)
,`mentor_id` int
,`mentor_name` varchar(91)
,`ministry_name` varchar(45)
,`name` varchar(200)
,`status` varchar(20)
,`sys_create_by` int
,`sys_create_date` datetime
,`sys_update_by` int
,`sys_update_date` datetime
);

-- --------------------------------------------------------

--
-- Table structure for table `c2s_keys`
--

CREATE TABLE `c2s_keys` (
  `id` int NOT NULL,
  `key` varchar(40) NOT NULL,
  `level` int NOT NULL,
  `ignore_limits` tinyint(1) NOT NULL DEFAULT '0',
  `date_created` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `c2s_online_category`
--

CREATE TABLE `c2s_online_category` (
  `id` int NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `category_type` int NOT NULL DEFAULT '0',
  `sys_create_by` int DEFAULT NULL,
  `sys_create_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `sys_update_by` int DEFAULT NULL,
  `sys_update_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `c2s_online_group_details`
--

CREATE TABLE `c2s_online_group_details` (
  `id` int NOT NULL,
  `group_id` int NOT NULL,
  `availability_day` varchar(20) NOT NULL,
  `availability_time_id` int NOT NULL,
  `category_id` int NOT NULL,
  `zoom_link_id` int NOT NULL,
  `last_attended_date` datetime DEFAULT NULL,
  `sys_create_by` int DEFAULT NULL,
  `sys_create_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `sys_update_by` int DEFAULT NULL,
  `sys_update_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `c2s_online_group_view`
-- (See below for the actual view)
--
CREATE TABLE `c2s_online_group_view` (
`availability_day` varchar(20)
,`availability_time_id` int
,`category_id` int
,`category_name` varchar(100)
,`current_mentee` bigint
,`first_name` varchar(45)
,`group_count` bigint
,`group_id` int
,`group_type` int
,`id` int
,`last_attended_date` datetime
,`last_name` varchar(45)
,`mentor_id` int
,`mentor_name` varchar(91)
,`mobile` varchar(45)
,`name` varchar(200)
,`schedule` varchar(100)
,`status` varchar(20)
,`sys_create_by` int
,`sys_create_date` datetime
,`sys_update_by` int
,`sys_update_date` datetime
,`zoom_id` int
,`zoom_link` varchar(100)
,`zoom_link_id` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `c2s_online_mentee_view`
-- (See below for the actual view)
--
CREATE TABLE `c2s_online_mentee_view` (
`availability_day` varchar(20)
,`availability_time_id` int
,`c2s_group_id` int
,`c2s_manual_status` varchar(45)
,`c2s_manual_update` varchar(255)
,`category_id` int
,`category_name` varchar(100)
,`connection_type` varchar(45)
,`connection_year` int
,`contact` varchar(45)
,`first_name` varchar(45)
,`group_id` int
,`group_name` varchar(200)
,`group_type` int
,`id` int
,`is_inactive_date` varchar(255)
,`last_attended_date` datetime
,`last_name` varchar(45)
,`mentee_created_date` varchar(73)
,`mentor_id` int
,`mentor_name` varchar(91)
,`mobile` varchar(45)
,`name` varchar(45)
,`registered_by` varchar(20)
,`schedule` varchar(100)
,`sys_create_by` int
,`sys_create_date` datetime
,`sys_update_by` int
,`sys_update_date` datetime
,`worker_id` int
,`zoom_link` varchar(100)
,`zoom_link_id` int
);

-- --------------------------------------------------------

--
-- Table structure for table `c2s_online_report`
--

CREATE TABLE `c2s_online_report` (
  `id` int NOT NULL,
  `report_name` varchar(200) NOT NULL,
  `sort_order` int NOT NULL,
  `sys_create_by` int DEFAULT NULL,
  `sys_create_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `sys_update_by` int DEFAULT NULL,
  `sys_update_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `c2s_online_schedule`
--

CREATE TABLE `c2s_online_schedule` (
  `id` int NOT NULL,
  `day` varchar(20) NOT NULL,
  `schedule` varchar(100) NOT NULL,
  `weight` int NOT NULL,
  `del_flag` bit(1) NOT NULL DEFAULT b'0',
  `sys_create_by` int DEFAULT NULL,
  `sys_create_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `sys_update_by` int DEFAULT NULL,
  `sys_update_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `c2s_online_zoom_link`
--

CREATE TABLE `c2s_online_zoom_link` (
  `id` int NOT NULL,
  `zoom_link` varchar(100) NOT NULL,
  `capacity` int NOT NULL,
  `sys_create_by` int DEFAULT NULL,
  `sys_create_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `sys_update_by` int DEFAULT NULL,
  `sys_update_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `core_leader_approver_view`
-- (See below for the actual view)
--
CREATE TABLE `core_leader_approver_view` (
`approver_id` int
,`department` varchar(45)
,`department_id` int
,`email` varchar(45)
,`first_name` varchar(45)
,`id` int
,`last_name` varchar(45)
,`level` varchar(45)
,`ministry` varchar(45)
,`ministry_id` int
,`name` varchar(91)
);

-- --------------------------------------------------------

--
-- Table structure for table `deactivated_logs`
--

CREATE TABLE `deactivated_logs` (
  `id` int NOT NULL,
  `type` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `department`
--

CREATE TABLE `department` (
  `id` int NOT NULL,
  `name` varchar(45) NOT NULL,
  `head_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Stand-in structure for view `department_approver_view`
-- (See below for the actual view)
--
CREATE TABLE `department_approver_view` (
`approver_id` int
,`department` varchar(45)
,`department_id` int
,`email` varchar(45)
,`first_name` varchar(45)
,`id` int
,`last_name` varchar(45)
,`level` varchar(45)
,`name` varchar(91)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `department_view`
-- (See below for the actual view)
--
CREATE TABLE `department_view` (
`department` varchar(45)
,`head_first_name` varchar(45)
,`head_full_name` varchar(91)
,`head_id` int
,`head_last_name` varchar(45)
,`id` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `drs_view`
-- (See below for the actual view)
--
CREATE TABLE `drs_view` (
`end` datetime
,`id` int
,`purpose` varchar(100)
,`start` datetime
,`venue_short_name` varchar(45)
);

-- --------------------------------------------------------

--
-- Table structure for table `email_job`
--

CREATE TABLE `email_job` (
  `id` int NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email_to` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `body` varchar(10000) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `sys_create_id` int NOT NULL,
  `sys_create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_update_id` int NOT NULL,
  `sys_update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `equipment`
--

CREATE TABLE `equipment` (
  `id` int NOT NULL,
  `type` varchar(45) NOT NULL COMMENT '	',
  `name` varchar(45) NOT NULL,
  `status` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `facilitator`
--

CREATE TABLE `facilitator` (
  `id` int NOT NULL,
  `worker_id` int NOT NULL,
  `user_type` varchar(20) NOT NULL DEFAULT 'User',
  `last_login_date` datetime DEFAULT NULL,
  `sys_create_by` int DEFAULT NULL,
  `sys_create_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `sys_update_by` int DEFAULT NULL,
  `sys_update_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `facilitator_ci_sessions`
--

CREATE TABLE `facilitator_ci_sessions` (
  `id` varchar(40) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `timestamp` int UNSIGNED NOT NULL DEFAULT '0',
  `data` blob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `health_checklist`
--

CREATE TABLE `health_checklist` (
  `id` int NOT NULL,
  `worker_pass_id` int DEFAULT NULL,
  `worker_name` varchar(100) NOT NULL,
  `worker_type` varchar(10) NOT NULL,
  `fever` bit(1) NOT NULL DEFAULT b'0',
  `sore_throat` bit(1) NOT NULL DEFAULT b'0',
  `body_pains` bit(1) NOT NULL DEFAULT b'0',
  `headache` bit(1) NOT NULL DEFAULT b'0',
  `breath` bit(1) NOT NULL DEFAULT b'0',
  `colds` bit(1) NOT NULL DEFAULT b'0',
  `have_worked_with_suspected` bit(1) NOT NULL DEFAULT b'0',
  `have_contact` bit(1) NOT NULL DEFAULT b'0',
  `have_travel` bit(1) NOT NULL DEFAULT b'0',
  `hospital` int DEFAULT NULL,
  `leisure` int DEFAULT NULL,
  `social` int DEFAULT NULL,
  `sports` int DEFAULT NULL,
  `reunion` int DEFAULT NULL,
  `have_preexisting_condition` bit(1) NOT NULL DEFAULT b'0',
  `specify_preexisting_condition` varchar(150) DEFAULT NULL,
  `increased_cases_in_brgy` bit(1) NOT NULL DEFAULT b'0',
  `case_details` varchar(150) DEFAULT NULL,
  `result` varchar(20) NOT NULL DEFAULT 'FAILED',
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `antigen` bit(1) DEFAULT NULL,
  `covid_positive` bit(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hr_attendance_scan`
--

CREATE TABLE `hr_attendance_scan` (
  `id` int NOT NULL,
  `worker_id` int NOT NULL,
  `scanner_site_id` int NOT NULL,
  `date_scanned` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Triggers `hr_attendance_scan`
--
DELIMITER $$
CREATE TRIGGER `before_hr_scan_update` BEFORE UPDATE ON `hr_attendance_scan` FOR EACH ROW INSERT INTO audit_logs (table_name, action_type, record_id, old_values, new_values)
    VALUES (
        'hr_attendance_scan',
        'UPDATE',
        OLD.id,
        CONCAT('worker_id: ', OLD.worker_id, ', scanner_site_id: ', OLD.scanner_site_id, ', date_scanned: ', OLD.date_scanned),
        CONCAT('worker_id: ', NEW.worker_id, ', scanner_site_id: ', NEW.scanner_site_id, ', date_scanned: ', NEW.date_scanned)
    )
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `hr_attendance_scan_view`
-- (See below for the actual view)
--
CREATE TABLE `hr_attendance_scan_view` (
`date_scanned` datetime
,`id` int
,`scanner_site_id` int
,`scanner_site_name` varchar(100)
,`worker_first_name` varchar(45)
,`worker_full_name` varchar(91)
,`worker_id` int
,`worker_last_name` varchar(45)
,`worker_type` varchar(50)
);

-- --------------------------------------------------------

--
-- Table structure for table `hr_scanner_site`
--

CREATE TABLE `hr_scanner_site` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `auth_code` varchar(30) NOT NULL,
  `sys_create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `login_history`
--

CREATE TABLE `login_history` (
  `id` int NOT NULL,
  `login_date` datetime NOT NULL,
  `worker_id` int NOT NULL COMMENT '	',
  `result` varchar(45) NOT NULL,
  `platform` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `login_history_c2s`
--

CREATE TABLE `login_history_c2s` (
  `id` int NOT NULL,
  `login_date` varchar(255) NOT NULL,
  `worker_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `result` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Stand-in structure for view `login_history_view`
-- (See below for the actual view)
--
CREATE TABLE `login_history_view` (
`department` varchar(45)
,`first_name` varchar(45)
,`id` int
,`last_name` varchar(45)
,`login_date` datetime
,`ministry` varchar(45)
,`platform` varchar(45)
,`result` varchar(45)
,`worker_id` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `masterview_view`
-- (See below for the actual view)
--
CREATE TABLE `masterview_view` (
`area_id` int
,`audio_equipment_ids` text
,`audio_equipments` text
,`end` datetime
,`id` int
,`multimedia_equipment_ids` text
,`multimedia_equipments` text
,`pax` int
,`purpose` varchar(100)
,`requestor_mobile` varchar(45)
,`requestor_name` varchar(91)
,`setup_chairs` int
,`setup_tables` int
,`special_instructions` varchar(500)
,`start` datetime
,`venue` varchar(45)
,`venue_id` int
);

-- --------------------------------------------------------

--
-- Table structure for table `mentee`
--

CREATE TABLE `mentee` (
  `id` int NOT NULL,
  `worker_id` int NOT NULL,
  `group_id` int DEFAULT NULL,
  `name` varchar(45) DEFAULT NULL,
  `contact` varchar(45) DEFAULT NULL,
  `connection_type` varchar(45) NOT NULL DEFAULT 'Please specify type',
  `connection_year` int DEFAULT NULL,
  `c2s_manual_status` varchar(45) NOT NULL,
  `c2s_manual_update` varchar(255) DEFAULT NULL,
  `last_attended_date` datetime DEFAULT NULL,
  `registered_by` varchar(20) NOT NULL DEFAULT 'Mentor',
  `sys_create_by` int DEFAULT NULL,
  `sys_create_date` datetime DEFAULT NULL,
  `sys_update_by` int DEFAULT NULL,
  `sys_update_date` datetime DEFAULT NULL,
  `is_inactive_date` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `mentees_by_department`
-- (See below for the actual view)
--
CREATE TABLE `mentees_by_department` (
`connection_type` varchar(45)
,`count` bigint
,`department` varchar(45)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `mentees_summary_view`
-- (See below for the actual view)
--
CREATE TABLE `mentees_summary_view` (
`c2s_group_id` int
,`c2s_manual_status` varchar(45)
,`c2s_manual_update` varchar(255)
,`connection_type` varchar(45)
,`connection_year` int
,`contact` varchar(45)
,`department_id` int
,`department_name` varchar(45)
,`first_name` varchar(45)
,`group_id` int
,`group_name` varchar(200)
,`group_type` int
,`id` int
,`is_inactive_date` varchar(255)
,`last_attended_date` datetime
,`last_name` varchar(45)
,`mentor_id` int
,`mentor_name` varchar(91)
,`ministry_id` int
,`ministry_name` varchar(45)
,`mobile` varchar(45)
,`name` varchar(45)
,`registered_by` varchar(20)
,`sys_create_by` int
,`sys_create_date` datetime
,`sys_update_by` int
,`sys_update_date` datetime
,`worker_id` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `mentors_by_department`
-- (See below for the actual view)
--
CREATE TABLE `mentors_by_department` (
`count` bigint
,`department` varchar(45)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `mentors_report_view`
-- (See below for the actual view)
--
CREATE TABLE `mentors_report_view` (
`department_id` int
,`department_name` varchar(45)
,`f2f_group_count` bigint
,`f2f_mentee_count` bigint
,`mentor_id` int
,`mentor_name` varchar(91)
,`ministry_id` int
,`ministry_name` varchar(45)
,`online_group_count` bigint
,`online_mentee_count` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `mentors_summary_view`
-- (See below for the actual view)
--
CREATE TABLE `mentors_summary_view` (
`address` varchar(200)
,`area_id` tinyint(1)
,`birthdate` date
,`church_id` int
,`department_id` int
,`department_name` varchar(45)
,`email` varchar(45)
,`facebook_handle` varchar(45)
,`first_name` varchar(45)
,`flag` varchar(45)
,`id` int
,`last_name` varchar(45)
,`ministry_id` int
,`ministry_name` varchar(45)
,`mobile` varchar(45)
,`password` varchar(45)
,`remarks` varchar(255)
,`sec_ministry_id` int
,`start_month` varchar(15)
,`start_year` varchar(4)
,`status` varchar(45)
,`sys_create_date` datetime
,`sys_create_id` int
,`sys_update_date` datetime
,`sys_update_id` int
,`type` varchar(45)
,`username` varchar(45)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `mentor_mentee_all_in_view`
-- (See below for the actual view)
--
CREATE TABLE `mentor_mentee_all_in_view` (
`C2S Manual Status` varchar(45)
,`Connection Type` varchar(45)
,`Department` varchar(45)
,`is_inactive_date` varchar(255)
,`Mentee` varchar(45)
,`Ministry` varchar(45)
,`Name` varchar(91)
,`Worker ID` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `mentor_mentee_status_all`
-- (See below for the actual view)
--
CREATE TABLE `mentor_mentee_status_all` (
`Department` varchar(45)
,`Mentee` varchar(45)
,`MenteeStatus` varchar(8)
,`Mentor` varchar(91)
,`MentorStatus` varchar(8)
,`Ministry` varchar(45)
,`Worker ID` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `mentor_mentee_view`
-- (See below for the actual view)
--
CREATE TABLE `mentor_mentee_view` (
`Department` varchar(45)
,`Mentee` varchar(45)
,`Ministry` varchar(45)
,`Name` varchar(91)
,`Worker ID` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `mentor_status`
-- (See below for the actual view)
--
CREATE TABLE `mentor_status` (
`Count` bigint
,`id` int
,`Mentor` varchar(91)
);

-- --------------------------------------------------------

--
-- Table structure for table `message_template`
--

CREATE TABLE `message_template` (
  `id` int NOT NULL,
  `template_type` varchar(30) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'EMAIL or SMS, etc',
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `path` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `subject` varchar(250) COLLATE utf8mb4_general_ci NOT NULL,
  `sys_create_id` int NOT NULL DEFAULT '4200',
  `sys_create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_update_id` int NOT NULL DEFAULT '4200',
  `sys_update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

-- --------------------------------------------------------

--
-- Stand-in structure for view `ministry_approver_view`
-- (See below for the actual view)
--
CREATE TABLE `ministry_approver_view` (
`approver_id` int
,`department` varchar(45)
,`department_id` int
,`email` varchar(45)
,`first_name` varchar(45)
,`id` int
,`last_name` varchar(45)
,`level` varchar(45)
,`ministry` varchar(45)
,`ministry_id` int
,`name` varchar(91)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `ministry_view`
-- (See below for the actual view)
--
CREATE TABLE `ministry_view` (
`department` varchar(45)
,`department_id` int
,`head_full_name` varchar(91)
,`head_id` int
,`id` int
,`ministry` varchar(45)
);

-- --------------------------------------------------------

--
-- Table structure for table `ms_assignment`
--

CREATE TABLE `ms_assignment` (
  `id` int NOT NULL,
  `schedule_date` date NOT NULL,
  `worker_id` int NOT NULL,
  `allotted` int NOT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Stand-in structure for view `ms_assignment_view`
-- (See below for the actual view)
--
CREATE TABLE `ms_assignment_view` (
`allotted` int
,`created_at` datetime
,`created_by` int
,`id` int
,`ministry_id` int
,`scans` bigint
,`schedule_date` date
,`worker_id` int
);

-- --------------------------------------------------------

--
-- Table structure for table `ms_canteen`
--

CREATE TABLE `ms_canteen` (
  `id` int NOT NULL,
  `name` varchar(30) NOT NULL,
  `password` varchar(100) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ms_canteens`
--

CREATE TABLE `ms_canteens` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orientation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `canteen_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ms_canteen_back`
--

CREATE TABLE `ms_canteen_back` (
  `id` int NOT NULL,
  `name` varchar(30) NOT NULL,
  `password` varchar(100) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ms_dept_setting`
--

CREATE TABLE `ms_dept_setting` (
  `id` int NOT NULL,
  `department_id` int NOT NULL,
  `allotted` int NOT NULL,
  `version` int NOT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ms_min_setting`
--

CREATE TABLE `ms_min_setting` (
  `id` int NOT NULL,
  `ms_dept_setting_id` int NOT NULL,
  `ministry_id` int NOT NULL,
  `allotted` int NOT NULL,
  `version` int NOT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ms_scan`
--

CREATE TABLE `ms_scan` (
  `id` int NOT NULL,
  `date_scanned` datetime NOT NULL,
  `worker_id` int NOT NULL,
  `result` varchar(20) NOT NULL,
  `remarks` varchar(200) DEFAULT NULL,
  `canteen_id` int NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Stand-in structure for view `ms_scan_view`
-- (See below for the actual view)
--
CREATE TABLE `ms_scan_view` (
`canteen` varchar(255)
,`canteen_id` int
,`date_scanned` datetime
,`department` varchar(45)
,`department_id` int
,`id` int
,`ministry` varchar(45)
,`ministry_id` int
,`remarks` varchar(200)
,`result` varchar(20)
,`worker_id` int
,`worker_name` varchar(91)
,`worker_type` varchar(50)
);

-- --------------------------------------------------------

--
-- Table structure for table `online_mentee_registration`
--

CREATE TABLE `online_mentee_registration` (
  `id` int NOT NULL,
  `mentee_id` int NOT NULL DEFAULT '0',
  `name` varchar(200) NOT NULL,
  `mobile` varchar(50) NOT NULL,
  `email` varchar(200) NOT NULL,
  `age` int NOT NULL DEFAULT '0',
  `gender` varchar(10) NOT NULL DEFAULT '',
  `occupation` varchar(200) DEFAULT NULL,
  `church` varchar(200) DEFAULT NULL,
  `availability_day` varchar(20) NOT NULL,
  `availability_time_id` int NOT NULL,
  `category_id` int NOT NULL,
  `have_existing_c2s_group` bit(1) NOT NULL DEFAULT b'0',
  `suggested_mentor_name` varchar(200) NOT NULL DEFAULT '',
  `sms_sent` bit(1) NOT NULL DEFAULT b'0',
  `sys_create_by` int DEFAULT NULL,
  `sys_create_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `sys_update_by` int DEFAULT NULL,
  `sys_update_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `online_mentee_registration_view`
-- (See below for the actual view)
--
CREATE TABLE `online_mentee_registration_view` (
`age` int
,`availability_day` varchar(20)
,`availability_time_id` int
,`category_id` int
,`category_name` varchar(100)
,`church` varchar(200)
,`email` varchar(200)
,`gender` varchar(10)
,`have_existing_c2s_group` bit(1)
,`id` int
,`mentee_id` int
,`mobile` varchar(50)
,`name` varchar(200)
,`occupation` varchar(200)
,`registration_date` varchar(84)
,`schedule` varchar(100)
,`sms_sent` bit(1)
,`suggested_mentor_name` varchar(200)
,`sys_create_by` int
,`sys_create_date` datetime
,`sys_update_by` int
,`sys_update_date` datetime
);

-- --------------------------------------------------------

--
-- Table structure for table `ors_ci_sessions`
--

CREATE TABLE `ors_ci_sessions` (
  `session_id` varchar(40) NOT NULL DEFAULT '0',
  `ip_address` varchar(45) NOT NULL DEFAULT '0',
  `user_agent` varchar(120) NOT NULL,
  `last_activity` int UNSIGNED NOT NULL DEFAULT '0',
  `user_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Stand-in structure for view `ors_report`
-- (See below for the actual view)
--
CREATE TABLE `ors_report` (
`area` varchar(45)
,`area_id` int
,`department` varchar(45)
,`id` int
,`ministry` varchar(45)
,`start` datetime
,`venue` varchar(45)
);

-- --------------------------------------------------------

--
-- Table structure for table `request`
--

CREATE TABLE `request` (
  `id` int NOT NULL,
  `requestor_id` int NOT NULL,
  `request_ve_id` int NOT NULL,
  `status` varchar(45) NOT NULL DEFAULT 'Pending',
  `status_by_id` int NOT NULL DEFAULT '0',
  `sys_update_date` datetime NOT NULL COMMENT '		',
  `sys_update_id` int NOT NULL DEFAULT '0' COMMENT '					',
  `sys_create_date` datetime NOT NULL,
  `sys_create_id` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='	';

-- --------------------------------------------------------

--
-- Table structure for table `request_history`
--

CREATE TABLE `request_history` (
  `id` int NOT NULL,
  `request_id` int NOT NULL,
  `actor_id` int NOT NULL COMMENT 'the creater, approver, rejecter, etc\n\nthe one who made the action',
  `action_date` datetime NOT NULL,
  `action` varchar(45) NOT NULL COMMENT 'For Ministry Head Approval\nFor Department Head Approval\nConfirmed\nCancelled',
  `detail` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Stand-in structure for view `request_history_view`
-- (See below for the actual view)
--
CREATE TABLE `request_history_view` (
`action` varchar(45)
,`action_date` datetime
,`actor_email` varchar(45)
,`actor_id` int
,`actor_name` varchar(91)
,`approver_level` varchar(45)
,`detail` varchar(500)
,`id` int
,`request_id` int
);

-- --------------------------------------------------------

--
-- Table structure for table `request_ve`
--

CREATE TABLE `request_ve` (
  `id` int NOT NULL,
  `purpose` varchar(100) NOT NULL,
  `venue_id` int NOT NULL,
  `start` datetime NOT NULL,
  `end` datetime NOT NULL,
  `request_group` int NOT NULL DEFAULT '0',
  `setup_chairs` int NOT NULL DEFAULT '0',
  `setup_tables` int NOT NULL DEFAULT '0',
  `pax` int NOT NULL DEFAULT '0',
  `special_instructions` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='	';

-- --------------------------------------------------------

--
-- Table structure for table `request_ve_equipment`
--

CREATE TABLE `request_ve_equipment` (
  `id` int NOT NULL,
  `request_ve_id` int NOT NULL,
  `equipment_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Stand-in structure for view `rve_approver_view`
-- (See below for the actual view)
--
CREATE TABLE `rve_approver_view` (
`approver_email` varchar(45)
,`approver_id` int
,`approver_name` varchar(91)
,`approver_worker_id` int
,`area` varchar(45)
,`area_id` int
,`department` varchar(45)
,`department_id` int
,`end` datetime
,`id` int
,`ministry` varchar(45)
,`ministry_id` int
,`pax` int
,`purpose` varchar(100)
,`request_ve_id` int
,`requestor_email` varchar(45)
,`requestor_id` int
,`requestor_name` varchar(91)
,`setup_chairs` int
,`setup_tables` int
,`special_instructions` varchar(500)
,`start` datetime
,`status` varchar(45)
,`sys_create_date` datetime
,`sys_create_id` int
,`sys_update_date` datetime
,`sys_update_id` int
,`venue` varchar(45)
,`venue_id` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `rve_equipment_view`
-- (See below for the actual view)
--
CREATE TABLE `rve_equipment_view` (
`equipment_ids` text
,`equipments` text
,`id` int
,`type` varchar(45)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `rve_past_approvals_view`
-- (See below for the actual view)
--
CREATE TABLE `rve_past_approvals_view` (
`actor_id` int
,`end` datetime
,`id` int
,`purpose` varchar(100)
,`request_ve_id` int
,`requestor_id` int
,`requestor_name` varchar(91)
,`start` datetime
,`status` varchar(45)
,`status_by` varchar(91)
,`status_by_id` int
,`sys_create_date` datetime
,`sys_create_id` int
,`sys_update_date` datetime
,`sys_update_id` int
,`venue` varchar(45)
,`venue_id` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `rve_view`
-- (See below for the actual view)
--
CREATE TABLE `rve_view` (
`area` varchar(45)
,`area_id` int
,`audio_equipment_ids` text
,`audio_equipments` text
,`department` varchar(45)
,`department_id` int
,`end` datetime
,`id` int
,`ministry` varchar(45)
,`ministry_id` int
,`multimedia_equipment_ids` text
,`multimedia_equipments` text
,`pax` int
,`purpose` varchar(100)
,`request_group` int
,`request_ve_id` int
,`requestor_email` varchar(45)
,`requestor_id` int
,`requestor_mobile` varchar(45)
,`requestor_name` varchar(91)
,`rve_id` int
,`setup_chairs` int
,`setup_tables` int
,`special_instructions` varchar(500)
,`start` datetime
,`status` varchar(45)
,`status_by` varchar(91)
,`status_by_id` int
,`sys_create_date` datetime
,`sys_create_id` int
,`sys_update_date` datetime
,`sys_update_id` int
,`venue` varchar(45)
,`venue_id` int
,`venue_short_name` varchar(45)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `rve_view_api`
-- (See below for the actual view)
--
CREATE TABLE `rve_view_api` (
`area` varchar(45)
,`area_id` int
,`audio_equipment_ids` text
,`audio_equipments` text
,`department` varchar(45)
,`department_id` int
,`end` datetime
,`event_date` datetime
,`has_audio_equipment` varchar(1)
,`has_multimedia_equipment` varchar(1)
,`id` int
,`ministry` varchar(45)
,`ministry_id` int
,`multimedia_equipment_ids` text
,`multimedia_equipments` text
,`pax` int
,`purpose` varchar(100)
,`request_group` int
,`request_ve_id` int
,`requestor_email` varchar(45)
,`requestor_id` int
,`requestor_mobile` varchar(45)
,`requestor_name` varchar(91)
,`rve_id` int
,`setup_chairs` int
,`setup_tables` int
,`special_instructions` varchar(500)
,`start` datetime
,`status` varchar(45)
,`status_by` varchar(91)
,`status_by_id` int
,`sys_create_date` datetime
,`sys_create_id` int
,`sys_update_date` datetime
,`sys_update_id` int
,`venue` varchar(45)
,`venue_id` int
,`venue_short_name` varchar(45)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `rve_view_no_fix`
-- (See below for the actual view)
--
CREATE TABLE `rve_view_no_fix` (
`end` datetime
,`id` int
,`purpose` varchar(100)
,`requestor_id` int
,`requestor_name` varchar(91)
,`start` datetime
,`status` varchar(45)
,`venue` varchar(45)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `r_view`
-- (See below for the actual view)
--
CREATE TABLE `r_view` (
`department` varchar(45)
,`department_id` int
,`id` int
,`ministry` varchar(45)
,`ministry_id` int
,`request_ve_id` int
,`requestor_email` varchar(45)
,`requestor_id` int
,`requestor_name` varchar(91)
,`status` varchar(45)
,`status_by` varchar(91)
,`status_by_id` int
,`sys_create_date` datetime
,`sys_create_id` int
,`sys_update_date` datetime
,`sys_update_id` int
);

-- --------------------------------------------------------

--
-- Table structure for table `satellite`
--

CREATE TABLE `satellite` (
  `id` int NOT NULL,
  `name` varchar(45) DEFAULT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `service_request`
--

CREATE TABLE `service_request` (
  `id` int NOT NULL,
  `sr_type_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `due_date` datetime NOT NULL,
  `request_status_id` int NOT NULL,
  `sys_create_id` int NOT NULL,
  `sys_create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_update_id` int NOT NULL,
  `sys_update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `simple_masterview`
-- (See below for the actual view)
--
CREATE TABLE `simple_masterview` (
`area_id` int
,`end` datetime
,`id` int
,`pax` int
,`purpose` varchar(100)
,`request_group` int
,`requestor_mobile` varchar(45)
,`requestor_name` varchar(91)
,`setup_chairs` int
,`setup_tables` int
,`special_instructions` varchar(500)
,`start` datetime
,`status` varchar(45)
,`venue` varchar(45)
,`venue_id` int
);

-- --------------------------------------------------------

--
-- Table structure for table `sr_category`
--

CREATE TABLE `sr_category` (
  `id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `sr_type_id` int NOT NULL,
  `weight` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `sr_details_arf`
--

CREATE TABLE `sr_details_arf` (
  `id` int NOT NULL,
  `sr_id` int NOT NULL,
  `venue` varchar(100) DEFAULT NULL,
  `event_date` date DEFAULT NULL,
  `event_start_time` time DEFAULT NULL,
  `event_end_time` time DEFAULT NULL,
  `sys_create_id` int NOT NULL,
  `sys_create_date` datetime NOT NULL,
  `sys_update_id` int NOT NULL,
  `sys_update_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `sr_resources`
--

CREATE TABLE `sr_resources` (
  `id` int NOT NULL,
  `sr_id` int NOT NULL,
  `sr_category_id` int NOT NULL,
  `details` text NOT NULL,
  `sys_create_id` int NOT NULL,
  `sys_create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_update_id` int NOT NULL,
  `sys_update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `sr_resources_per_sr_and_category_view`
-- (See below for the actual view)
--
CREATE TABLE `sr_resources_per_sr_and_category_view` (
`id` int
,`resource_details` text
,`sr_category` varchar(50)
,`sr_category_id` int
,`sr_id` int
,`sr_subcategories` text
,`sr_subcategory_ids` text
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `sr_resources_per_sr_view`
-- (See below for the actual view)
--
CREATE TABLE `sr_resources_per_sr_view` (
`sr_id` int
,`sr_subcategories` text
,`sr_subcategory_ids` text
);

-- --------------------------------------------------------

--
-- Table structure for table `sr_resources_subcategory`
--

CREATE TABLE `sr_resources_subcategory` (
  `id` int NOT NULL,
  `sr_resources_id` int NOT NULL,
  `sr_subcategory_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `sr_resources_subcategory_view`
-- (See below for the actual view)
--
CREATE TABLE `sr_resources_subcategory_view` (
`id` int
,`resource_details` text
,`sr_category` varchar(50)
,`sr_category_id` int
,`sr_id` int
,`sr_resources_id` int
,`sr_subcategory` varchar(50)
,`sr_subcategory_id` int
);

-- --------------------------------------------------------

--
-- Table structure for table `sr_status`
--

CREATE TABLE `sr_status` (
  `id` int NOT NULL,
  `name` varchar(30) NOT NULL,
  `code` varchar(30) NOT NULL,
  `is_common` tinyint(1) NOT NULL,
  `status_type` varchar(100) DEFAULT NULL,
  `sr_type_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `sr_subcategory`
--

CREATE TABLE `sr_subcategory` (
  `id` int NOT NULL,
  `name` varchar(50) NOT NULL,
  `remarks` varchar(100) NOT NULL,
  `sr_category_id` int NOT NULL,
  `weight` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `sr_subcategory_view`
-- (See below for the actual view)
--
CREATE TABLE `sr_subcategory_view` (
`assigned_ministry_id` int
,`category` varchar(50)
,`id` int
,`remarks` varchar(100)
,`sr_category_id` int
,`sr_type` varchar(100)
,`sr_type_code` varchar(10)
,`sr_type_id` int
,`subcategory` varchar(50)
,`weight` int
);

-- --------------------------------------------------------

--
-- Table structure for table `sr_type`
--

CREATE TABLE `sr_type` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(10) NOT NULL,
  `view_name` varchar(50) NOT NULL,
  `assigned_ministry_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `sr_type_view`
-- (See below for the actual view)
--
CREATE TABLE `sr_type_view` (
`admin_head_email` varchar(45)
,`admin_head_first_name` varchar(45)
,`admin_head_full_name` varchar(91)
,`admin_head_id` int
,`admin_head_last_name` varchar(45)
,`assigned_ministry_id` int
,`code` varchar(10)
,`id` int
,`ministry` varchar(45)
,`ministry_head_email` varchar(45)
,`ministry_head_first_name` varchar(45)
,`ministry_head_full_name` varchar(91)
,`ministry_head_id` int
,`ministry_head_last_name` varchar(45)
,`name` varchar(100)
,`view_name` varchar(50)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `sr_view`
-- (See below for the actual view)
--
CREATE TABLE `sr_view` (
`assigned_ministry_id` int
,`description` text
,`due_date` datetime
,`id` int
,`request_status_id` int
,`sr_create_date` datetime
,`sr_create_id` int
,`sr_requestor_department` varchar(45)
,`sr_requestor_department_id` int
,`sr_requestor_ministry` varchar(45)
,`sr_requestor_ministry_id` int
,`sr_requestor_name` varchar(91)
,`sr_subcategories` text
,`sr_subcategory_ids` text
,`sr_type_code` varchar(10)
,`sr_type_id` int
,`sr_type_name` varchar(100)
,`sr_update_date` datetime
,`sr_update_id` int
,`status_code` varchar(30)
,`status_name` varchar(30)
,`title` varchar(100)
);

-- --------------------------------------------------------

--
-- Table structure for table `sr_work_order`
--

CREATE TABLE `sr_work_order` (
  `id` int NOT NULL,
  `sr_id` int NOT NULL,
  `sr_category_id` int NOT NULL,
  `sr_subcategory_id` int NOT NULL,
  `assigned_worker_id` int DEFAULT NULL,
  `last_assigned_by` int DEFAULT NULL,
  `assigned_date` datetime DEFAULT NULL,
  `sys_create_id` int NOT NULL,
  `sys_create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_update_id` int NOT NULL,
  `sys_update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Stand-in structure for view `sr_work_order_ah_view`
-- (See below for the actual view)
--
CREATE TABLE `sr_work_order_ah_view` (
`action` varchar(50)
,`action_date` datetime
,`actor_first_name` varchar(45)
,`actor_full_name` varchar(91)
,`actor_id` int
,`actor_last_name` varchar(45)
,`ah_mapping_id` int
,`ah_type` varchar(30)
,`ah_type_code` varchar(30)
,`ah_type_id` int
,`detail` varchar(1000)
,`id` int
,`sr_category` varchar(50)
,`sr_id` int
,`sr_subcategory` varchar(50)
,`sr_type` varchar(100)
,`sr_type_code` varchar(10)
,`sr_type_id` int
,`work_order_id` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `sr_work_order_view`
-- (See below for the actual view)
--
CREATE TABLE `sr_work_order_view` (
`assigned_date` datetime
,`assigned_worker_first_name` varchar(45)
,`assigned_worker_full_name` varchar(91)
,`assigned_worker_id` int
,`assigned_worker_last_name` varchar(45)
,`id` int
,`last_assigned_by_first_name` varchar(45)
,`last_assigned_by_full_name` varchar(91)
,`last_assigned_by_last_name` varchar(45)
,`request_status` varchar(30)
,`sr_assigned_ministry_id` int
,`sr_category` varchar(50)
,`sr_category_id` int
,`sr_description` text
,`sr_due_date` datetime
,`sr_id` int
,`sr_request_status_id` int
,`sr_requestor_full_name` varchar(91)
,`sr_subcategory` varchar(50)
,`sr_subcategory_id` int
,`sr_sys_create_date` datetime
,`sr_title` varchar(100)
,`sr_type` varchar(100)
,`sr_type_code` varchar(10)
,`sr_type_id` int
,`sys_create_date` datetime
,`sys_create_id` int
,`sys_update_date` datetime
,`sys_update_id` int
);

-- --------------------------------------------------------

--
-- Table structure for table `temp_c2s_online_migration`
--

CREATE TABLE `temp_c2s_online_migration` (
  `id` int NOT NULL,
  `mentor_name` varchar(100) DEFAULT NULL,
  `worker_id` int NOT NULL,
  `category_id` int NOT NULL,
  `mentor_mobile` varchar(50) DEFAULT NULL,
  `day` varchar(20) DEFAULT NULL,
  `schedule_id` int NOT NULL,
  `mentee_name` varchar(100) DEFAULT NULL,
  `mentee_mobile` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `is_new` bit(1) NOT NULL DEFAULT b'0',
  `code_group` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- --------------------------------------------------------

--
-- Table structure for table `training`
--

CREATE TABLE `training` (
  `id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `is_for_all_department` bit(1) NOT NULL DEFAULT b'1',
  `is_active_flag` bit(1) NOT NULL DEFAULT b'1',
  `can_be_deleted` bit(1) NOT NULL DEFAULT b'1',
  `is_default` bit(1) NOT NULL DEFAULT b'0',
  `sort_order` int NOT NULL,
  `sys_create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_create_id` int DEFAULT NULL,
  `sys_update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_update_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `venue`
--

CREATE TABLE `venue` (
  `id` int NOT NULL,
  `area_id` int NOT NULL,
  `name` varchar(45) NOT NULL,
  `short_name` varchar(45) NOT NULL,
  `weight` int NOT NULL DEFAULT '1',
  `type` varchar(30) NOT NULL,
  `door_side` char(1) NOT NULL DEFAULT 'R',
  `sys_update_id` int NOT NULL DEFAULT '0' COMMENT '	',
  `sys_update_date` datetime DEFAULT NULL,
  `sys_create_id` int NOT NULL DEFAULT '0',
  `sys_create_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Stand-in structure for view `venue_view`
-- (See below for the actual view)
--
CREATE TABLE `venue_view` (
`area_id` int
,`area_name` varchar(45)
,`area_short_name` varchar(45)
,`venue_id` int
,`venue_name` varchar(45)
,`venue_short_name` varchar(45)
,`venue_weight` int
);

-- --------------------------------------------------------

--
-- Table structure for table `wdb_ci_sessions`
--

CREATE TABLE `wdb_ci_sessions` (
  `id` varchar(40) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `timestamp` int UNSIGNED NOT NULL DEFAULT '0',
  `data` blob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `worker`
--

CREATE TABLE `worker` (
  `id` int NOT NULL,
  `church_id` int NOT NULL DEFAULT '72',
  `first_name` varchar(45) NOT NULL,
  `last_name` varchar(45) NOT NULL,
  `email` varchar(45) DEFAULT NULL,
  `username` varchar(45) DEFAULT NULL,
  `password` varchar(45) NOT NULL,
  `mobile` varchar(45) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  `area_id` tinyint(1) NOT NULL,
  `birthdate` date DEFAULT NULL,
  `facebook_handle` varchar(45) DEFAULT NULL,
  `ministry_id` int DEFAULT '0',
  `sec_ministry_id` int DEFAULT '0',
  `type` varchar(45) NOT NULL DEFAULT 'User',
  `status` varchar(45) NOT NULL DEFAULT 'Inactive',
  `start_month` varchar(15) DEFAULT NULL,
  `start_year` varchar(4) DEFAULT NULL,
  `sys_create_id` int NOT NULL DEFAULT '0',
  `sys_create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_update_id` int NOT NULL DEFAULT '0',
  `sys_update_date` datetime NOT NULL,
  `flag` varchar(45) DEFAULT NULL,
  `remarks` varchar(255) NOT NULL,
  `qrdata` varchar(20) NOT NULL,
  `worker_status` varchar(10) NOT NULL DEFAULT 'Active',
  `last_password_change_date` datetime DEFAULT NULL,
  `worker_type` varchar(50) NOT NULL DEFAULT 'Volunteer',
  `biometrics_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `workerpass_user`
--

CREATE TABLE `workerpass_user` (
  `id` int NOT NULL,
  `worker_id` int NOT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `worker_count_by_department_view`
-- (See below for the actual view)
--
CREATE TABLE `worker_count_by_department_view` (
`department` varchar(45)
,`Worker Count` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `worker_count_by_ministry_view`
-- (See below for the actual view)
--
CREATE TABLE `worker_count_by_ministry_view` (
`department` varchar(45)
,`ministry` varchar(45)
,`Worker Count` bigint
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `worker_mentee_all_in_view`
-- (See below for the actual view)
--
CREATE TABLE `worker_mentee_all_in_view` (
`Area_ID` tinyint(1)
,`Department` varchar(45)
,`First Name` varchar(45)
,`Last Name` varchar(45)
,`Mentees` text
,`Ministry` varchar(45)
,`Worker ID` int
);

-- --------------------------------------------------------

--
-- Table structure for table `worker_pass`
--

CREATE TABLE `worker_pass` (
  `id` int NOT NULL,
  `batch_id` int NOT NULL,
  `worker_name` varchar(255) NOT NULL,
  `image_url` varchar(100) NOT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `worker_pass_batch`
--

CREATE TABLE `worker_pass_batch` (
  `id` int NOT NULL,
  `approver_id` int NOT NULL,
  `satellite_id` int NOT NULL,
  `service_date` datetime NOT NULL,
  `batch_url` varchar(100) NOT NULL,
  `key` varchar(100) NOT NULL,
  `batch_type` varchar(50) NOT NULL DEFAULT 'Worker',
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Stand-in structure for view `worker_pass_view`
-- (See below for the actual view)
--
CREATE TABLE `worker_pass_view` (
`approver` varchar(91)
,`approver_first_name` varchar(45)
,`approver_id` int
,`approver_last_name` varchar(45)
,`batch_created_date` datetime
,`batch_id` int
,`batch_type` varchar(50)
,`batch_url` varchar(100)
,`image_url` varchar(100)
,`key` varchar(100)
,`name` varchar(45)
,`satellite_id` int
,`service_date` datetime
,`worker_name` varchar(255)
,`worker_pass_created_date` datetime
,`worker_pass_id` int
);

-- --------------------------------------------------------

--
-- Table structure for table `worker_training_mapping`
--

CREATE TABLE `worker_training_mapping` (
  `id` int NOT NULL,
  `worker_id` int NOT NULL,
  `training_id` int NOT NULL,
  `month_completed` int NOT NULL,
  `year_completed` int NOT NULL,
  `sys_create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_create_id` int DEFAULT NULL,
  `sys_update_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sys_update_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `worker_training_view`
-- (See below for the actual view)
--
CREATE TABLE `worker_training_view` (
`address` varchar(200)
,`area_id` tinyint(1)
,`birthdate` date
,`church_id` int
,`department` varchar(45)
,`department_id` int
,`email` varchar(45)
,`facebook_handle` varchar(45)
,`first_name` varchar(45)
,`flag` varchar(45)
,`last_name` varchar(45)
,`last_password_change_date` datetime
,`ministry` varchar(45)
,`ministry_id` int
,`mobile` varchar(45)
,`month_completed` int
,`name` varchar(91)
,`password` varchar(45)
,`qrdata` varchar(20)
,`remarks` varchar(255)
,`sort_order` int
,`status` varchar(45)
,`sys_create_date` datetime
,`sys_create_id` int
,`sys_update_date` datetime
,`sys_update_id` int
,`training_id` int
,`training_name` varchar(200)
,`type` varchar(45)
,`username` varchar(45)
,`worker_id` int
,`worker_status` varchar(10)
,`worker_type` varchar(50)
,`year_completed` int
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `worker_view`
-- (See below for the actual view)
--
CREATE TABLE `worker_view` (
`address` varchar(200)
,`area_id` tinyint(1)
,`biometrics_id` int
,`birthdate` date
,`church_id` int
,`department` varchar(45)
,`department_id` int
,`email` varchar(45)
,`facebook_handle` varchar(45)
,`first_name` varchar(45)
,`flag` varchar(45)
,`id` int
,`is_admin_head` int
,`is_dept_head` int
,`is_ministry_head` int
,`last_name` varchar(45)
,`last_password_change_date` datetime
,`ministry` varchar(45)
,`ministry_id` int
,`mobile` varchar(45)
,`name` varchar(91)
,`password` varchar(45)
,`qrdata` varchar(20)
,`remarks` varchar(255)
,`status` varchar(45)
,`sys_create_date` datetime
,`sys_create_id` int
,`sys_update_date` datetime
,`sys_update_id` int
,`type` varchar(45)
,`username` varchar(45)
,`worker_status` varchar(10)
,`worker_type` varchar(50)
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `action_history`
--
ALTER TABLE `action_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ah_type`
--
ALTER TABLE `ah_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `approver`
--
ALTER TABLE `approver`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`);

--
-- Indexes for table `area`
--
ALTER TABLE `area`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `c2s_ci_sessions`
--
ALTER TABLE `c2s_ci_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ci_sessions_timestamp` (`timestamp`);

--
-- Indexes for table `c2s_group`
--
ALTER TABLE `c2s_group`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `c2s_keys`
--
ALTER TABLE `c2s_keys`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `c2s_online_category`
--
ALTER TABLE `c2s_online_category`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `c2s_online_group_details`
--
ALTER TABLE `c2s_online_group_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `c2s_online_report`
--
ALTER TABLE `c2s_online_report`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `c2s_online_schedule`
--
ALTER TABLE `c2s_online_schedule`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `c2s_online_zoom_link`
--
ALTER TABLE `c2s_online_zoom_link`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `deactivated_logs`
--
ALTER TABLE `deactivated_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name_UNIQUE` (`name`);

--
-- Indexes for table `email_job`
--
ALTER TABLE `email_job`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `equipment`
--
ALTER TABLE `equipment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `facilitator`
--
ALTER TABLE `facilitator`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `health_checklist`
--
ALTER TABLE `health_checklist`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hr_attendance_scan`
--
ALTER TABLE `hr_attendance_scan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hr_scanner_site`
--
ALTER TABLE `hr_scanner_site`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `login_history`
--
ALTER TABLE `login_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `login_history_c2s`
--
ALTER TABLE `login_history_c2s`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mentee`
--
ALTER TABLE `mentee`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `message_template`
--
ALTER TABLE `message_template`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ministry`
--
ALTER TABLE `ministry`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name_UNIQUE` (`name`);

--
-- Indexes for table `ms_assignment`
--
ALTER TABLE `ms_assignment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `worker_id_sched_date_index` (`worker_id`,`schedule_date`);

--
-- Indexes for table `ms_canteen`
--
ALTER TABLE `ms_canteen`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ms_canteens`
--
ALTER TABLE `ms_canteens`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ms_canteen_back`
--
ALTER TABLE `ms_canteen_back`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ms_dept_setting`
--
ALTER TABLE `ms_dept_setting`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ms_min_setting`
--
ALTER TABLE `ms_min_setting`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ms_scan`
--
ALTER TABLE `ms_scan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `worker_id_date_scanned_index` (`worker_id`,`date_scanned`);

--
-- Indexes for table `online_mentee_registration`
--
ALTER TABLE `online_mentee_registration`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ors_ci_sessions`
--
ALTER TABLE `ors_ci_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `last_activity_idx` (`last_activity`);

--
-- Indexes for table `request`
--
ALTER TABLE `request`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `request_history`
--
ALTER TABLE `request_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `request_ve`
--
ALTER TABLE `request_ve`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `request_ve_equipment`
--
ALTER TABLE `request_ve_equipment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `satellite`
--
ALTER TABLE `satellite`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `service_request`
--
ALTER TABLE `service_request`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sr_category`
--
ALTER TABLE `sr_category`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sr_details_arf`
--
ALTER TABLE `sr_details_arf`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sr_resources`
--
ALTER TABLE `sr_resources`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sr_resources_subcategory`
--
ALTER TABLE `sr_resources_subcategory`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sr_status`
--
ALTER TABLE `sr_status`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sr_subcategory`
--
ALTER TABLE `sr_subcategory`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sr_type`
--
ALTER TABLE `sr_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sr_work_order`
--
ALTER TABLE `sr_work_order`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `temp_c2s_online_migration`
--
ALTER TABLE `temp_c2s_online_migration`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `training`
--
ALTER TABLE `training`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `venue`
--
ALTER TABLE `venue`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `worker`
--
ALTER TABLE `worker`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_UNIQUE` (`id`),
  ADD UNIQUE KEY `Unique First and Last Name` (`first_name`,`last_name`),
  ADD UNIQUE KEY `email_UNIQUE` (`email`),
  ADD UNIQUE KEY `username_UNIQUE` (`username`);

--
-- Indexes for table `worker_pass`
--
ALTER TABLE `worker_pass`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `worker_pass_batch`
--
ALTER TABLE `worker_pass_batch`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `worker_training_mapping`
--
ALTER TABLE `worker_training_mapping`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `action_history`
--
ALTER TABLE `action_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ah_type`
--
ALTER TABLE `ah_type`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `approver`
--
ALTER TABLE `approver`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `area`
--
ALTER TABLE `area`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `c2s_group`
--
ALTER TABLE `c2s_group`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `c2s_keys`
--
ALTER TABLE `c2s_keys`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `c2s_online_category`
--
ALTER TABLE `c2s_online_category`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `c2s_online_group_details`
--
ALTER TABLE `c2s_online_group_details`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `c2s_online_report`
--
ALTER TABLE `c2s_online_report`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `c2s_online_schedule`
--
ALTER TABLE `c2s_online_schedule`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `c2s_online_zoom_link`
--
ALTER TABLE `c2s_online_zoom_link`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deactivated_logs`
--
ALTER TABLE `deactivated_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `department`
--
ALTER TABLE `department`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `email_job`
--
ALTER TABLE `email_job`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `equipment`
--
ALTER TABLE `equipment`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `facilitator`
--
ALTER TABLE `facilitator`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `health_checklist`
--
ALTER TABLE `health_checklist`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hr_attendance_scan`
--
ALTER TABLE `hr_attendance_scan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hr_scanner_site`
--
ALTER TABLE `hr_scanner_site`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login_history`
--
ALTER TABLE `login_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `login_history_c2s`
--
ALTER TABLE `login_history_c2s`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mentee`
--
ALTER TABLE `mentee`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `message_template`
--
ALTER TABLE `message_template`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ministry`
--
ALTER TABLE `ministry`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ms_assignment`
--
ALTER TABLE `ms_assignment`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ms_canteen`
--
ALTER TABLE `ms_canteen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ms_dept_setting`
--
ALTER TABLE `ms_dept_setting`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ms_min_setting`
--
ALTER TABLE `ms_min_setting`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ms_scan`
--
ALTER TABLE `ms_scan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `online_mentee_registration`
--
ALTER TABLE `online_mentee_registration`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `request`
--
ALTER TABLE `request`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `request_history`
--
ALTER TABLE `request_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `request_ve`
--
ALTER TABLE `request_ve`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `request_ve_equipment`
--
ALTER TABLE `request_ve_equipment`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `satellite`
--
ALTER TABLE `satellite`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `service_request`
--
ALTER TABLE `service_request`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sr_category`
--
ALTER TABLE `sr_category`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sr_details_arf`
--
ALTER TABLE `sr_details_arf`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sr_resources`
--
ALTER TABLE `sr_resources`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sr_resources_subcategory`
--
ALTER TABLE `sr_resources_subcategory`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sr_status`
--
ALTER TABLE `sr_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sr_subcategory`
--
ALTER TABLE `sr_subcategory`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sr_type`
--
ALTER TABLE `sr_type`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sr_work_order`
--
ALTER TABLE `sr_work_order`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `temp_c2s_online_migration`
--
ALTER TABLE `temp_c2s_online_migration`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `training`
--
ALTER TABLE `training`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `venue`
--
ALTER TABLE `venue`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `worker`
--
ALTER TABLE `worker`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `worker_pass`
--
ALTER TABLE `worker_pass`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `worker_pass_batch`
--
ALTER TABLE `worker_pass_batch`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `worker_training_mapping`
--
ALTER TABLE `worker_training_mapping`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Structure for view `action_history_view`
--
DROP TABLE IF EXISTS `action_history_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `action_history_view`  AS SELECT `ah`.`id` AS `id`, `ah`.`ah_type_id` AS `ah_type_id`, `at`.`ah_type` AS `ah_type`, `at`.`ah_code` AS `ah_type_code`, `ah`.`ah_mapping_id` AS `ah_mapping_id`, `ah`.`action` AS `action`, `ah`.`action_date` AS `action_date`, `ah`.`detail` AS `detail`, `ah`.`actor_id` AS `actor_id`, `w`.`first_name` AS `actor_first_name`, `w`.`last_name` AS `actor_last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `actor_full_name` FROM ((`action_history` `ah` left join `ah_type` `at` on((`ah`.`ah_type_id` = `at`.`id`))) left join `worker` `w` on((`ah`.`actor_id` = `w`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `admin_approver_view`
--
DROP TABLE IF EXISTS `admin_approver_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `admin_approver_view`  AS SELECT `w`.`id` AS `id`, `w`.`first_name` AS `first_name`, `w`.`last_name` AS `last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `name`, `w`.`email` AS `email`, `a`.`level` AS `level`, `a`.`id` AS `approver_id` FROM (`approver` `a` left join `worker` `w` on((`a`.`worker_id` = `w`.`id`))) WHERE ((`a`.`level` = 'Admin') AND (`w`.`type` = 'Admin') AND (`w`.`id` is not null)) ORDER BY `w`.`first_name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `all_active_mentors`
--
DROP TABLE IF EXISTS `all_active_mentors`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `all_active_mentors`  AS SELECT `w`.`id` AS `id`, `m`.`name` AS `ministry`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `name`, 'Active' AS `status` FROM (`worker` `w` join `ministry` `m`) WHERE ((`w`.`ministry_id` = `m`.`id`) AND (`w`.`status` = 'Active') AND `w`.`id` in (select distinct `me`.`worker_id` from `mentee` `me` where (`me`.`is_inactive_date` is null))) ;

-- --------------------------------------------------------

--
-- Structure for view `approver_view`
--
DROP TABLE IF EXISTS `approver_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `approver_view`  AS SELECT `w`.`id` AS `id`, `w`.`first_name` AS `first_name`, `w`.`last_name` AS `last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `name`, `w`.`email` AS `email`, `a`.`id` AS `approver_id`, `a`.`ministry_id` AS `ministry_id`, `a`.`department_id` AS `department_id`, `a`.`level` AS `level` FROM (`approver` `a` join `worker` `w`) WHERE (`a`.`worker_id` = `w`.`id`) ;

-- --------------------------------------------------------

--
-- Structure for view `c2s_attendance_report_view`
--
DROP TABLE IF EXISTS `c2s_attendance_report_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `c2s_attendance_report_view`  AS SELECT `cogv`.`mentor_id` AS `mentor_id`, `cogv`.`mentor_name` AS `name`, 'Yes' AS `is_mentor`, `cogv`.`mentor_name` AS `mentor_name`, `cogv`.`mobile` AS `contact_number`, `cogv`.`group_id` AS `group_id`, `cogv`.`name` AS `group_name`, `cogv`.`category_name` AS `category_name`, `cogv`.`category_id` AS `category_id`, `cogv`.`availability_day` AS `availability_day`, `cogv`.`availability_time_id` AS `availability_time_id`, `cogv`.`schedule` AS `schedule`, `cogv`.`zoom_link_id` AS `zoom_link_id`, `cogv`.`zoom_link` AS `zoom_link`, `cogv`.`last_attended_date` AS `last_attended_date`, `m`.`id` AS `ministry_id`, `m`.`name` AS `ministry_name`, `m`.`department_id` AS `department_id`, `d`.`name` AS `department_name` FROM (((`c2s_online_group_view` `cogv` left join `worker` `w` on((`w`.`id` = `cogv`.`mentor_id`))) left join `ministry` `m` on((`m`.`id` = `w`.`ministry_id`))) left join `department` `d` on((`d`.`id` = `m`.`department_id`))) WHERE ((`cogv`.`current_mentee` > 0) AND (`cogv`.`mentor_name` is not null))union all select `comv`.`worker_id` AS `mentor_id`,`comv`.`name` AS `name`,'No' AS `is_mentor`,`comv`.`mentor_name` AS `mentor_name`,`comv`.`contact` AS `contact_number`,`comv`.`group_id` AS `group_id`,`comv`.`group_name` AS `group_name`,`comv`.`category_name` AS `category_name`,`comv`.`category_id` AS `category_id`,`comv`.`availability_day` AS `availability_day`,`comv`.`availability_time_id` AS `availability_time_id`,`comv`.`schedule` AS `schedule`,`comv`.`zoom_link_id` AS `zoom_link_id`,`comv`.`zoom_link` AS `zoom_link`,`comv`.`last_attended_date` AS `last_attended_date`,`m`.`id` AS `ministry_id`,`m`.`name` AS `ministry_name`,`m`.`department_id` AS `department_id`,`d`.`name` AS `department_name` from (((`c2s_online_mentee_view` `comv` left join `worker` `w` on((`w`.`id` = `comv`.`worker_id`))) left join `ministry` `m` on((`m`.`id` = `w`.`ministry_id`))) left join `department` `d` on((`d`.`id` = `m`.`department_id`))) where (`comv`.`mentor_name` is not null)  ;

-- --------------------------------------------------------

--
-- Structure for view `c2s_group_summary_view`
--
DROP TABLE IF EXISTS `c2s_group_summary_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `c2s_group_summary_view`  AS SELECT `cg`.`id` AS `id`, `cg`.`mentor_id` AS `mentor_id`, `cg`.`name` AS `name`, `cg`.`group_type` AS `group_type`, `cg`.`status` AS `status`, `cg`.`sys_create_by` AS `sys_create_by`, `cg`.`sys_create_date` AS `sys_create_date`, `cg`.`sys_update_by` AS `sys_update_by`, `cg`.`sys_update_date` AS `sys_update_date`, `w`.`first_name` AS `first_name`, `w`.`last_name` AS `last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `mentor_name`, `mi`.`name` AS `ministry_name`, `d`.`name` AS `department_name`, `mi`.`department_id` AS `department_id` FROM (((`c2s_group` `cg` left join `worker` `w` on((`w`.`id` = `cg`.`mentor_id`))) left join `ministry` `mi` on((`mi`.`id` = `w`.`ministry_id`))) left join `department` `d` on((`d`.`id` = `mi`.`department_id`))) WHERE ((`w`.`status` = 'Active') AND `cg`.`id` in (select distinct `mentee`.`group_id` from `mentee` where (`mentee`.`is_inactive_date` is null))) ;

-- --------------------------------------------------------

--
-- Structure for view `c2s_online_group_view`
--
DROP TABLE IF EXISTS `c2s_online_group_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `c2s_online_group_view`  AS SELECT `cg`.`id` AS `id`, `cg`.`mentor_id` AS `mentor_id`, `cg`.`name` AS `name`, `cg`.`group_type` AS `group_type`, `cg`.`status` AS `status`, `cg`.`sys_create_by` AS `sys_create_by`, `cg`.`sys_create_date` AS `sys_create_date`, `cg`.`sys_update_by` AS `sys_update_by`, `cg`.`sys_update_date` AS `sys_update_date`, count(`m`.`id`) AS `current_mentee`, (count(`m`.`id`) + 1) AS `group_count`, `cogd`.`group_id` AS `group_id`, `cogd`.`category_id` AS `category_id`, `cogd`.`availability_day` AS `availability_day`, `cogd`.`availability_time_id` AS `availability_time_id`, `cogd`.`zoom_link_id` AS `zoom_link_id`, `zoom`.`id` AS `zoom_id`, `zoom`.`zoom_link` AS `zoom_link`, `cogd`.`last_attended_date` AS `last_attended_date`, `w`.`first_name` AS `first_name`, `w`.`last_name` AS `last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `mentor_name`, `w`.`mobile` AS `mobile`, `coc`.`category_name` AS `category_name`, `cos`.`schedule` AS `schedule` FROM ((((((`c2s_group` `cg` left join `c2s_online_group_details` `cogd` on((`cg`.`id` = `cogd`.`group_id`))) left join `worker` `w` on((`w`.`id` = `cg`.`mentor_id`))) left join `mentee` `m` on((`m`.`group_id` = `cg`.`id`))) left join `c2s_online_category` `coc` on((`coc`.`id` = `cogd`.`category_id`))) left join `c2s_online_schedule` `cos` on((`cos`.`id` = `cogd`.`availability_time_id`))) left join `c2s_online_zoom_link` `zoom` on((`zoom`.`id` = `cogd`.`zoom_link_id`))) WHERE (`cg`.`group_type` = 1) GROUP BY `cg`.`id` ;

-- --------------------------------------------------------

--
-- Structure for view `c2s_online_mentee_view`
--
DROP TABLE IF EXISTS `c2s_online_mentee_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `c2s_online_mentee_view`  AS SELECT `m`.`id` AS `id`, `m`.`worker_id` AS `worker_id`, `m`.`group_id` AS `group_id`, `m`.`name` AS `name`, `m`.`contact` AS `contact`, `m`.`connection_type` AS `connection_type`, `m`.`connection_year` AS `connection_year`, `m`.`c2s_manual_status` AS `c2s_manual_status`, `m`.`c2s_manual_update` AS `c2s_manual_update`, `m`.`last_attended_date` AS `last_attended_date`, `m`.`registered_by` AS `registered_by`, `m`.`sys_create_by` AS `sys_create_by`, `m`.`sys_create_date` AS `sys_create_date`, `m`.`sys_update_by` AS `sys_update_by`, `m`.`sys_update_date` AS `sys_update_date`, `m`.`is_inactive_date` AS `is_inactive_date`, date_format(`m`.`sys_create_date`,'%M %d, %Y') AS `mentee_created_date`, `cg`.`id` AS `c2s_group_id`, `cg`.`mentor_id` AS `mentor_id`, `cg`.`name` AS `group_name`, `cg`.`group_type` AS `group_type`, `cogd`.`category_id` AS `category_id`, `cogd`.`availability_day` AS `availability_day`, `cogd`.`availability_time_id` AS `availability_time_id`, `cogd`.`zoom_link_id` AS `zoom_link_id`, `zoom`.`zoom_link` AS `zoom_link`, `w`.`first_name` AS `first_name`, `w`.`last_name` AS `last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `mentor_name`, `w`.`mobile` AS `mobile`, `coc`.`category_name` AS `category_name`, `cos`.`schedule` AS `schedule` FROM ((((((`mentee` `m` left join `c2s_group` `cg` on((`cg`.`id` = `m`.`group_id`))) left join `c2s_online_group_details` `cogd` on((`cg`.`id` = `cogd`.`group_id`))) left join `worker` `w` on((`w`.`id` = `cg`.`mentor_id`))) left join `c2s_online_category` `coc` on((`coc`.`id` = `cogd`.`category_id`))) left join `c2s_online_schedule` `cos` on((`cos`.`id` = `cogd`.`availability_time_id`))) left join `c2s_online_zoom_link` `zoom` on((`zoom`.`id` = `cogd`.`zoom_link_id`))) WHERE (`cg`.`group_type` = 1) ;

-- --------------------------------------------------------

--
-- Structure for view `core_leader_approver_view`
--
DROP TABLE IF EXISTS `core_leader_approver_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `core_leader_approver_view`  AS SELECT `d`.`id` AS `department_id`, `d`.`name` AS `department`, `m`.`id` AS `ministry_id`, `m`.`name` AS `ministry`, `w`.`id` AS `id`, `w`.`first_name` AS `first_name`, `w`.`last_name` AS `last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `name`, `w`.`email` AS `email`, `a`.`level` AS `level`, `a`.`id` AS `approver_id` FROM (((`department` `d` left join `ministry` `m` on((`m`.`department_id` = `d`.`id`))) left join `approver` `a` on(((`a`.`ministry_id` = `m`.`id`) and (`a`.`level` = 'Core Leader')))) left join `worker` `w` on((`w`.`id` = `a`.`worker_id`))) WHERE (`w`.`id` is not null) ORDER BY `d`.`id` ASC, `m`.`name` ASC, `w`.`first_name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `department_approver_view`
--
DROP TABLE IF EXISTS `department_approver_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `department_approver_view`  AS SELECT `d`.`id` AS `department_id`, `d`.`name` AS `department`, `w`.`id` AS `id`, `w`.`first_name` AS `first_name`, `w`.`last_name` AS `last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `name`, `w`.`email` AS `email`, `a`.`level` AS `level`, `a`.`id` AS `approver_id` FROM ((`department` `d` left join `approver` `a` on(((`a`.`department_id` = `d`.`id`) and (`a`.`level` = 'Department')))) left join `worker` `w` on((`a`.`worker_id` = `w`.`id`))) ORDER BY `d`.`id` ASC, `w`.`first_name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `department_view`
--
DROP TABLE IF EXISTS `department_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `department_view`  AS SELECT `d`.`id` AS `id`, `d`.`name` AS `department`, `d`.`head_id` AS `head_id`, `w`.`first_name` AS `head_first_name`, `w`.`last_name` AS `head_last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `head_full_name` FROM (`department` `d` left join `worker` `w` on((`d`.`head_id` = `w`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `drs_view`
--
DROP TABLE IF EXISTS `drs_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `drs_view`  AS SELECT `r`.`id` AS `id`, `rv`.`purpose` AS `purpose`, `v`.`short_name` AS `venue_short_name`, `rv`.`start` AS `start`, `rv`.`end` AS `end` FROM ((`request_ve` `rv` join `venue` `v`) join `request` `r`) WHERE ((`r`.`request_ve_id` = `rv`.`id`) AND (`rv`.`venue_id` = `v`.`id`) AND (`r`.`status` = 'Approved by Admin')) ;

-- --------------------------------------------------------

--
-- Structure for view `hr_attendance_scan_view`
--
DROP TABLE IF EXISTS `hr_attendance_scan_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `hr_attendance_scan_view`  AS SELECT `scan`.`id` AS `id`, `scan`.`worker_id` AS `worker_id`, `w`.`worker_type` AS `worker_type`, `w`.`first_name` AS `worker_first_name`, `w`.`last_name` AS `worker_last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `worker_full_name`, `scan`.`scanner_site_id` AS `scanner_site_id`, `scanner`.`name` AS `scanner_site_name`, `scan`.`date_scanned` AS `date_scanned` FROM ((`hr_attendance_scan` `scan` left join `hr_scanner_site` `scanner` on((`scan`.`scanner_site_id` = `scanner`.`id`))) left join `worker` `w` on((`scan`.`worker_id` = `w`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `login_history_view`
--
DROP TABLE IF EXISTS `login_history_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `login_history_view`  AS SELECT `lh`.`id` AS `id`, `lh`.`login_date` AS `login_date`, `lh`.`worker_id` AS `worker_id`, `lh`.`result` AS `result`, `lh`.`platform` AS `platform`, `w`.`first_name` AS `first_name`, `w`.`last_name` AS `last_name`, `d`.`name` AS `department`, `m`.`name` AS `ministry` FROM (`login_history` `lh` left join ((`worker` `w` join `department` `d`) join `ministry` `m`) on(((`lh`.`worker_id` = `w`.`id`) and (`w`.`ministry_id` = `m`.`id`) and (`d`.`id` = `m`.`department_id`)))) ;

-- --------------------------------------------------------

--
-- Structure for view `masterview_view`
--
DROP TABLE IF EXISTS `masterview_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `masterview_view`  AS SELECT `r`.`id` AS `id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `requestor_name`, `w`.`mobile` AS `requestor_mobile`, `rv`.`purpose` AS `purpose`, `v`.`id` AS `venue_id`, `v`.`name` AS `venue`, `v`.`area_id` AS `area_id`, `rv`.`start` AS `start`, `rv`.`end` AS `end`, `rvee_audio`.`equipment_ids` AS `audio_equipment_ids`, `rvee_multimedia`.`equipment_ids` AS `multimedia_equipment_ids`, `rvee_audio`.`equipments` AS `audio_equipments`, `rvee_multimedia`.`equipments` AS `multimedia_equipments`, `rv`.`setup_chairs` AS `setup_chairs`, `rv`.`setup_tables` AS `setup_tables`, `rv`.`pax` AS `pax`, `rv`.`special_instructions` AS `special_instructions` FROM ((`worker` `w` join (`request_ve` `rv` join `venue` `v`)) join ((`request` `r` left join `rve_equipment_view` `rvee_audio` on(((`rvee_audio`.`id` = `r`.`id`) and (`rvee_audio`.`type` = 'Audio')))) left join `rve_equipment_view` `rvee_multimedia` on(((`rvee_multimedia`.`id` = `r`.`id`) and (`rvee_multimedia`.`type` = 'Multimedia'))))) WHERE ((`r`.`request_ve_id` = `rv`.`id`) AND (`w`.`id` = `r`.`requestor_id`) AND (`rv`.`venue_id` = `v`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `mentees_by_department`
--
DROP TABLE IF EXISTS `mentees_by_department`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `mentees_by_department`  AS SELECT `d`.`name` AS `department`, `me`.`connection_type` AS `connection_type`, count(`d`.`id`) AS `count` FROM ((((`mentee` `me` left join `c2s_group` `cg` on((`me`.`group_id` = `cg`.`id`))) left join `worker` `w` on((`w`.`id` = `cg`.`mentor_id`))) left join `ministry` `mi` on((`mi`.`id` = `w`.`ministry_id`))) left join `department` `d` on((`d`.`id` = `mi`.`department_id`))) WHERE ((`w`.`status` = 'Active') AND (`me`.`is_inactive_date` is null) AND (`d`.`id` is not null) AND (`me`.`connection_type` is not null) AND (`me`.`connection_type` <> '')) GROUP BY `d`.`name`, `me`.`connection_type` ORDER BY `d`.`id` ASC, `me`.`connection_type` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `mentees_summary_view`
--
DROP TABLE IF EXISTS `mentees_summary_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `mentees_summary_view`  AS SELECT DISTINCT `m`.`id` AS `id`, `m`.`worker_id` AS `worker_id`, `m`.`group_id` AS `group_id`, `m`.`name` AS `name`, `m`.`contact` AS `contact`, `m`.`connection_type` AS `connection_type`, `m`.`connection_year` AS `connection_year`, `m`.`c2s_manual_status` AS `c2s_manual_status`, `m`.`c2s_manual_update` AS `c2s_manual_update`, `m`.`last_attended_date` AS `last_attended_date`, `m`.`registered_by` AS `registered_by`, `m`.`sys_create_by` AS `sys_create_by`, `m`.`sys_create_date` AS `sys_create_date`, `m`.`sys_update_by` AS `sys_update_by`, `m`.`sys_update_date` AS `sys_update_date`, `m`.`is_inactive_date` AS `is_inactive_date`, `cg`.`id` AS `c2s_group_id`, `cg`.`mentor_id` AS `mentor_id`, `cg`.`name` AS `group_name`, `cg`.`group_type` AS `group_type`, `w`.`first_name` AS `first_name`, `w`.`last_name` AS `last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `mentor_name`, `w`.`mobile` AS `mobile`, `mi`.`id` AS `ministry_id`, `mi`.`name` AS `ministry_name`, `d`.`name` AS `department_name`, `mi`.`department_id` AS `department_id` FROM ((((`mentee` `m` left join `c2s_group` `cg` on((`m`.`group_id` = `cg`.`id`))) left join `worker` `w` on((`w`.`id` = `cg`.`mentor_id`))) left join `ministry` `mi` on((`mi`.`id` = `w`.`ministry_id`))) left join `department` `d` on((`d`.`id` = `mi`.`department_id`))) WHERE ((`m`.`is_inactive_date` is null) AND (`w`.`status` = 'Active') AND (`d`.`id` is not null) AND (`m`.`connection_type` is not null) AND (`m`.`connection_type` <> '')) ORDER BY `mi`.`department_id` ASC, `cg`.`group_type` ASC, `mi`.`id` ASC, `m`.`worker_id` ASC, `m`.`id` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `mentors_by_department`
--
DROP TABLE IF EXISTS `mentors_by_department`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `mentors_by_department`  AS SELECT `d`.`name` AS `department`, count(0) AS `count` FROM ((`worker` `w` join `ministry` `m`) join `department` `d`) WHERE ((`w`.`ministry_id` = `m`.`id`) AND (`w`.`status` = 'Active') AND (`m`.`department_id` = `d`.`id`) AND `w`.`id` in (select distinct `me`.`worker_id` from `mentee` `me` where (`me`.`is_inactive_date` is null))) GROUP BY `d`.`name` ORDER BY `d`.`id` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `mentors_report_view`
--
DROP TABLE IF EXISTS `mentors_report_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `mentors_report_view`  AS SELECT `mentees_summary_view`.`department_name` AS `department_name`, `mentees_summary_view`.`department_id` AS `department_id`, `mentees_summary_view`.`ministry_name` AS `ministry_name`, `mentees_summary_view`.`ministry_id` AS `ministry_id`, `mentees_summary_view`.`mentor_id` AS `mentor_id`, `mentees_summary_view`.`mentor_name` AS `mentor_name`, ifnull(count(distinct (case when (`mentees_summary_view`.`group_type` = 0) then `mentees_summary_view`.`group_id` end)),0) AS `f2f_group_count`, ifnull(count(distinct (case when (`mentees_summary_view`.`group_type` = 0) then `mentees_summary_view`.`id` end)),0) AS `f2f_mentee_count`, ifnull(count(distinct (case when (`mentees_summary_view`.`group_type` = 1) then `mentees_summary_view`.`group_id` end)),0) AS `online_group_count`, ifnull(count(distinct (case when (`mentees_summary_view`.`group_type` = 1) then `mentees_summary_view`.`id` end)),0) AS `online_mentee_count` FROM `mentees_summary_view` GROUP BY `mentees_summary_view`.`mentor_id` ORDER BY `mentees_summary_view`.`department_id` ASC, `mentees_summary_view`.`ministry_id` ASC, `mentees_summary_view`.`mentor_id` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `mentors_summary_view`
--
DROP TABLE IF EXISTS `mentors_summary_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `mentors_summary_view`  AS SELECT `w`.`id` AS `id`, `w`.`church_id` AS `church_id`, `w`.`first_name` AS `first_name`, `w`.`last_name` AS `last_name`, `w`.`email` AS `email`, `w`.`username` AS `username`, `w`.`password` AS `password`, `w`.`mobile` AS `mobile`, `w`.`address` AS `address`, `w`.`area_id` AS `area_id`, `w`.`birthdate` AS `birthdate`, `w`.`facebook_handle` AS `facebook_handle`, `w`.`ministry_id` AS `ministry_id`, `w`.`sec_ministry_id` AS `sec_ministry_id`, `w`.`type` AS `type`, `w`.`status` AS `status`, `w`.`start_month` AS `start_month`, `w`.`start_year` AS `start_year`, `w`.`sys_create_id` AS `sys_create_id`, `w`.`sys_create_date` AS `sys_create_date`, `w`.`sys_update_id` AS `sys_update_id`, `w`.`sys_update_date` AS `sys_update_date`, `w`.`flag` AS `flag`, `w`.`remarks` AS `remarks`, `mi`.`name` AS `ministry_name`, `d`.`name` AS `department_name`, `mi`.`department_id` AS `department_id` FROM ((`worker` `w` left join `ministry` `mi` on((`mi`.`id` = `w`.`ministry_id`))) left join `department` `d` on((`d`.`id` = `mi`.`department_id`))) WHERE ((`w`.`status` = 'Active') AND `w`.`id` in (select distinct `mentee`.`worker_id` from `mentee` where ((`mentee`.`is_inactive_date` is null) AND (`mentee`.`connection_type` is not null) AND (`mentee`.`connection_type` <> '')))) ;

-- --------------------------------------------------------

--
-- Structure for view `mentor_mentee_all_in_view`
--
DROP TABLE IF EXISTS `mentor_mentee_all_in_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `mentor_mentee_all_in_view`  AS SELECT `wv`.`id` AS `Worker ID`, trim(`wv`.`name`) AS `Name`, `wv`.`department` AS `Department`, `wv`.`ministry` AS `Ministry`, trim(`m`.`name`) AS `Mentee`, `m`.`connection_type` AS `Connection Type`, `m`.`c2s_manual_status` AS `C2S Manual Status`, `m`.`is_inactive_date` AS `is_inactive_date` FROM (`worker_view` `wv` left join `mentee` `m` on((`m`.`worker_id` = `wv`.`id`))) WHERE ((`wv`.`status` = 'Active') AND (`m`.`is_inactive_date` is null)) ORDER BY `wv`.`department_id` ASC, `wv`.`ministry` ASC, `wv`.`name` ASC, `m`.`name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `mentor_mentee_status_all`
--
DROP TABLE IF EXISTS `mentor_mentee_status_all`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `mentor_mentee_status_all`  AS SELECT `wv`.`id` AS `Worker ID`, `wv`.`name` AS `Mentor`, (case when (`ms`.`Count` > 0) then 'Active' else 'Inactive' end) AS `MentorStatus`, `wv`.`department` AS `Department`, `wv`.`ministry` AS `Ministry`, `m`.`name` AS `Mentee`, (case when (`m`.`name` is null) then NULL when ((`m`.`is_inactive_date` is null) and (`m`.`name` is not null)) then 'Active' else 'Inactive' end) AS `MenteeStatus` FROM ((`worker_view` `wv` left join `mentor_status` `ms` on((`ms`.`id` = `wv`.`id`))) left join `mentee` `m` on((`m`.`worker_id` = `wv`.`id`))) ORDER BY (case when (`ms`.`Count` > 0) then 'Active' else 'Inactive' end) ASC ;

-- --------------------------------------------------------

--
-- Structure for view `mentor_mentee_view`
--
DROP TABLE IF EXISTS `mentor_mentee_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `mentor_mentee_view`  AS SELECT `wv`.`id` AS `Worker ID`, `wv`.`name` AS `Name`, `wv`.`department` AS `Department`, `wv`.`ministry` AS `Ministry`, `m`.`name` AS `Mentee` FROM (`worker_view` `wv` left join `mentee` `m` on((`m`.`worker_id` = `wv`.`id`))) WHERE (`m`.`name` is not null) ORDER BY `wv`.`department_id` ASC, `wv`.`ministry` ASC, `wv`.`name` ASC, `m`.`name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `mentor_status`
--
DROP TABLE IF EXISTS `mentor_status`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `mentor_status`  AS SELECT `w`.`id` AS `id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `Mentor`, (select count(`me`.`worker_id`) from `mentee` `me` where ((`me`.`worker_id` = `w`.`id`) and (`me`.`is_inactive_date` is null))) AS `Count` FROM (`worker` `w` join `ministry` `m`) WHERE ((`w`.`ministry_id` = `m`.`id`) AND `w`.`id` in (select `me`.`worker_id` from `mentee` `me`)) ORDER BY (select count(`me`.`worker_id`) from `mentee` `me` where ((`me`.`worker_id` = `w`.`id`) and (`me`.`is_inactive_date` is null))) DESC ;

-- --------------------------------------------------------

--
-- Structure for view `ministry_approver_view`
--
DROP TABLE IF EXISTS `ministry_approver_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `ministry_approver_view`  AS SELECT `d`.`id` AS `department_id`, `d`.`name` AS `department`, `m`.`id` AS `ministry_id`, `m`.`name` AS `ministry`, `w`.`id` AS `id`, `w`.`first_name` AS `first_name`, `w`.`last_name` AS `last_name`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `name`, `w`.`email` AS `email`, `a`.`level` AS `level`, `a`.`id` AS `approver_id` FROM (((`department` `d` left join `ministry` `m` on((`m`.`department_id` = `d`.`id`))) left join `approver` `a` on(((`a`.`ministry_id` = `m`.`id`) and (`a`.`level` = 'Ministry')))) left join `worker` `w` on((`w`.`id` = `a`.`worker_id`))) WHERE (`w`.`id` is not null) ORDER BY `d`.`id` ASC, `m`.`name` ASC, `w`.`first_name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `ministry_view`
--
DROP TABLE IF EXISTS `ministry_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `ministry_view`  AS SELECT `m`.`id` AS `id`, `m`.`name` AS `ministry`, `m`.`head_id` AS `head_id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `head_full_name`, `d`.`id` AS `department_id`, `d`.`name` AS `department` FROM ((`ministry` `m` left join `department` `d` on((`m`.`department_id` = `d`.`id`))) left join `worker` `w` on((`m`.`head_id` = `w`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `ms_assignment_view`
--
DROP TABLE IF EXISTS `ms_assignment_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `ms_assignment_view`  AS SELECT `a`.`id` AS `id`, `a`.`schedule_date` AS `schedule_date`, `a`.`worker_id` AS `worker_id`, `a`.`allotted` AS `allotted`, `a`.`created_by` AS `created_by`, `a`.`created_at` AS `created_at`, `w`.`ministry_id` AS `ministry_id`, count(`s`.`id`) AS `scans` FROM ((`ms_assignment` `a` left join `worker` `w` on(((`a`.`worker_id` = `w`.`id`) and (`w`.`ministry_id` is not null)))) left join `ms_scan` `s` on(((`w`.`id` = `s`.`worker_id`) and (`a`.`schedule_date` = cast(`s`.`date_scanned` as date)) and (`s`.`result` = 'Ok')))) GROUP BY `a`.`id`, `a`.`schedule_date`, `a`.`worker_id`, `a`.`allotted`, `a`.`created_by`, `a`.`created_at`, `w`.`ministry_id` ORDER BY `a`.`id` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `ms_scan_view`
--
DROP TABLE IF EXISTS `ms_scan_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `ms_scan_view`  AS SELECT `s`.`id` AS `id`, `s`.`date_scanned` AS `date_scanned`, `s`.`worker_id` AS `worker_id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `worker_name`, `w`.`worker_type` AS `worker_type`, `s`.`result` AS `result`, `s`.`remarks` AS `remarks`, `s`.`canteen_id` AS `canteen_id`, `c`.`name` AS `canteen`, `w`.`ministry_id` AS `ministry_id`, `m`.`name` AS `ministry`, `d`.`id` AS `department_id`, `d`.`name` AS `department` FROM ((((`ms_scan` `s` join `worker` `w` on((`s`.`worker_id` = `w`.`id`))) join `ministry` `m` on((`w`.`ministry_id` = `m`.`id`))) join `department` `d` on((`m`.`department_id` = `d`.`id`))) join `ms_canteens` `c` on((`s`.`canteen_id` = `c`.`canteen_id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `online_mentee_registration_view`
--
DROP TABLE IF EXISTS `online_mentee_registration_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `online_mentee_registration_view`  AS SELECT `omr`.`id` AS `id`, `omr`.`mentee_id` AS `mentee_id`, `omr`.`name` AS `name`, `omr`.`email` AS `email`, `omr`.`mobile` AS `mobile`, `omr`.`age` AS `age`, `omr`.`gender` AS `gender`, `omr`.`occupation` AS `occupation`, `omr`.`church` AS `church`, `omr`.`category_id` AS `category_id`, `coc`.`category_name` AS `category_name`, `omr`.`availability_day` AS `availability_day`, `omr`.`availability_time_id` AS `availability_time_id`, `cos`.`schedule` AS `schedule`, `omr`.`have_existing_c2s_group` AS `have_existing_c2s_group`, `omr`.`suggested_mentor_name` AS `suggested_mentor_name`, `omr`.`sms_sent` AS `sms_sent`, `omr`.`sys_create_by` AS `sys_create_by`, `omr`.`sys_create_date` AS `sys_create_date`, date_format(`omr`.`sys_create_date`,'%M %d, %Y %H:%i') AS `registration_date`, `omr`.`sys_update_by` AS `sys_update_by`, `omr`.`sys_update_date` AS `sys_update_date` FROM ((`online_mentee_registration` `omr` left join `c2s_online_category` `coc` on((`coc`.`id` = `omr`.`category_id`))) left join `c2s_online_schedule` `cos` on((`cos`.`id` = `omr`.`availability_time_id`))) ORDER BY `omr`.`sys_create_date` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `ors_report`
--
DROP TABLE IF EXISTS `ors_report`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `ors_report`  AS SELECT `rv`.`id` AS `id`, `rv`.`department` AS `department`, `rv`.`ministry` AS `ministry`, `rv`.`area_id` AS `area_id`, `rv`.`area` AS `area`, `rv`.`venue` AS `venue`, `rv`.`start` AS `start` FROM `rve_view` AS `rv` WHERE ((`rv`.`start` >= concat((year(now()) - 1),'-',convert(date_format(now(),'%m') using utf8mb4),'-01')) AND (`rv`.`status` = 'Approved by Admin')) ORDER BY `rv`.`start` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `request_history_view`
--
DROP TABLE IF EXISTS `request_history_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `request_history_view`  AS SELECT DISTINCT `rh`.`id` AS `id`, `rh`.`request_id` AS `request_id`, `rh`.`actor_id` AS `actor_id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `actor_name`, `w`.`email` AS `actor_email`, `a`.`level` AS `approver_level`, `rh`.`action_date` AS `action_date`, `rh`.`action` AS `action`, `rh`.`detail` AS `detail` FROM (`request_history` `rh` join (`worker` `w` left join `approver` `a` on((`a`.`worker_id` = `w`.`id`)))) WHERE (`rh`.`actor_id` = `w`.`id`) ;

-- --------------------------------------------------------

--
-- Structure for view `rve_approver_view`
--
DROP TABLE IF EXISTS `rve_approver_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `rve_approver_view`  AS SELECT `a`.`id` AS `approver_id`, `aw`.`id` AS `approver_worker_id`, concat(`aw`.`first_name`,' ',`aw`.`last_name`) AS `approver_name`, `aw`.`email` AS `approver_email`, `r`.`id` AS `id`, `r`.`requestor_id` AS `requestor_id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `requestor_name`, `w`.`email` AS `requestor_email`, `m`.`name` AS `ministry`, `m`.`id` AS `ministry_id`, `d`.`name` AS `department`, `d`.`id` AS `department_id`, `r`.`request_ve_id` AS `request_ve_id`, `r`.`status` AS `status`, `r`.`sys_update_date` AS `sys_update_date`, `r`.`sys_update_id` AS `sys_update_id`, `r`.`sys_create_date` AS `sys_create_date`, `r`.`sys_create_id` AS `sys_create_id`, `rv`.`purpose` AS `purpose`, `v`.`id` AS `venue_id`, `v`.`name` AS `venue`, `ar`.`id` AS `area_id`, `ar`.`name` AS `area`, `rv`.`start` AS `start`, `rv`.`end` AS `end`, `rv`.`setup_chairs` AS `setup_chairs`, `rv`.`setup_tables` AS `setup_tables`, `rv`.`pax` AS `pax`, `rv`.`special_instructions` AS `special_instructions` FROM ((((((((`approver` `a` join `worker` `aw`) join `request_ve` `rv`) join `worker` `w`) join `venue` `v`) join `area` `ar`) join `ministry` `m`) join `department` `d`) join `request` `r`) WHERE ((`a`.`level` = 'Ministry') AND (`a`.`worker_id` = `aw`.`id`) AND (`w`.`ministry_id` = `a`.`ministry_id`) AND (`w`.`id` = `r`.`requestor_id`) AND (`r`.`request_ve_id` = `rv`.`id`) AND (`rv`.`venue_id` = `v`.`id`) AND (`v`.`area_id` = `ar`.`id`) AND (`w`.`ministry_id` = `m`.`id`) AND (`m`.`department_id` = `d`.`id`))union select `a`.`id` AS `approver_id`,`aw`.`id` AS `approver_worker_id`,concat(`aw`.`first_name`,' ',`aw`.`last_name`) AS `approver_name`,`aw`.`email` AS `approver_email`,`r`.`id` AS `id`,`r`.`requestor_id` AS `requestor_id`,concat(`w`.`first_name`,' ',`w`.`last_name`) AS `requestor_name`,`w`.`email` AS `requestor_email`,`m`.`name` AS `ministry`,`m`.`id` AS `ministry_id`,`d`.`name` AS `department`,`d`.`id` AS `department_id`,`r`.`request_ve_id` AS `request_ve_id`,`r`.`status` AS `status`,`r`.`sys_update_date` AS `sys_update_date`,`r`.`sys_update_id` AS `sys_update_id`,`r`.`sys_create_date` AS `sys_create_date`,`r`.`sys_create_id` AS `sys_create_id`,`rv`.`purpose` AS `purpose`,`v`.`id` AS `venue_id`,`v`.`name` AS `venue`,`ar`.`id` AS `area_id`,`ar`.`name` AS `area`,`rv`.`start` AS `start`,`rv`.`end` AS `end`,`rv`.`setup_chairs` AS `setup_chairs`,`rv`.`setup_tables` AS `setup_tables`,`rv`.`pax` AS `pax`,`rv`.`special_instructions` AS `special_instructions` from ((((((((`approver` `a` join `worker` `aw`) join `request_ve` `rv`) join `worker` `w`) join `venue` `v`) join `area` `ar`) join `ministry` `m`) join `department` `d`) join `request` `r`) where ((`a`.`level` = 'Department') and (`a`.`worker_id` = `aw`.`id`) and (`d`.`id` = `a`.`department_id`) and (`w`.`id` = `r`.`requestor_id`) and (`r`.`request_ve_id` = `rv`.`id`) and (`rv`.`venue_id` = `v`.`id`) and (`v`.`area_id` = `ar`.`id`) and (`w`.`ministry_id` = `m`.`id`) and (`m`.`department_id` = `d`.`id`)) order by `start`  ;

-- --------------------------------------------------------

--
-- Structure for view `rve_equipment_view`
--
DROP TABLE IF EXISTS `rve_equipment_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `rve_equipment_view`  AS SELECT `rve`.`id` AS `id`, `e`.`type` AS `type`, group_concat(`e`.`id` separator ',') AS `equipment_ids`, group_concat(`e`.`name` separator ',') AS `equipments` FROM ((`request_ve` `rve` join `request_ve_equipment` `rvee`) join `equipment` `e`) WHERE ((`rvee`.`request_ve_id` = `rve`.`id`) AND (`rvee`.`equipment_id` = `e`.`id`)) GROUP BY `rve`.`id`, `e`.`type` ;

-- --------------------------------------------------------

--
-- Structure for view `rve_past_approvals_view`
--
DROP TABLE IF EXISTS `rve_past_approvals_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `rve_past_approvals_view`  AS SELECT DISTINCT `rhv`.`actor_id` AS `actor_id`, `r`.`id` AS `id`, `r`.`requestor_id` AS `requestor_id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `requestor_name`, `r`.`request_ve_id` AS `request_ve_id`, `r`.`status` AS `status`, `r`.`status_by_id` AS `status_by_id`, concat(`stat`.`first_name`,' ',`stat`.`last_name`) AS `status_by`, `r`.`sys_update_date` AS `sys_update_date`, `r`.`sys_update_id` AS `sys_update_id`, `r`.`sys_create_date` AS `sys_create_date`, `r`.`sys_create_id` AS `sys_create_id`, `rv`.`purpose` AS `purpose`, `v`.`id` AS `venue_id`, `v`.`name` AS `venue`, `rv`.`start` AS `start`, `rv`.`end` AS `end` FROM (((`request_ve` `rv` join `venue` `v`) join `worker` `w`) join ((`request` `r` left join `worker` `stat` on((`r`.`status_by_id` = `stat`.`id`))) left join `request_history_view` `rhv` on(((`rhv`.`request_id` = `r`.`id`) and (`rhv`.`action` in ('Approved by Ministry Head','Approved by Admin','Rejected')))))) WHERE ((`r`.`request_ve_id` = `rv`.`id`) AND (`w`.`id` = `r`.`requestor_id`) AND (`rv`.`venue_id` = `v`.`id`) AND (`rhv`.`actor_id` is not null)) ;

-- --------------------------------------------------------

--
-- Structure for view `rve_view`
--
DROP TABLE IF EXISTS `rve_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `rve_view`  AS SELECT `r`.`id` AS `id`, `r`.`requestor_id` AS `requestor_id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `requestor_name`, `w`.`email` AS `requestor_email`, `w`.`mobile` AS `requestor_mobile`, `m`.`name` AS `ministry`, `m`.`id` AS `ministry_id`, `d`.`name` AS `department`, `d`.`id` AS `department_id`, `r`.`request_ve_id` AS `request_ve_id`, `r`.`status` AS `status`, `r`.`status_by_id` AS `status_by_id`, concat(`stat`.`first_name`,' ',`stat`.`last_name`) AS `status_by`, `r`.`sys_update_date` AS `sys_update_date`, `r`.`sys_update_id` AS `sys_update_id`, `r`.`sys_create_date` AS `sys_create_date`, `r`.`sys_create_id` AS `sys_create_id`, `rv`.`purpose` AS `purpose`, `rv`.`id` AS `rve_id`, `rv`.`request_group` AS `request_group`, `v`.`id` AS `venue_id`, `v`.`name` AS `venue`, `v`.`short_name` AS `venue_short_name`, `a`.`id` AS `area_id`, `a`.`name` AS `area`, `rv`.`start` AS `start`, `rv`.`end` AS `end`, `rvee_audio`.`equipment_ids` AS `audio_equipment_ids`, `rvee_multimedia`.`equipment_ids` AS `multimedia_equipment_ids`, `rvee_audio`.`equipments` AS `audio_equipments`, `rvee_multimedia`.`equipments` AS `multimedia_equipments`, `rv`.`setup_chairs` AS `setup_chairs`, `rv`.`setup_tables` AS `setup_tables`, `rv`.`pax` AS `pax`, `rv`.`special_instructions` AS `special_instructions` FROM ((((`request_ve` `rv` join `venue` `v`) join `area` `a`) join (((`request` `r` left join `rve_equipment_view` `rvee_audio` on(((`rvee_audio`.`id` = `r`.`id`) and (`rvee_audio`.`type` = 'Audio')))) left join `rve_equipment_view` `rvee_multimedia` on(((`rvee_multimedia`.`id` = `r`.`id`) and (`rvee_multimedia`.`type` = 'Multimedia')))) left join `worker` `stat` on((`r`.`status_by_id` = `stat`.`id`)))) join ((`worker` `w` left join `ministry` `m` on((`w`.`ministry_id` = `m`.`id`))) left join `department` `d` on((`m`.`department_id` = `d`.`id`)))) WHERE ((`r`.`request_ve_id` = `rv`.`id`) AND (`w`.`id` = `r`.`requestor_id`) AND (`rv`.`venue_id` = `v`.`id`) AND (`v`.`area_id` = `a`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `rve_view_api`
--
DROP TABLE IF EXISTS `rve_view_api`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `rve_view_api`  AS SELECT `r`.`id` AS `id`, `r`.`requestor_id` AS `requestor_id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `requestor_name`, `w`.`email` AS `requestor_email`, `w`.`mobile` AS `requestor_mobile`, `m`.`name` AS `ministry`, `m`.`id` AS `ministry_id`, `d`.`name` AS `department`, `d`.`id` AS `department_id`, `r`.`request_ve_id` AS `request_ve_id`, `r`.`status` AS `status`, `r`.`status_by_id` AS `status_by_id`, concat(`stat`.`first_name`,' ',`stat`.`last_name`) AS `status_by`, `r`.`sys_update_date` AS `sys_update_date`, `r`.`sys_update_id` AS `sys_update_id`, `r`.`sys_create_date` AS `sys_create_date`, `r`.`sys_create_id` AS `sys_create_id`, `rv`.`purpose` AS `purpose`, `rv`.`id` AS `rve_id`, `rv`.`request_group` AS `request_group`, `v`.`id` AS `venue_id`, `v`.`name` AS `venue`, `v`.`short_name` AS `venue_short_name`, `a`.`id` AS `area_id`, `a`.`name` AS `area`, `rv`.`start` AS `event_date`, `rv`.`start` AS `start`, `rv`.`end` AS `end`, (case when (`rvee_audio`.`equipment_ids` is null) then '' else 'Y' end) AS `has_audio_equipment`, (case when (`rvee_multimedia`.`equipment_ids` is null) then '' else 'Y' end) AS `has_multimedia_equipment`, `rvee_audio`.`equipment_ids` AS `audio_equipment_ids`, `rvee_multimedia`.`equipment_ids` AS `multimedia_equipment_ids`, `rvee_audio`.`equipments` AS `audio_equipments`, `rvee_multimedia`.`equipments` AS `multimedia_equipments`, `rv`.`setup_chairs` AS `setup_chairs`, `rv`.`setup_tables` AS `setup_tables`, `rv`.`pax` AS `pax`, `rv`.`special_instructions` AS `special_instructions` FROM ((((`request_ve` `rv` join `venue` `v`) join `area` `a`) join (((`request` `r` left join `rve_equipment_view` `rvee_audio` on(((`rvee_audio`.`id` = `r`.`id`) and (`rvee_audio`.`type` = 'Audio')))) left join `rve_equipment_view` `rvee_multimedia` on(((`rvee_multimedia`.`id` = `r`.`id`) and (`rvee_multimedia`.`type` = 'Multimedia')))) left join `worker` `stat` on((`r`.`status_by_id` = `stat`.`id`)))) join ((`worker` `w` left join `ministry` `m` on((`w`.`ministry_id` = `m`.`id`))) left join `department` `d` on((`m`.`department_id` = `d`.`id`)))) WHERE ((`r`.`request_ve_id` = `rv`.`id`) AND (`w`.`id` = `r`.`requestor_id`) AND (`rv`.`venue_id` = `v`.`id`) AND (`v`.`area_id` = `a`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `rve_view_no_fix`
--
DROP TABLE IF EXISTS `rve_view_no_fix`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `rve_view_no_fix`  AS SELECT `r`.`id` AS `id`, `r`.`requestor_id` AS `requestor_id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `requestor_name`, `r`.`status` AS `status`, `rv`.`purpose` AS `purpose`, `v`.`name` AS `venue`, `rv`.`start` AS `start`, `rv`.`end` AS `end` FROM ((`request_ve` `rv` join `request` `r`) join (`venue` `v` join `worker` `w`)) WHERE ((`r`.`request_ve_id` = `rv`.`id`) AND (`rv`.`venue_id` = `v`.`id`) AND (`w`.`id` = `r`.`requestor_id`) AND (`rv`.`request_group` = 0)) ;

-- --------------------------------------------------------

--
-- Structure for view `r_view`
--
DROP TABLE IF EXISTS `r_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `r_view`  AS SELECT `r`.`id` AS `id`, `r`.`requestor_id` AS `requestor_id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `requestor_name`, `w`.`email` AS `requestor_email`, `m`.`name` AS `ministry`, `m`.`id` AS `ministry_id`, `d`.`name` AS `department`, `d`.`id` AS `department_id`, `r`.`request_ve_id` AS `request_ve_id`, `r`.`status` AS `status`, `r`.`status_by_id` AS `status_by_id`, concat(`stat`.`first_name`,' ',`stat`.`last_name`) AS `status_by`, `r`.`sys_update_date` AS `sys_update_date`, `r`.`sys_update_id` AS `sys_update_id`, `r`.`sys_create_date` AS `sys_create_date`, `r`.`sys_create_id` AS `sys_create_id` FROM (((`worker` `w` left join `ministry` `m` on((`w`.`ministry_id` = `m`.`id`))) left join `department` `d` on((`m`.`department_id` = `d`.`id`))) join (`request` `r` left join `worker` `stat` on((`r`.`status_by_id` = `stat`.`id`)))) WHERE (`w`.`id` = `r`.`requestor_id`) ;

-- --------------------------------------------------------

--
-- Structure for view `simple_masterview`
--
DROP TABLE IF EXISTS `simple_masterview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `simple_masterview`  AS SELECT `r`.`id` AS `id`, `r`.`status` AS `status`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `requestor_name`, `w`.`mobile` AS `requestor_mobile`, `rv`.`purpose` AS `purpose`, `v`.`id` AS `venue_id`, `v`.`name` AS `venue`, `v`.`area_id` AS `area_id`, `rv`.`request_group` AS `request_group`, `rv`.`start` AS `start`, `rv`.`end` AS `end`, `rv`.`setup_chairs` AS `setup_chairs`, `rv`.`setup_tables` AS `setup_tables`, `rv`.`pax` AS `pax`, `rv`.`special_instructions` AS `special_instructions` FROM ((`worker` `w` join (`request_ve` `rv` join `venue` `v`)) join `request` `r`) WHERE ((`r`.`request_ve_id` = `rv`.`id`) AND (`w`.`id` = `r`.`requestor_id`) AND (`rv`.`venue_id` = `v`.`id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `sr_resources_per_sr_and_category_view`
--
DROP TABLE IF EXISTS `sr_resources_per_sr_and_category_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `sr_resources_per_sr_and_category_view`  AS SELECT `srr`.`id` AS `id`, `srr`.`sr_id` AS `sr_id`, `srr`.`sr_category_id` AS `sr_category_id`, `sr_cat`.`name` AS `sr_category`, `srr`.`details` AS `resource_details`, group_concat(`srr_sub`.`sr_subcategory_id` separator ',') AS `sr_subcategory_ids`, group_concat(`sr_sub`.`name` separator ',') AS `sr_subcategories` FROM (((`sr_resources` `srr` left join `sr_resources_subcategory` `srr_sub` on((`srr`.`id` = `srr_sub`.`sr_resources_id`))) left join `sr_subcategory` `sr_sub` on((`srr_sub`.`sr_subcategory_id` = `sr_sub`.`id`))) left join `sr_category` `sr_cat` on((`srr`.`sr_category_id` = `sr_cat`.`id`))) GROUP BY `srr`.`sr_id`, `srr`.`sr_category_id` ;

-- --------------------------------------------------------

--
-- Structure for view `sr_resources_per_sr_view`
--
DROP TABLE IF EXISTS `sr_resources_per_sr_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `sr_resources_per_sr_view`  AS SELECT `srr`.`sr_id` AS `sr_id`, group_concat(`srr_sub`.`sr_subcategory_id` separator ',') AS `sr_subcategory_ids`, group_concat(`sr_sub`.`name` separator ',') AS `sr_subcategories` FROM ((`sr_resources` `srr` left join `sr_resources_subcategory` `srr_sub` on((`srr`.`id` = `srr_sub`.`sr_resources_id`))) left join `sr_subcategory` `sr_sub` on((`srr_sub`.`sr_subcategory_id` = `sr_sub`.`id`))) GROUP BY `srr`.`sr_id` ;

-- --------------------------------------------------------

--
-- Structure for view `sr_resources_subcategory_view`
--
DROP TABLE IF EXISTS `sr_resources_subcategory_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `sr_resources_subcategory_view`  AS SELECT `resources_sub`.`id` AS `id`, `resources_sub`.`sr_resources_id` AS `sr_resources_id`, `resources_sub`.`sr_subcategory_id` AS `sr_subcategory_id`, `resources`.`sr_category_id` AS `sr_category_id`, `resources`.`sr_id` AS `sr_id`, `resources`.`details` AS `resource_details`, `category`.`name` AS `sr_category`, `sub`.`name` AS `sr_subcategory` FROM (((`sr_resources_subcategory` `resources_sub` left join `sr_resources` `resources` on((`resources_sub`.`sr_resources_id` = `resources`.`id`))) left join `sr_category` `category` on((`resources`.`sr_category_id` = `category`.`id`))) left join `sr_subcategory` `sub` on((`resources_sub`.`sr_subcategory_id` = `sub`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `sr_subcategory_view`
--
DROP TABLE IF EXISTS `sr_subcategory_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `sr_subcategory_view`  AS SELECT `srs`.`id` AS `id`, `srs`.`name` AS `subcategory`, `srs`.`remarks` AS `remarks`, `srs`.`sr_category_id` AS `sr_category_id`, `srs`.`weight` AS `weight`, `src`.`name` AS `category`, `src`.`sr_type_id` AS `sr_type_id`, `srt`.`name` AS `sr_type`, `srt`.`code` AS `sr_type_code`, `srt`.`assigned_ministry_id` AS `assigned_ministry_id` FROM ((`sr_subcategory` `srs` left join `sr_category` `src` on((`srs`.`sr_category_id` = `src`.`id`))) left join `sr_type` `srt` on((`src`.`sr_type_id` = `srt`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `sr_type_view`
--
DROP TABLE IF EXISTS `sr_type_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `sr_type_view`  AS SELECT `type`.`id` AS `id`, `type`.`name` AS `name`, `type`.`code` AS `code`, `type`.`assigned_ministry_id` AS `assigned_ministry_id`, `type`.`view_name` AS `view_name`, `assigned_ministry`.`name` AS `ministry`, `assigned_ministry`.`head_id` AS `ministry_head_id`, `assigned_ministry_head`.`first_name` AS `ministry_head_first_name`, `assigned_ministry_head`.`last_name` AS `ministry_head_last_name`, concat(`assigned_ministry_head`.`first_name`,' ',`assigned_ministry_head`.`last_name`) AS `ministry_head_full_name`, `assigned_ministry_head`.`email` AS `ministry_head_email`, `admin_head`.`id` AS `admin_head_id`, `admin_head`.`first_name` AS `admin_head_first_name`, `admin_head`.`last_name` AS `admin_head_last_name`, concat(`admin_head`.`first_name`,' ',`admin_head`.`last_name`) AS `admin_head_full_name`, `admin_head`.`email` AS `admin_head_email` FROM (((`sr_type` `type` left join `ministry` `assigned_ministry` on((`assigned_ministry`.`id` = `type`.`assigned_ministry_id`))) left join `worker` `assigned_ministry_head` on((`assigned_ministry_head`.`id` = `assigned_ministry`.`head_id`))) left join `worker` `admin_head` on((`admin_head`.`id` = (select `department`.`head_id` from `department` where (`department`.`id` = 5))))) ;

-- --------------------------------------------------------

--
-- Structure for view `sr_view`
--
DROP TABLE IF EXISTS `sr_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `sr_view`  AS SELECT `sr`.`id` AS `id`, `sr`.`title` AS `title`, `sr`.`description` AS `description`, `sr`.`due_date` AS `due_date`, `sr`.`request_status_id` AS `request_status_id`, `sr`.`sr_type_id` AS `sr_type_id`, `sr`.`sys_create_date` AS `sr_create_date`, `sr`.`sys_create_id` AS `sr_create_id`, `sr`.`sys_update_date` AS `sr_update_date`, `sr`.`sys_update_id` AS `sr_update_id`, `status`.`name` AS `status_name`, `status`.`code` AS `status_code`, `type`.`name` AS `sr_type_name`, `type`.`code` AS `sr_type_code`, `type`.`assigned_ministry_id` AS `assigned_ministry_id`, `resources`.`sr_subcategory_ids` AS `sr_subcategory_ids`, `resources`.`sr_subcategories` AS `sr_subcategories`, `w`.`name` AS `sr_requestor_name`, `w`.`ministry_id` AS `sr_requestor_ministry_id`, `w`.`ministry` AS `sr_requestor_ministry`, `w`.`department_id` AS `sr_requestor_department_id`, `w`.`department` AS `sr_requestor_department` FROM ((((`service_request` `sr` left join `sr_status` `status` on((`sr`.`request_status_id` = `status`.`id`))) left join `sr_type` `type` on((`sr`.`sr_type_id` = `type`.`id`))) left join `sr_resources_per_sr_view` `resources` on((`sr`.`id` = `resources`.`sr_id`))) left join `worker_view` `w` on((`sr`.`sys_create_id` = `w`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `sr_work_order_ah_view`
--
DROP TABLE IF EXISTS `sr_work_order_ah_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `sr_work_order_ah_view`  AS SELECT `ahw`.`id` AS `id`, `ahw`.`ah_type_id` AS `ah_type_id`, `ahw`.`ah_type` AS `ah_type`, `ahw`.`ah_type_code` AS `ah_type_code`, `ahw`.`ah_mapping_id` AS `ah_mapping_id`, `swo`.`id` AS `work_order_id`, `swo`.`sr_id` AS `sr_id`, `swo`.`sr_type_id` AS `sr_type_id`, `swo`.`sr_type` AS `sr_type`, `swo`.`sr_type_code` AS `sr_type_code`, `swo`.`sr_category` AS `sr_category`, `swo`.`sr_subcategory` AS `sr_subcategory`, `ahw`.`action` AS `action`, `ahw`.`action_date` AS `action_date`, `ahw`.`detail` AS `detail`, `ahw`.`actor_id` AS `actor_id`, `ahw`.`actor_first_name` AS `actor_first_name`, `ahw`.`actor_last_name` AS `actor_last_name`, `ahw`.`actor_full_name` AS `actor_full_name` FROM (`action_history_view` `ahw` left join `sr_work_order_view` `swo` on((`ahw`.`ah_mapping_id` = `swo`.`id`))) WHERE (`ahw`.`ah_type_code` = 'WORK_ORDER') ;

-- --------------------------------------------------------

--
-- Structure for view `sr_work_order_view`
--
DROP TABLE IF EXISTS `sr_work_order_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `sr_work_order_view`  AS SELECT `swo`.`id` AS `id`, `swo`.`sr_id` AS `sr_id`, `sr`.`sr_type_id` AS `sr_type_id`, `srt`.`name` AS `sr_type`, `srt`.`code` AS `sr_type_code`, `srt`.`assigned_ministry_id` AS `sr_assigned_ministry_id`, `sr`.`title` AS `sr_title`, `sr`.`description` AS `sr_description`, `sr`.`request_status_id` AS `sr_request_status_id`, `srs`.`name` AS `request_status`, `sr`.`due_date` AS `sr_due_date`, `sr`.`sys_create_date` AS `sr_sys_create_date`, concat(`create_by_worker`.`first_name`,' ',`create_by_worker`.`last_name`) AS `sr_requestor_full_name`, `swo`.`sr_category_id` AS `sr_category_id`, `swo`.`sr_subcategory_id` AS `sr_subcategory_id`, `swo`.`assigned_worker_id` AS `assigned_worker_id`, `sc`.`name` AS `sr_category`, `ss`.`name` AS `sr_subcategory`, `assigned_worker`.`first_name` AS `assigned_worker_first_name`, `assigned_worker`.`last_name` AS `assigned_worker_last_name`, concat(`assigned_worker`.`first_name`,' ',`assigned_worker`.`last_name`) AS `assigned_worker_full_name`, `last_assigned_by`.`first_name` AS `last_assigned_by_first_name`, `last_assigned_by`.`last_name` AS `last_assigned_by_last_name`, concat(`last_assigned_by`.`first_name`,' ',`last_assigned_by`.`last_name`) AS `last_assigned_by_full_name`, `swo`.`assigned_date` AS `assigned_date`, `swo`.`sys_create_id` AS `sys_create_id`, `swo`.`sys_create_date` AS `sys_create_date`, `swo`.`sys_update_id` AS `sys_update_id`, `swo`.`sys_update_date` AS `sys_update_date` FROM ((((((((`sr_work_order` `swo` left join `sr_category` `sc` on((`swo`.`sr_category_id` = `sc`.`id`))) left join `service_request` `sr` on((`swo`.`sr_id` = `sr`.`id`))) left join `sr_type` `srt` on((`sr`.`sr_type_id` = `srt`.`id`))) left join `sr_status` `srs` on((`sr`.`request_status_id` = `srs`.`id`))) left join `worker` `create_by_worker` on((`sr`.`sys_create_id` = `create_by_worker`.`id`))) left join `sr_subcategory` `ss` on((`swo`.`sr_subcategory_id` = `ss`.`id`))) left join `worker` `assigned_worker` on((`swo`.`assigned_worker_id` = `assigned_worker`.`id`))) left join `worker` `last_assigned_by` on((`swo`.`last_assigned_by` = `last_assigned_by`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `venue_view`
--
DROP TABLE IF EXISTS `venue_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `venue_view`  AS SELECT `a`.`id` AS `area_id`, `a`.`name` AS `area_name`, `a`.`short_name` AS `area_short_name`, `v`.`id` AS `venue_id`, `v`.`name` AS `venue_name`, `v`.`short_name` AS `venue_short_name`, `v`.`weight` AS `venue_weight` FROM (`venue` `v` join `area` `a`) WHERE (`v`.`area_id` = `a`.`id`) ORDER BY `a`.`id` ASC, `v`.`weight` ASC, `v`.`name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `worker_count_by_department_view`
--
DROP TABLE IF EXISTS `worker_count_by_department_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `worker_count_by_department_view`  AS SELECT `worker_view`.`department` AS `department`, count(1) AS `Worker Count` FROM `worker_view` GROUP BY `worker_view`.`department` ORDER BY `worker_view`.`department` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `worker_count_by_ministry_view`
--
DROP TABLE IF EXISTS `worker_count_by_ministry_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `worker_count_by_ministry_view`  AS SELECT `worker_view`.`department` AS `department`, `worker_view`.`ministry` AS `ministry`, count(1) AS `Worker Count` FROM `worker_view` WHERE (`worker_view`.`area_id` <> 0) GROUP BY `worker_view`.`department`, `worker_view`.`ministry` ORDER BY `worker_view`.`department` ASC, `worker_view`.`ministry` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `worker_mentee_all_in_view`
--
DROP TABLE IF EXISTS `worker_mentee_all_in_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `worker_mentee_all_in_view`  AS SELECT `w`.`department` AS `Department`, `w`.`ministry` AS `Ministry`, `w`.`id` AS `Worker ID`, `w`.`last_name` AS `Last Name`, `w`.`first_name` AS `First Name`, `w`.`area_id` AS `Area_ID`, group_concat(`m`.`name` order by `m`.`name` ASC separator ', ') AS `Mentees` FROM (`worker_view` `w` left join `mentee` `m` on((`w`.`id` = `m`.`worker_id`))) WHERE (upper(`w`.`status`) = 'ACTIVE') GROUP BY `w`.`department`, `w`.`ministry`, `w`.`id`, `w`.`last_name`, `w`.`first_name` ORDER BY `w`.`last_name` ASC, `w`.`first_name` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `worker_pass_view`
--
DROP TABLE IF EXISTS `worker_pass_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `worker_pass_view`  AS SELECT `wpass`.`id` AS `worker_pass_id`, `wpb`.`id` AS `batch_id`, concat(`w`.`first_name`,' ',`w`.`last_name`) AS `approver`, `w`.`first_name` AS `approver_first_name`, `w`.`last_name` AS `approver_last_name`, `wpb`.`approver_id` AS `approver_id`, `wpb`.`satellite_id` AS `satellite_id`, `wpb`.`batch_type` AS `batch_type`, `sat`.`name` AS `name`, `wpb`.`service_date` AS `service_date`, `wpass`.`worker_name` AS `worker_name`, `wpb`.`key` AS `key`, `wpb`.`batch_url` AS `batch_url`, `wpass`.`image_url` AS `image_url`, `wpb`.`created_date` AS `batch_created_date`, `wpass`.`created_date` AS `worker_pass_created_date` FROM (((`worker_pass_batch` `wpb` left join `worker_pass` `wpass` on((`wpb`.`id` = `wpass`.`batch_id`))) left join `satellite` `sat` on((`sat`.`id` = `wpb`.`satellite_id`))) left join `worker` `w` on((`w`.`id` = `wpb`.`approver_id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `worker_training_view`
--
DROP TABLE IF EXISTS `worker_training_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `worker_training_view`  AS SELECT `wv`.`id` AS `worker_id`, `wv`.`church_id` AS `church_id`, `wv`.`first_name` AS `first_name`, `wv`.`last_name` AS `last_name`, `wv`.`email` AS `email`, `wv`.`username` AS `username`, `wv`.`password` AS `password`, `wv`.`mobile` AS `mobile`, `wv`.`area_id` AS `area_id`, `wv`.`address` AS `address`, `wv`.`birthdate` AS `birthdate`, `wv`.`facebook_handle` AS `facebook_handle`, `wv`.`ministry_id` AS `ministry_id`, `wv`.`type` AS `type`, `wv`.`status` AS `status`, `wv`.`remarks` AS `remarks`, `wv`.`sys_create_id` AS `sys_create_id`, `wv`.`last_password_change_date` AS `last_password_change_date`, `wv`.`sys_create_date` AS `sys_create_date`, `wv`.`sys_update_id` AS `sys_update_id`, `wv`.`sys_update_date` AS `sys_update_date`, `wv`.`flag` AS `flag`, `wv`.`name` AS `name`, `wv`.`ministry` AS `ministry`, `wv`.`department_id` AS `department_id`, `wv`.`department` AS `department`, `wv`.`qrdata` AS `qrdata`, `wv`.`worker_type` AS `worker_type`, `wv`.`worker_status` AS `worker_status`, `t`.`id` AS `training_id`, `t`.`name` AS `training_name`, `wtm`.`month_completed` AS `month_completed`, `wtm`.`year_completed` AS `year_completed`, `t`.`sort_order` AS `sort_order` FROM ((`worker_view` `wv` left join `worker_training_mapping` `wtm` on((`wv`.`id` = `wtm`.`worker_id`))) left join `training` `t` on((`t`.`id` = `wtm`.`training_id`))) ORDER BY `wv`.`id` ASC, `t`.`sort_order` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `worker_view`
--
DROP TABLE IF EXISTS `worker_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`cogdasma`@`localhost` SQL SECURITY DEFINER VIEW `worker_view`  AS SELECT `w`.`id` AS `id`, `w`.`church_id` AS `church_id`, trim(`w`.`first_name`) AS `first_name`, trim(`w`.`last_name`) AS `last_name`, `w`.`email` AS `email`, `w`.`username` AS `username`, `w`.`password` AS `password`, `w`.`mobile` AS `mobile`, `w`.`area_id` AS `area_id`, `w`.`address` AS `address`, `w`.`birthdate` AS `birthdate`, `w`.`facebook_handle` AS `facebook_handle`, `w`.`ministry_id` AS `ministry_id`, (case when (`w`.`id` = `m`.`head_id`) then 1 else 0 end) AS `is_ministry_head`, (case when ((`d`.`id` <> 5) and `w`.`id` in (select `department`.`head_id` from `department` where (`department`.`id` <> 5))) then 1 else 0 end) AS `is_dept_head`, (case when ((`d`.`id` in (5,6)) and (`w`.`id` = (select `department`.`head_id` from `department` where (`department`.`id` = 5)))) then 1 else 0 end) AS `is_admin_head`, `w`.`type` AS `type`, `w`.`status` AS `status`, `w`.`worker_status` AS `worker_status`, `w`.`last_password_change_date` AS `last_password_change_date`, `w`.`remarks` AS `remarks`, `w`.`sys_create_id` AS `sys_create_id`, `w`.`sys_create_date` AS `sys_create_date`, `w`.`sys_update_id` AS `sys_update_id`, `w`.`sys_update_date` AS `sys_update_date`, `w`.`flag` AS `flag`, concat(trim(`w`.`first_name`),' ',trim(`w`.`last_name`)) AS `name`, `m`.`name` AS `ministry`, `d`.`id` AS `department_id`, `d`.`name` AS `department`, `w`.`qrdata` AS `qrdata`, `w`.`worker_type` AS `worker_type`, `w`.`biometrics_id` AS `biometrics_id` FROM ((`worker` `w` left join `ministry` `m` on((`w`.`ministry_id` = `m`.`id`))) left join `department` `d` on((`m`.`department_id` = `d`.`id`))) ORDER BY `w`.`first_name` ASC, `w`.`last_name` ASC ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
