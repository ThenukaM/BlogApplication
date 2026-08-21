<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// Helper to execute PDO queries safely
if (!function_exists('executePdoQuery')) {
    function executePdoQuery($pdo, $sql, $params = []) {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
}

// Helper to compute initials
function getInitialsAvatar($name) {
    $parts = explode(' ', trim($name));
    $avatar = strtoupper(substr($parts[0], 0, 1));
    if (count($parts) > 1) {
        $avatar .= strtoupper(substr(end($parts), 0, 1));
    }
    return $avatar;
}

// Check Current Auth Status
if ($action === 'check_auth') {
    $isLoggedIn = isset($_SESSION['user']);
    echo json_encode([
        'success' => true,
        'authenticated' => $isLoggedIn,
        'user' => $isLoggedIn ? $_SESSION['user'] : null
    ]);
    exit;
}

// User Registration
if ($action === 'register' && $method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?? $_POST;

    $username = trim($data['username'] ?? $data['name'] ?? '');
    $email    = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';
    $role     = trim($data['role'] ?? 'user');

    if (empty($username) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'All fields (Username, Email, Password) are required.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid email address format.']);
        exit;
    }

    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters.']);
        exit;
    }

    try {
        $pdo = getDBConnection();
        
        // Check if email already registered
        $checkStmt = executePdoQuery($pdo, "SELECT id FROM `user` WHERE email = :email", [':email' => $email]);
        if ($checkStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Email address is already registered.']);
            exit;
        }

        $avatar = getInitialsAvatar($username);

        $insertStmt = executePdoQuery($pdo, "INSERT INTO `user` (username, email, password, role, avatar, created_at) VALUES (:username, :email, :password, :role, :avatar, NOW())", [
            ':username' => $username,
            ':email'    => $email,
            ':password' => $password,
            ':role'     => $role,
            ':avatar'   => $avatar
        ]);

        $userId = $pdo->lastInsertId();
        $userData = [
            'id'       => $userId,
            'username' => $username,
            'name'     => $username,
            'email'    => $email,
            'role'     => $role,
            'avatar'   => $avatar
        ];

        $_SESSION['user'] = $userData;

        echo json_encode([
            'success' => true,
            'message' => 'Registration successful!',
            'user'    => $userData
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Registration failed: ' . $e->getMessage()]);
    }
    exit;
}

// User Login
if ($action === 'login' && $method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?? $_POST;

    $email    = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Please provide both Email and Password.']);
        exit;
    }

    try {
        $pdo = getDBConnection();
        $stmt = executePdoQuery($pdo, "SELECT id, username, email, password, role, avatar FROM `user` WHERE email = :email", [':email' => $email]);
        $user = $stmt->fetch();

        $isValidPassword = $user && ($user['password'] === $password || password_verify($password, $user['password']));

        if (!$isValidPassword) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid email or password.']);
            exit;
        }

        $userData = [
            'id'       => $user['id'],
            'username' => $user['username'],
            'name'     => $user['username'],
            'email'    => $user['email'],
            'role'     => $user['role'] ?? 'user',
            'avatar'   => $user['avatar'] ?: getInitialsAvatar($user['username'])
        ];

        $_SESSION['user'] = $userData;

        echo json_encode([
            'success' => true,
            'message' => 'Login successful!',
            'user'    => $userData
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Login failed: ' . $e->getMessage()]);
    }
    exit;
}

// User Logout
if ($action === 'logout') {
    unset($_SESSION['user']);
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
    exit;
}


// GET Posts
if ($action === 'get_posts' || ($method === 'GET' && empty($action))) {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->query("SELECT b.id, b.user_id, b.title, b.category, b.excerpt, b.content, b.image_url, COALESCE(u.username, b.author_name) AS username, COALESCE(u.username, b.author_name, 'Anonymous') AS author_name, COALESCE(b.author_avatar, 'A') AS author_avatar, b.read_time, DATE_FORMAT(b.created_at, '%b %d, %Y') AS post_date, b.created_at, b.updated_at FROM `blogPost` b LEFT JOIN `user` u ON b.user_id = u.id ORDER BY b.created_at DESC");
        $posts = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'count' => count($posts),
            'data' => $posts
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to fetch posts: ' . $e->getMessage()
        ]);
    }
    exit;
}


