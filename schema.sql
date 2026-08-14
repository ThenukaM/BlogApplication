CREATE TABLE IF NOT EXISTS `user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'user',
  `avatar` VARCHAR(10) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `blogPost`
CREATE TABLE IF NOT EXISTS `blogPost` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'General',
  `excerpt` TEXT DEFAULT NULL,
  `image_url` VARCHAR(255) NOT NULL DEFAULT 'images/cover_ai.png',
  `author_name` VARCHAR(100) DEFAULT 'Alex Rivera',
  `author_avatar` VARCHAR(10) DEFAULT 'AR',
  `read_time` VARCHAR(50) DEFAULT '5 min read',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Seed User (Password: password123)
INSERT INTO `user` (`id`, `username`, `email`, `password`, `role`, `avatar`, `created_at`) VALUES
(1, 'Alex Rivera', 'alex@bytediaries.com', 'password123', 'admin', 'AR', NOW())
ON DUPLICATE KEY UPDATE `password`='password123', `role`='admin';

-- Insert Seed Articles
INSERT INTO `blogPost` (`title`, `category`, `excerpt`, `content`, `image_url`, `author_name`, `author_avatar`, `read_time`, `user_id`, `created_at`, `updated_at`) VALUES
(
  'Building Next-Gen AI Applications with Gemini & Neural Pipelines',
  'Artificial Intelligence',
  'Discover how modern AI architectures are transforming intelligent web applications, real-time inference, and edge processing.',
  'Artificial intelligence is evolving rapidly. From multi-modal LLMs to real-time audio and video streaming, modern developers have access to capabilities that were unimaginable a few years ago. In this article, we explore how neural pipelines and Gemini APIs integrate seamlessly into production applications.',
  'images/cover_ai.png',
  'Alex Rivera',
  'AR',
  '5 min read',
  1,
  '2026-08-12 14:30:00',
  '2026-08-12 14:30:00'
),
(
  'Mastering Glassmorphism & Micro-Animations in Modern CSS',
  'Web Development',
  'Learn how to create visually breathtaking UI components using modern CSS color spaces, backdrop filters, and smooth fluid animations.',
  'Glassmorphism brings depth, texture, and elegance to user interfaces. By leveraging modern backdrop-filter techniques, subtle translucent borders, and hardware-accelerated micro-animations, you can create immersive visual experiences that wow your users.',
  'images/cover_webdev.png',
  'sarahchen',
  'SL',
  '4 min read',
  NULL,
  '2026-08-10 11:15:00',
  '2026-08-10 11:15:00'
),
(
  'Scaling Serverless Infrastructure for High-Throughput Workloads',
  'Cloud Architecture',
  'A deep dive into distributed systems, autoscaling microservices, and optimizing cloud data pipelines for maximum performance.',
  'Designing resilient cloud infrastructure requires a balance of serverless scalability, low latency caching, and database connection pooling. We examine best practices for architecting high-availability cloud applications.',
  'images/cover_cloud.png',
  'marcusvance',
  'MK',
  '6 min read',
  NULL,
  '2026-08-08 09:45:00',
  '2026-08-08 09:45:00'
);