// GET Single Post by ID
if ($action === 'get_post') {
    $id = intval($_GET['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid post ID provided.']);
        exit;
    }

    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT b.id, b.user_id, b.title, b.category, b.excerpt, b.content, b.image_url, COALESCE(u.username, b.author_name) AS username, COALESCE(u.username, b.author_name, 'Anonymous') AS author_name, COALESCE(b.author_avatar, 'A') AS author_avatar, b.read_time, DATE_FORMAT(b.created_at, '%b %d, %Y') AS post_date, b.created_at, b.updated_at FROM `blogPost` b LEFT JOIN `user` u ON b.user_id = u.id WHERE b.id = :id");
        $stmt->execute([':id' => $id]);
        $post = $stmt->fetch();

        if ($post) {
            echo json_encode(['success' => true, 'data' => $post]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Post not found.']);
        }
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to fetch post: ' . $e->getMessage()]);
    }
    exit;
}

// CREATE Post (Protected: Requires Login)
if ($action === 'create_post' || ($method === 'POST' && empty($action))) {
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error'   => 'Unauthorized. Please log in to publish articles.'
        ]);
        exit;
    }

    $currentUser = $_SESSION['user'];

    $title    = trim($_POST['title'] ?? '');
    $category = trim($_POST['category'] ?? '');
    $content  = trim($_POST['content'] ?? '');

    if (empty($title) && empty($content)) {
        $rawInput = file_get_contents('php://input');
        $inputData = json_decode($rawInput, true) ?? [];
        $title    = trim($inputData['title'] ?? '');
        $category = trim($inputData['category'] ?? '');
        $content  = trim($inputData['content'] ?? '');
    }

    if (empty($title) || empty($content)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'Article Title and Full Article Body are required fields.'
        ]);
        exit;
    }

    if (empty($category)) {
        $category = 'General';
    }

    // 1. Auto-generate Excerpt from Article Content (first 30 words)
    $cleanText = strip_tags($content);
    $words = preg_split('/\s+/', $cleanText);
    if (count($words) > 30) {
        $excerpt = implode(' ', array_slice($words, 0, 30)) . '...';
    } else {
        $excerpt = $cleanText;
    }

    // 2. Auto-calculate Estimated Read Time (average 200 words per minute)
    $wordCount = count(array_filter($words));
    $estimatedMinutes = max(1, (int)ceil($wordCount / 200));
    $read_time = $estimatedMinutes . ' min read';

    // 3. Handle Cover Image Upload
    $image_url = 'images/cover_webdev.png'; // Default fallback

    if (isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['cover_image']['tmp_name'];
        $fileName = $_FILES['cover_image']['name'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

        if (in_array($fileExtension, $allowedExtensions)) {
            $newFileName = 'img_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.' . $fileExtension;
            $uploadFileDir = __DIR__ . '/uploads/';
            
            if (!is_dir($uploadFileDir)) {
                mkdir($uploadFileDir, 0755, true);
            }

            $dest_path = $uploadFileDir . $newFileName;

            if (move_uploaded_file($fileTmpPath, $dest_path)) {
                $image_url = 'uploads/' . $newFileName;
            }
        }
    }

    $author_name   = $currentUser['username'] ?? $currentUser['name'];
    $author_avatar = $currentUser['avatar'] ?? getInitialsAvatar($author_name);
    $user_id       = $currentUser['id'];

    try {
        $pdo = getDBConnection();
        $sql = "INSERT INTO `blogPost` (user_id, title, category, excerpt, content, image_url, author_name, author_avatar, read_time, created_at, updated_at) 
                VALUES (:user_id, :title, :category, :excerpt, :content, :image_url, :author_name, :author_avatar, :read_time, NOW(), NOW())";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':user_id'       => $user_id,
            ':title'         => $title,
            ':category'      => $category,
            ':excerpt'       => $excerpt,
            ':content'       => $content,
            ':image_url'     => $image_url,
            ':author_name'   => $author_name,
            ':author_avatar' => $author_avatar,
            ':read_time'     => $read_time,
        ]);

        $newPostId = $pdo->lastInsertId();

        $fetchStmt = $pdo->prepare("SELECT b.id, b.user_id, b.title, b.category, b.excerpt, b.content, b.image_url, COALESCE(u.username, b.author_name) AS username, COALESCE(u.username, b.author_name, 'Anonymous') AS author_name, COALESCE(b.author_avatar, 'A') AS author_avatar, b.read_time, DATE_FORMAT(b.created_at, '%b %d, %Y') AS post_date, b.created_at, b.updated_at FROM `blogPost` b LEFT JOIN `user` u ON b.user_id = u.id WHERE b.id = :id");
        $fetchStmt->execute([':id' => $newPostId]);
        $newPost = $fetchStmt->fetch();

        echo json_encode([
            'success' => true,
            'message' => 'Article published successfully!',
            'data'    => $newPost
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => 'Failed to create post: ' . $e->getMessage()
        ]);
    }
    exit;
}

// UPDATE Post (Protected: Requires Login & Author or Admin Role)
if ($action === 'update_post') {
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error'   => 'Unauthorized. Please log in to edit articles.'
        ]);
        exit;
    }

    $postId = intval($_GET['id'] ?? $_POST['id'] ?? 0);
    if ($postId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid or missing post ID.']);
        exit;
    }

    $currentUser = $_SESSION['user'];

    try {
        $pdo = getDBConnection();

        // 1. Fetch existing post to verify existence & ownership
        $checkStmt = $pdo->prepare("SELECT user_id, image_url FROM `blogPost` WHERE id = :id");
        $checkStmt->execute([':id' => $postId]);
        $existingPost = $checkStmt->fetch();

        if (!$existingPost) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Article not found.']);
            exit;
        }

        // Authorization Check: Author of the post OR Admin
        $isAuthor = ($existingPost['user_id'] !== null && intval($existingPost['user_id']) === intval($currentUser['id']));
        $isAdmin  = (strtolower($currentUser['role'] ?? '') === 'admin');

        if (!$isAuthor && !$isAdmin) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error'   => 'Forbidden: You do not have permission to edit this article.'
            ]);
            exit;
        }

        $title    = trim($_POST['title'] ?? '');
        $category = trim($_POST['category'] ?? '');
        $content  = trim($_POST['content'] ?? '');

        // Fallback if raw JSON sent
        if (empty($title) && empty($content)) {
            $rawInput = file_get_contents('php://input');
            $inputData = json_decode($rawInput, true) ?? [];
            $title    = trim($inputData['title'] ?? '');
            $category = trim($inputData['category'] ?? '');
            $content  = trim($inputData['content'] ?? '');
        }

        if (empty($title) || empty($content)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error'   => 'Article Title and Content cannot be empty.'
            ]);
            exit;
        }

        if (empty($category)) {
            $category = 'General';
        }

        // Auto-recalculate Excerpt & Read Time
        $cleanText = strip_tags($content);
        $words = preg_split('/\s+/', $cleanText);
        if (count($words) > 30) {
            $excerpt = implode(' ', array_slice($words, 0, 30)) . '...';
        } else {
            $excerpt = $cleanText;
        }

        $wordCount = count(array_filter($words));
        $estimatedMinutes = max(1, (int)ceil($wordCount / 200));
        $read_time = $estimatedMinutes . ' min read';

        // Keep old image by default, or update if new cover_image uploaded
        $image_url = $existingPost['image_url'];

        if (isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
            $fileTmpPath = $_FILES['cover_image']['tmp_name'];
            $fileName = $_FILES['cover_image']['name'];
            $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

            if (in_array($fileExtension, $allowedExtensions)) {
                $newFileName = 'img_' . time() . '_' . substr(md5(uniqid()), 0, 8) . '.' . $fileExtension;
                $uploadFileDir = __DIR__ . '/uploads/';
                if (!is_dir($uploadFileDir)) {
                    mkdir($uploadFileDir, 0755, true);
                }
                $dest_path = $uploadFileDir . $newFileName;
                if (move_uploaded_file($fileTmpPath, $dest_path)) {
                    $image_url = 'uploads/' . $newFileName;
                }
            }
        }

        $updateSql = "UPDATE `blogPost` 
                      SET title = :title, 
                          category = :category, 
                          excerpt = :excerpt, 
                          content = :content, 
                          image_url = :image_url, 
                          read_time = :read_time, 
                          updated_at = NOW() 
                      WHERE id = :id";
        
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([
            ':title'     => $title,
            ':category'  => $category,
            ':excerpt'   => $excerpt,
            ':content'   => $content,
            ':image_url' => $image_url,
            ':read_time' => $read_time,
            ':id'        => $postId
        ]);

        $fetchStmt = $pdo->prepare("SELECT b.id, b.user_id, b.title, b.category, b.excerpt, b.content, b.image_url, COALESCE(u.username, b.author_name) AS username, COALESCE(u.username, b.author_name, 'Anonymous') AS author_name, COALESCE(b.author_avatar, 'A') AS author_avatar, b.read_time, DATE_FORMAT(b.created_at, '%b %d, %Y') AS post_date, b.created_at, b.updated_at FROM `blogPost` b LEFT JOIN `user` u ON b.user_id = u.id WHERE b.id = :id");
        $fetchStmt->execute([':id' => $postId]);
        $updatedPost = $fetchStmt->fetch();

        echo json_encode([
            'success' => true,
            'message' => 'Article updated successfully!',
            'data'    => $updatedPost
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => 'Failed to update post: ' . $e->getMessage()
        ]);
    }
    exit;
}

// DELETE Post (Protected: Requires Login & Author or Admin Role)
if ($action === 'delete_post' || $action === 'delete') {
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error'   => 'Unauthorized. Please log in to delete articles.'
        ]);
        exit;
    }

    $rawInput = file_get_contents('php://input');
    $inputData = json_decode($rawInput, true) ?? [];
    $postId = intval($_GET['id'] ?? $_POST['id'] ?? $inputData['id'] ?? 0);

    if ($postId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid or missing post ID.']);
        exit;
    }

    $currentUser = $_SESSION['user'];

    try {
        $pdo = getDBConnection();

        // 1. Fetch post to check existence and author ownership
        $checkStmt = $pdo->prepare("SELECT user_id, title FROM `blogPost` WHERE id = :id");
        $checkStmt->execute([':id' => $postId]);
        $existingPost = $checkStmt->fetch();

        if (!$existingPost) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Article not found or already deleted.']);
            exit;
        }

        // Authorization Check: Author of the post OR Admin
        $isAuthor = ($existingPost['user_id'] !== null && intval($existingPost['user_id']) === intval($currentUser['id']));
        $isAdmin  = (strtolower($currentUser['role'] ?? '') === 'admin');

        if (!$isAuthor && !$isAdmin) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error'   => 'Forbidden: You do not have permission to delete this article.'
            ]);
            exit;
        }

        // Execute Delete query
        $deleteStmt = $pdo->prepare("DELETE FROM `blogPost` WHERE id = :id");
        $deleteStmt->execute([':id' => $postId]);

        echo json_encode([
            'success' => true,
            'message' => 'Article deleted successfully!'
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => 'Failed to delete post: ' . $e->getMessage()
        ]);
    }
    exit;
}

// Invalid Request
http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Invalid API action.']);
