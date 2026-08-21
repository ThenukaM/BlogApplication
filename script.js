/* --- Byte Diaries Blog JavaScript --- */

document.addEventListener('DOMContentLoaded', async () => {

  // 1. Navigation Bar Glassmorphism Scroll & Active Link Listener
  window.addEventListener('scroll', function () {
    const navbar = document.getElementById('mainNav');
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  });

  // 1b. Scroll to Top Floating Button Initialization
  function initScrollToTop() {
    let scrollBtn = document.getElementById('scrollToTopBtn');
    if (!scrollBtn) {
      scrollBtn = document.createElement('button');
      scrollBtn.id = 'scrollToTopBtn';
      scrollBtn.className = 'scroll-to-top-btn';
      scrollBtn.setAttribute('aria-label', 'Scroll to top');
      scrollBtn.setAttribute('title', 'Scroll to top');
      scrollBtn.setAttribute('type', 'button');
      scrollBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      `;
      document.body.appendChild(scrollBtn);
    }

    const toggleScrollBtn = () => {
      if (window.scrollY > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', toggleScrollBtn, { passive: true });
    toggleScrollBtn();

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  initScrollToTop();

  // Mobile Hamburger Menu Toggle & Full-Screen Overlay System
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mainNavbar = document.getElementById('mainNav');

  function initMobileOverlay() {
    let overlay = document.getElementById('mobileNavOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mobileNavOverlay';
      overlay.className = 'mobile-nav-overlay';
      overlay.innerHTML = `
        <div class="mobile-nav-content">
          <ul class="mobile-nav-links" id="mobileNavLinks"></ul>
          <div class="mobile-nav-auth" id="mobileNavAuth"></div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    syncMobileOverlay();
    return overlay;
  }

  function syncMobileOverlay() {
    const mobileLinksUl = document.getElementById('mobileNavLinks');
    const mobileAuthDiv = document.getElementById('mobileNavAuth');

    // Sync Navigation Links
    if (mobileLinksUl) {
      const desktopNavLinks = document.querySelectorAll('.nav-links li a');
      const currentPath = window.location.pathname.toLowerCase();
      mobileLinksUl.innerHTML = '';
      desktopNavLinks.forEach(link => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = link.textContent;
        const href = (a.getAttribute('href') || '').toLowerCase();
        if (
          (href === 'index.html' && (currentPath.endsWith('/index.html') || currentPath.endsWith('/blog/') || currentPath.endsWith('/blog'))) ||
          (href !== 'index.html' && !href.startsWith('#') && currentPath.endsWith(href))
        ) {
          a.classList.add('active');
        }
        a.addEventListener('click', closeMobileMenu);
        li.appendChild(a);
        mobileLinksUl.appendChild(li);
      });
    }

    // Sync Auth Area Buttons / User Profile
    if (mobileAuthDiv) {
      const desktopAuth = document.getElementById('navAuthArea');
      if (desktopAuth) {
        mobileAuthDiv.innerHTML = desktopAuth.innerHTML;
        const mobileProfileBtn = mobileAuthDiv.querySelector('#profileBtn');
        const mobileProfileDropdown = mobileAuthDiv.querySelector('#profileDropdown');
        if (mobileProfileBtn && mobileProfileDropdown) {
          mobileProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileProfileDropdown.classList.toggle('active');
          });
        }
        const mobileLogoutBtn = mobileAuthDiv.querySelector('#logoutBtn, .logout-btn');
        if (mobileLogoutBtn) {
          mobileLogoutBtn.addEventListener('click', () => {
            closeMobileMenu();
            handleLogout();
          });
        }
      }
    }
  }

  function openMobileMenu() {
    const overlay = initMobileOverlay();
    if (mainNavbar) mainNavbar.classList.add('mobile-nav-open');
    if (overlay) overlay.classList.add('active');
    document.body.classList.add('mobile-menu-active');
  }

  function closeMobileMenu() {
    const overlay = document.getElementById('mobileNavOverlay');
    if (mainNavbar) mainNavbar.classList.remove('mobile-nav-open');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('mobile-menu-active');
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const overlay = document.getElementById('mobileNavOverlay');
      if (overlay && overlay.classList.contains('active')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        closeMobileMenu();
      }
    });
  }

  // Highlight active navbar link dynamically
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll('.nav-links li a');
  navLinks.forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (!href || href.startsWith('#')) return;

    if (
      (href === 'index.html' && (currentPath.endsWith('/index.html') || currentPath.endsWith('/blog/') || currentPath.endsWith('/blog'))) ||
      (href !== 'index.html' && currentPath.endsWith(href))
    ) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 2. Authentication Management & Navbar Dynamic State
  let currentUser = getStoredUser();

  async function syncAuthStatus() { //varify with PHP backend
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 1500);
      const response = await fetch('api.php?action=check_auth', { signal: controller.signal });
      clearTimeout(t);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          if (result.authenticated && result.user) {
            currentUser = result.user;
            setStoredUser(result.user);
          }
        }
      }
    } catch (err) {
    }
    renderNavAuth(currentUser);
  }

  function getStoredUser() {
    try {
      const stored = localStorage.getItem('byte_diaries_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  function setStoredUser(user) {
    try {
      localStorage.setItem('byte_diaries_user', JSON.stringify(user));
    } catch (e) { }
  }

  function clearStoredUser() {
    try {
      localStorage.removeItem('byte_diaries_user');
    } catch (e) { }
  }

  // User Published Posts Local Storage 
  function getStoredUserPosts() {
    try {
      const stored = localStorage.getItem('byte_diaries_user_posts');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveUserPost(newPost) {
    try {
      const safePost = { ...newPost };
      if (safePost.image_url && safePost.image_url.startsWith('data:')) {
        safePost.image_url = getCategoryDefaultImage(safePost.category);
      }
      const listingPost = { ...safePost };
      const posts = getStoredUserPosts();
      const filtered = posts.filter(p => String(p.id) !== String(listingPost.id));
      filtered.unshift(listingPost);
      localStorage.setItem('byte_diaries_user_posts', JSON.stringify(filtered));
    } catch (e) {
      console.warn('saveUserPost failed (likely localStorage quota):', e);
    }
  }

  function setLastPublishedPost(post) {
    try {
      const safePost = { ...post };
      if (safePost.image_url && safePost.image_url.startsWith('data:')) {
        safePost.image_url = getCategoryDefaultImage(safePost.category);
      }
      sessionStorage.setItem('byte_diaries_last_post', JSON.stringify(safePost));
    } catch (e) { }
  }

  function consumeLastPublishedPost() {
    try {
      const raw = sessionStorage.getItem('byte_diaries_last_post');
      if (!raw) return null;
      sessionStorage.removeItem('byte_diaries_last_post');
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function getCategoryDefaultImage(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('artificial') || cat.includes('ai')) return 'images/cover_ai.png';
    if (cat.includes('cloud')) return 'images/cover_cloud.png';
    if (cat.includes('cyber') || cat.includes('security')) return 'images/cover_security.png';
    if (cat.includes('tech') || cat.includes('news') || cat.includes('quantum')) return 'images/cover_quantum.png';
    return 'images/cover_webdev.png';
  }

  // Render Navbar according to login state
  function renderNavAuth(user) {
    const navAuthArea = document.getElementById('navAuthArea');
    if (!navAuthArea) return;

    if (user) {
      // Logged In State: Show + Write Article button & Profile Avatar with Dropdown
      const avatar = user.avatar || getInitials(user.name);
      navAuthArea.innerHTML = `
        <a href="create-post.html" class="btn-create-post">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Write Article
        </a>
        <div class="profile-menu-wrapper">
          <button class="profile-avatar-btn" id="profileBtn" aria-label="User profile">${escapeHTML(avatar)}</button>
          <div class="profile-dropdown" id="profileDropdown">
            <div class="dropdown-user-info">
              <p class="dropdown-user-name">${escapeHTML(user.name)}</p>
              <p class="dropdown-user-email">${escapeHTML(user.email)}</p>
            </div>
            <a href="create-post.html" class="dropdown-item">✍️ Write Post</a>
            <button class="dropdown-item logout-btn" id="logoutBtn">🚪 Log Out</button>
          </div>
        </div>
      `;

      // Profile Dropdown Toggle
      const profileBtn = document.getElementById('profileBtn');
      const profileDropdown = document.getElementById('profileDropdown');
      const logoutBtn = document.getElementById('logoutBtn');

      if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', () => {
          profileDropdown.classList.remove('active');
        });
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
      }
    } else {
      // Not Logged In State: Show Login & Register Buttons
      navAuthArea.innerHTML = `
        <a href="login.html" class="auth-nav-btn btn-login">Log In</a>
        <a href="register.html" class="auth-nav-btn btn-register">Register</a>
      `;
    }
    syncMobileOverlay();
  }

  async function handleLogout() {
    try {
      await fetch('api.php?action=logout');
    } catch (e) { }
    clearStoredUser();
    currentUser = null;
    showToast('Logged out successfully');
    renderNavAuth(null);
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 600);
  }

  // Initial Sync (Non-blocking so page content loads instantly)
  renderNavAuth(currentUser);
  syncAuthStatus();


  // 3. Fallback Articles Data
  const fallbackPosts = [
    {
      id: 1,
      title: "Building Next-Gen AI Applications with Gemini & Neural Pipelines",
      category: "Artificial Intelligence",
      post_date: "Aug 12, 2026",
      read_time: "5 min read",
      image_url: "images/cover_ai.png",
      excerpt: "Discover how modern AI architectures are transforming intelligent web applications, real-time inference, and edge processing.",
      author_name: "alexrivera",
      author_avatar: "AR",
      username: "alexrivera"
    },
    {
      id: 2,
      title: "Mastering Glassmorphism & Micro-Animations in Modern CSS",
      category: "Web Development",
      post_date: "Aug 10, 2026",
      read_time: "4 min read",
      image_url: "images/cover_webdev.png",
      excerpt: "Learn how to create visually breathtaking UI components using modern CSS color spaces, backdrop filters, and smooth fluid animations.",
      author_name: "sarahchen",
      author_avatar: "SL",
      username: "sarahchen"
    },
    {
      id: 3,
      title: "Scaling Serverless Infrastructure for High-Throughput Workloads",
      category: "Cloud Architecture",
      post_date: "Aug 08, 2026",
      read_time: "6 min read",
      image_url: "images/cover_cloud.png",
      excerpt: "A deep dive into distributed systems, autoscaling microservices, and optimizing cloud data pipelines for maximum performance.",
      author_name: "marcusvance",
      author_avatar: "MK",
      username: "marcusvance"
    }
  ];

  // 4. Index Page: Fetch & Render Blog Cards Grid
  const blogGrid = document.getElementById('blogGrid');
  if (blogGrid) {
    fetchPosts();
  }

  async function fetchPosts() {
    let basePosts = [];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('api.php?action=get_posts', { signal: controller.signal });
      clearTimeout(timer);
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          basePosts = result.data;
        }
      }
    } catch (err) {
      console.warn('API fetch unavailable, displaying fallback demo posts.', err);
    }

    if (basePosts.length === 0) {
      basePosts = fallbackPosts;
    }

    // PRIORITY 1: sessionStorage bridge (the very last published post, guaranteed to appear)
    const bridgePost = consumeLastPublishedPost();
    if (bridgePost) {
      saveUserPost(bridgePost); // persist it to localStorage as well
    }

    // PRIORITY 2: merge localStorage user posts with base feed, deduplicating by id
    const userPosts = getStoredUserPosts();

    // If bridge post exists but wasn't saved to localStorage (quota issue), inject inline
    const bridgeIsInUserPosts = bridgePost && userPosts.some(p => String(p.id) === String(bridgePost.id));
    const effectiveUserPosts = (bridgePost && !bridgeIsInUserPosts)
      ? [bridgePost, ...userPosts]
      : userPosts;

    const merged = [
      ...basePosts,
      ...effectiveUserPosts.filter(up => !basePosts.some(p => String(p.id) === String(up.id)))
    ];

    // Sort by created_at descending — newest always first
    merged.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    renderPosts(merged);
  }


  function renderPosts(posts) {
    if (!blogGrid) return;
    blogGrid.innerHTML = posts.map(post => createCardHTML(post)).join('');
  }

  function getPostAuthorName(post) {
    if (!post) return 'Anonymous';
    return post.username || post.author_name || 'Anonymous';
  }

  function createCardHTML(post) {
    const title = escapeHTML(post.title);
    const category = escapeHTML(post.category || 'General');
    const date = escapeHTML(post.post_date || 'Just now');
    const readTime = escapeHTML(post.read_time || '3 min read');
    const authorName = escapeHTML(getPostAuthorName(post));
    const authorAvatar = escapeHTML(post.author_avatar || getInitials(authorName));
    const imageUrl = post.image_url || 'images/cover_webdev.png';

    return `
      <article class="blog-card">
        <div class="card-image-wrapper">
          <img src="${imageUrl}" alt="${title}" class="card-image" loading="lazy">
          <span class="category-badge">${category}</span>
        </div>
        <div class="card-content">
          <div class="card-meta">
            <span class="post-date">${date}</span>
            <span class="meta-separator">•</span>
            <span class="read-time">${readTime}</span>
          </div>
          <h2 class="card-title"><a href="post.html?id=${post.id}">${title}</a></h2>
          <div class="card-footer">
            <div class="author-info">
              <div class="author-avatar">${authorAvatar}</div>
              <span class="author-name">${authorName}</span>
            </div>
            <a href="post.html?id=${post.id}" class="read-more-btn">
              Read More
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </article>
    `;
  }



  // 6. Login Page Handler (login.html)


  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('authAlert');
      const submitBtn = document.getElementById('loginSubmitBtn');
      hideAlert(alertBox);

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        showAlert(alertBox, 'Please enter both Email Address and Password.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('api.php?action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: controller.signal
        });
        clearTimeout(timer);

        let result = null;
        try {
          result = await response.json();
        } catch (err) { }

        if (response.ok && result && result.success && result.user) {
          setStoredUser(result.user);
          showAlert(alertBox, 'Login successful! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 800);
          return;
        } else {
          const errorMsg = (result && result.error) ? result.error : 'Invalid email or password.';
          showAlert(alertBox, errorMsg, 'error');
        }
      } catch (err) {
        console.error('Login request failed:', err);
        showAlert(alertBox, 'Unable to connect. Please ensure XAMPP Apache & MySQL are running.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }



  // 6. Registration Page Handler (register.html)
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('authAlert');
      const submitBtn = document.getElementById('registerSubmitBtn');
      hideAlert(alertBox);

      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('regConfirmPassword').value;

      if (!name || !email || !password) {
        showAlert(alertBox, 'Please fill in all required fields.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showAlert(alertBox, 'Passwords do not match.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('api.php?action=register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name, name: name, email: email, password: password }),
          signal: controller.signal
        });
        clearTimeout(timer);

        const result = await response.json();

        if (response.ok && result.success && result.user) {
          setStoredUser(result.user);
          showAlert(alertBox, 'Account created successfully! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 800);
          return;
        } else if (response.status === 409) {
          showAlert(alertBox, result.error || 'Email address is already registered.', 'error');
          return;
        } else {
          showAlert(alertBox, (result && result.error) ? result.error : 'Registration failed on server.', 'error');
          return;
        }
      } catch (err) {
        console.error('Registration error:', err);
        showAlert(alertBox, 'Unable to connect to live database server. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
      }
    });
  }


  function prepareContentForEditor(content) {
    if (!content) return '';
    const str = String(content).trim();
    if (!str) return '';

    // If content already contains HTML block elements, preserve as is
    if (/<(p|h[1-6]|ul|ol|blockquote|div|br)\b[^>]*>/i.test(str)) {
      return str;
    }

    // Convert plain text paragraph breaks (\n\n) into HTML <p> paragraph blocks
    const normalized = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.split(/\n\s*\n/).filter(b => b.trim() !== '');
    if (blocks.length === 0) return `<p>${escapeHTML(str)}</p>`;
    return blocks.map(block => `<p>${escapeHTML(block.trim()).replace(/\n/g, '<br>')}</p>`).join('');
  }

  // --- Rich Text Blog Editor Handler ---
  function setupRichEditor(toolbarElem, editorElem, hiddenInputElem) {
    if (!toolbarElem || !editorElem || !hiddenInputElem) return;

    // Prevent duplicate setup
    if (editorElem.dataset.richSetup === 'true') return;
    editorElem.dataset.richSetup = 'true';

    // Execute Formatting Commands
    toolbarElem.addEventListener('click', (e) => {
      const btn = e.target.closest('.editor-btn');
      if (!btn) return;

      e.preventDefault();
      const command = btn.getAttribute('data-command');
      const value = btn.getAttribute('data-value') || null;

      if (!command) return;

      editorElem.focus();

      if (command === 'formatBlock') {
        document.execCommand(command, false, `<${value}>`);
      } else {
        document.execCommand(command, false, value);
      }

      syncEditorContent(editorElem, hiddenInputElem);
      updateToolbarActiveStates(toolbarElem);
    });

    const sync = () => {
      syncEditorContent(editorElem, hiddenInputElem);
      updateToolbarActiveStates(toolbarElem);
    };

    editorElem.addEventListener('input', sync);
    editorElem.addEventListener('keyup', sync);
    editorElem.addEventListener('mouseup', () => updateToolbarActiveStates(toolbarElem));

    // Handle Paste to preserve paragraph breaks cleanly
    editorElem.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      if (!text) return;
      const formatted = prepareContentForEditor(text);
      document.execCommand('insertHTML', false, formatted);
      sync();
    });
  }

  function syncEditorContent(editorElem, hiddenInputElem) {
    if (!editorElem || !hiddenInputElem) return;
    const htmlContent = editorElem.innerHTML.trim();
    hiddenInputElem.value = (htmlContent === '<br>' || htmlContent === '<p><br></p>') ? '' : htmlContent;
  }

  function updateToolbarActiveStates(toolbarElem) {
    if (!toolbarElem) return;
    const buttons = toolbarElem.querySelectorAll('.editor-btn');
    buttons.forEach(btn => {
      const command = btn.getAttribute('data-command');
      const value = btn.getAttribute('data-value');

      if (!command) return;

      try {
        if (['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'].includes(command)) {
          if (document.queryCommandState(command)) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        } else if (command === 'formatBlock' && value) {
          const currentBlock = document.queryCommandValue('formatBlock');
          if (currentBlock && currentBlock.toLowerCase() === value.toLowerCase()) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        }
      } catch (err) { }
    });
  }

  // 7. Dedicated Create Post Page Handler (create-post.html)
  const dedicatedCreatePostForm = document.getElementById('dedicatedCreatePostForm');
  const authGateNotice = document.getElementById('authGateNotice');
  const createPostCard = document.getElementById('createPostCard');

  if (dedicatedCreatePostForm) {
    if (!currentUser) {
      if (authGateNotice) authGateNotice.classList.remove('hidden');
      if (createPostCard) createPostCard.classList.add('hidden');
    } else {
      if (authGateNotice) authGateNotice.classList.add('hidden');
      if (createPostCard) createPostCard.classList.remove('hidden');
    }

    // Initialize Rich Editor for Create Post
    const editorToolbar = document.getElementById('editorToolbar');
    const richContentEditor = document.getElementById('richContentEditor');
    const postContentInput = document.getElementById('postContent');

    if (editorToolbar && richContentEditor && postContentInput) {
      setupRichEditor(editorToolbar, richContentEditor, postContentInput);
    }

    // A. Custom Category Toggle & Dynamic Population
    const postCategorySelect = document.getElementById('postCategorySelect');
    const customCategoryWrapper = document.getElementById('customCategoryWrapper');
    const customCategoryInput = document.getElementById('customCategoryInput');

    if (postCategorySelect && customCategoryWrapper && customCategoryInput) {
      populateCategoryDropdown(postCategorySelect);

      postCategorySelect.addEventListener('change', () => {
        if (postCategorySelect.value === 'CUSTOM') {
          customCategoryWrapper.classList.remove('hidden');
          customCategoryInput.required = true;
          customCategoryInput.focus();
        } else {
          customCategoryWrapper.classList.add('hidden');
          customCategoryInput.required = false;
          customCategoryInput.value = '';
        }
      });
    }

    // B. Drag & Drop Image Uploader
    const imageDropZone = document.getElementById('imageDropZone');
    const coverImageInput = document.getElementById('coverImageInput');
    const dropZoneContent = document.getElementById('dropZoneContent');
    const imagePreviewWrapper = document.getElementById('imagePreviewWrapper');
    const imagePreviewImg = document.getElementById('imagePreviewImg');
    const removeImageBtn = document.getElementById('removeImageBtn');

    let uploadedFile = null;

    if (imageDropZone && coverImageInput) {
      // Click to trigger file input
      imageDropZone.addEventListener('click', (e) => {
        if (e.target !== removeImageBtn) {
          coverImageInput.click();
        }
      });

      coverImageInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          processImageFile(e.target.files[0]);
        }
      });

      // Drag & Drop events
      ['dragenter', 'dragover'].forEach(eventName => {
        imageDropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          imageDropZone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        imageDropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          imageDropZone.classList.remove('dragover');
        });
      });

      imageDropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt.files && dt.files[0]) {
          processImageFile(dt.files[0]);
        }
      });

      if (removeImageBtn) {
        removeImageBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          clearImagePreview();
        });
      }
    }

    function processImageFile(file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (PNG, JPG, WEBP).');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file size must be less than 5MB.');
        return;
      }

      uploadedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        if (imagePreviewImg && imagePreviewWrapper && dropZoneContent) {
          imagePreviewImg.src = e.target.result;
          imagePreviewWrapper.classList.remove('hidden');
          dropZoneContent.classList.add('hidden');
        }
      };
      reader.readAsDataURL(file);
    }

    function clearImagePreview() {
      uploadedFile = null;
      if (coverImageInput) coverImageInput.value = '';
      if (imagePreviewImg) imagePreviewImg.src = '';
      if (imagePreviewWrapper) imagePreviewWrapper.classList.add('hidden');
      if (dropZoneContent) dropZoneContent.classList.remove('hidden');
    }

    // C. Form Submission Handler
    dedicatedCreatePostForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formAlert = document.getElementById('formAlert');
      const publishBtn = document.getElementById('publishArticleBtn');
      if (richContentEditor && postContentInput) {
        syncEditorContent(richContentEditor, postContentInput);
      }

      const rawFormData = new FormData(dedicatedCreatePostForm);

      // Determine final category (Standard vs Custom)
      let finalCategory = rawFormData.get('category_select');
      if (finalCategory === 'CUSTOM') {
        finalCategory = rawFormData.get('custom_category')?.trim() || 'General';
      }

      const postTitle = rawFormData.get('title')?.trim();
      const postContent = rawFormData.get('content')?.trim();

      if (!postTitle || !postContent) {
        showAlert(formAlert, 'Please provide both Article Title and Content.', 'error');
        return;
      }

      publishBtn.disabled = true;
      publishBtn.textContent = 'Publishing...';

      // Determine cover image URL for LOCAL storage.
      // IMPORTANT: Never use base64 data: URL here — it exceeds localStorage quota (5MB limit)
      // and causes a silent QuotaExceededError that prevents the post from being saved at all.
      // Always use the safe category-default image for local persistence.
      // The actual uploaded image will be handled by the API and its server path stored after sync.
      const coverImgUrl = getCategoryDefaultImage(finalCategory);

      // Calculate auto metrics
      const cleanBody = postContent.replace(/<[^>]*>/g, '');
      const words = cleanBody.split(/\s+/).filter(Boolean);
      const excerpt = words.slice(0, 30).join(' ') + (words.length > 30 ? '...' : '');
      const readTime = Math.max(1, Math.ceil(words.length / 200)) + ' min read';

      const authorName = currentUser ? (currentUser.username || currentUser.name || 'Anonymous') : 'Anonymous';
      const authorAvatar = currentUser ? (currentUser.avatar || getInitials(authorName)) : 'A';

      const localPost = {
        id: Date.now(),
        user_id: currentUser ? currentUser.id : 1,
        title: postTitle,
        category: finalCategory,
        content: postContent,
        excerpt: excerpt,
        image_url: coverImgUrl,
        username: authorName,
        author_name: authorName,
        author_avatar: authorAvatar,
        read_time: readTime,
        post_date: 'Just now',
        created_at: new Date().toISOString()
      };

      // 1. Send to live database API
      try {
        const apiFormData = new FormData();
        apiFormData.append('title', postTitle);
        apiFormData.append('category', finalCategory);
        apiFormData.append('content', postContent);
        if (uploadedFile) {
          apiFormData.append('cover_image', uploadedFile);
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 60000); // 60s timeout for live hosting upload

        const response = await fetch('api.php?action=create_post', {
          method: 'POST',
          body: apiFormData,
          signal: controller.signal
        });
        clearTimeout(timer);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            localPost.id = result.data.id;
            if (result.data.image_url) localPost.image_url = result.data.image_url;
            if (result.data.username) localPost.username = result.data.username;
            if (result.data.author_name) localPost.author_name = result.data.author_name;
          }
        } else {
          const errData = await response.json().catch(() => null);
          const msg = errData?.error || 'Server error creating post.';
          showAlert(formAlert, msg, 'error');
          publishBtn.disabled = false;
          publishBtn.textContent = 'Publish Article';
          return;
        }
      } catch (err) {
        console.warn('Backend create_post offline/delayed, stored locally.', err);
      }

      // 2. Write to local state bridge
      saveUserPost(localPost);
      setLastPublishedPost(localPost);

      showToast('Article published successfully!');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    });
  }


  // Password Visibility Toggle Handler
  document.querySelectorAll('.toggle-password-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const wrapper = btn.closest('.password-input-wrapper');
      const input = wrapper ? wrapper.querySelector('input') : null;
      if (!input) return;

      const eyeOpen = btn.querySelector('.eye-open');
      const eyeClosed = btn.querySelector('.eye-closed');

      if (input.type === 'password') {
        input.type = 'text';
        if (eyeOpen) eyeOpen.classList.add('hidden');
        if (eyeClosed) eyeClosed.classList.remove('hidden');
      } else {
        input.type = 'password';
        if (eyeOpen) eyeOpen.classList.remove('hidden');
        if (eyeClosed) eyeClosed.classList.add('hidden');
      }
    });
  });

  // Dynamic Category Dropdown Population
  async function populateCategoryDropdown(selectElement) {
    if (!selectElement) return;

    const defaultCategories = ['Web Development', 'Artificial Intelligence', 'Cloud Architecture', 'Cybersecurity', 'Tech News'];
    const categoriesSet = new Set(defaultCategories);

    try {
      const response = await fetch('api.php?action=get_posts');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          result.data.forEach(p => {
            if (p.category && p.category.trim() !== '' && p.category !== 'CUSTOM') {
              categoriesSet.add(p.category.trim());
            }
          });
        }
      }
    } catch (e) { }

    const categoriesArray = Array.from(categoriesSet);
    const currentValue = selectElement.value || 'Web Development';

    selectElement.innerHTML = `
      <optgroup label="Existing Categories">
        ${categoriesArray.map(cat => `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`).join('')}
      </optgroup>
      <optgroup label="Create New">
        <option value="CUSTOM">➕ Add Custom Category...</option>
      </optgroup>
    `;

    if (categoriesSet.has(currentValue)) {
      selectElement.value = currentValue;
    }
  }

  // Helper Alert & Toast Utilities
  function showAlert(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `auth-alert ${type}`;
  }

  function hideAlert(element) {
    if (!element) return;
    element.className = 'auth-alert hidden';
  }

  // 8. Single Post View Page Handler (post.html)
  const singlePostArticle = document.getElementById('singlePostArticle');
  const singlePostLoading = document.getElementById('singlePostLoading');
  let singlePostFetchStarted = false;
  let singlePostFetchSettled = false;

  if (singlePostArticle) {
    fetchSinglePost();
  }

  function showSinglePostError(message) {
    if (!singlePostLoading) return;
    singlePostLoading.classList.remove('hidden');
    singlePostLoading.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:1rem">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p style="color:var(--text-secondary);margin-bottom:1.5rem">${escapeHTML(message)}</p>
        <a href="index.html" class="read-more-btn">← Back to Articles</a>
      </div>`;
    if (singlePostArticle) singlePostArticle.classList.add('hidden');
  }

  async function fetchSinglePost() {
    if (singlePostFetchStarted || singlePostFetchSettled) return;
    singlePostFetchStarted = true;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId || !String(postId).trim()) {
      singlePostFetchSettled = true;
      showSinglePostError('No article ID provided.');
      return;
    }

    const normalizedId = String(postId).trim();

    try {
      // 1. Prefer the database/API as the authoritative source (prevents stale localStorage from blocking fresh data)
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(`api.php?action=get_post&id=${encodeURIComponent(normalizedId)}`, {
          signal: controller.signal
        });
        clearTimeout(timer);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            renderSinglePost(result.data);
            singlePostFetchSettled = true;
            return;
          }
        }
      } catch (err) {
        // Timeout or network error — fall through to offline sources
      }

      // 2. Offline/local posts saved before API sync (typically timestamp-based IDs)
      const userPosts = getStoredUserPosts();
      const foundUserPost = userPosts.find(p => String(p.id) === normalizedId);
      if (foundUserPost) {
        renderSinglePost(foundUserPost);
        singlePostFetchSettled = true;
        return;
      }

      // 3. Static demo posts when the database is unavailable
      const fallback = fallbackPosts.find(p => String(p.id) === normalizedId);
      if (fallback) {
        renderSinglePost(fallback);
        singlePostFetchSettled = true;
        return;
      }

      singlePostFetchSettled = true;
      showSinglePostError('Article not found or could not be loaded.');
    } catch (err) {
      console.error('Failed to load single post:', err);
      singlePostFetchSettled = true;
      showSinglePostError('Article not found or could not be loaded.');
    } finally {
      singlePostFetchStarted = false;
    }
  }


  function renderSinglePost(post) {
    if (!singlePostArticle || !post) {
      showSinglePostError('Article not found or could not be loaded.');
      return;
    }

    try {
      document.title = `${post.title || 'Article'} - Byte Diaries`;

      const catBadge = document.getElementById('singlePostCategory');
      const readBadge = document.getElementById('singlePostReadTime');
      const titleElem = document.getElementById('singlePostTitle');
      const authorNameElem = document.getElementById('singlePostAuthorName');
      const authorAvatarElem = document.getElementById('singlePostAuthorAvatar');
      const dateElem = document.getElementById('singlePostDate');
      const coverElem = document.getElementById('singlePostCoverImage');
      const contentElem = document.getElementById('singlePostContent');

      const displayAuthor = getPostAuthorName(post);

      if (catBadge) catBadge.textContent = post.category || 'General';
      if (readBadge) readBadge.textContent = post.read_time || '3 min read';
      if (titleElem) titleElem.textContent = post.title || 'Untitled Article';
      if (authorNameElem) authorNameElem.textContent = displayAuthor;
      if (authorAvatarElem) authorAvatarElem.textContent = post.author_avatar || getInitials(displayAuthor);
      if (dateElem) dateElem.textContent = post.post_date || 'Just now';
      if (coverElem) coverElem.src = post.image_url || 'images/cover_webdev.png';

      if (contentElem) {
        const rawBody = post.content || post.excerpt || 'No full article body available.';
        contentElem.innerHTML = formatArticleBody(rawBody);
      }

      // 9. Post Edit Button Visibility Authorization (Author or Admin Only)
      const singlePostActions = document.getElementById('singlePostActions');
      const editPostBtn = document.getElementById('editPostBtn');

      if (singlePostActions && editPostBtn) {
        const isAuthor = currentUser && post.user_id && (parseInt(currentUser.id) === parseInt(post.user_id));
        const isAdmin = currentUser && (currentUser.role && currentUser.role.toLowerCase() === 'admin');

        if (isAuthor || isAdmin) {
          singlePostActions.classList.remove('hidden');
          setupEditPostHandlers(post);
        } else {
          singlePostActions.classList.add('hidden');
        }
      }
    } catch (err) {
      console.error('Error rendering single post:', err);
      showSinglePostError('Article not found or could not be loaded.');
      return;
    }

    if (singlePostLoading) singlePostLoading.classList.add('hidden');
    singlePostArticle.classList.remove('hidden');
  }

  function formatArticleBody(content) {
    if (!content) return '<p>No content available.</p>';
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return content;
    }
    const normalized = String(content).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.split(/\n\s*\n/).filter(b => b.trim() !== '');
    if (blocks.length === 0) return `<p>${escapeHTML(content)}</p>`;
    return blocks.map(block => {
      const escaped = escapeHTML(block.trim());
      const withBreaks = escaped.replace(/\n/g, '<br>');
      return `<p>${withBreaks}</p>`;
    }).join('');
  }

  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getInitials(name) {
    if (!name) return 'A';
    const parts = String(name).trim().split(/\s+/);
    let initials = parts[0].charAt(0).toUpperCase();
    if (parts.length > 1) {
      initials += parts[parts.length - 1].charAt(0).toUpperCase();
    }
    return initials;
  }


  let currentEditPost = null;
  let editUploadedFile = null;

  function setupEditPostHandlers(post) {
    currentEditPost = post;
    const editPostBtn = document.getElementById('editPostBtn');
    const deletePostBtn = document.getElementById('deletePostBtn');
    const editPostModal = document.getElementById('editPostModal');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    const cancelEditModalBtn = document.getElementById('cancelEditModalBtn');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const cancelDeleteModalBtn = document.getElementById('cancelDeleteModalBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    if (editPostBtn && editPostModal) {
      editPostBtn.onclick = () => { openEditModal(post); };
      if (closeEditModalBtn) closeEditModalBtn.onclick = closeEditModal;
      if (cancelEditModalBtn) cancelEditModalBtn.onclick = closeEditModal;
      editPostModal.onclick = (e) => { if (e.target === editPostModal) closeEditModal(); };
    }

    if (deletePostBtn && deleteConfirmModal) {
      deletePostBtn.onclick = () => {
        deleteConfirmModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      };

      if (cancelDeleteModalBtn) {
        cancelDeleteModalBtn.onclick = () => {
          deleteConfirmModal.classList.add('hidden');
          document.body.style.overflow = '';
        };
      }

      deleteConfirmModal.onclick = (e) => {
        if (e.target === deleteConfirmModal) {
          deleteConfirmModal.classList.add('hidden');
          document.body.style.overflow = '';
        }
      };

      if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = async () => {
          confirmDeleteBtn.disabled = true;
          confirmDeleteBtn.textContent = 'Deleting...';
          await executeDeletePost(post.id);
          confirmDeleteBtn.disabled = false;
          confirmDeleteBtn.textContent = 'Yes, Delete';
        };
      }
    }
  }

  async function executeDeletePost(postId) {
    try {
      const response = await fetch(`api.php?action=delete_post&id=${postId}`, {
        method: 'POST'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const deleteConfirmModal = document.getElementById('deleteConfirmModal');
        if (deleteConfirmModal) deleteConfirmModal.classList.add('hidden');
        document.body.style.overflow = '';

        showToast('Article deleted successfully!');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 800);
      } else {
        showToast(result.error || 'Failed to delete article.');
      }
    } catch (err) {
      showToast('Server error trying to delete article.');
    }
  }

  function openEditModal(post) {
    const editPostModal = document.getElementById('editPostModal');
    const editPostTitle = document.getElementById('editPostTitle');
    const editPostCategorySelect = document.getElementById('editPostCategorySelect');
    const editPostContent = document.getElementById('editPostContent');
    const editFormAlert = document.getElementById('editFormAlert');

    const editEditorToolbar = document.getElementById('editEditorToolbar');
    const editRichContentEditor = document.getElementById('editRichContentEditor');

    if (!editPostModal) return;

    hideAlert(editFormAlert);
    if (editPostTitle) editPostTitle.value = post.title || '';

    const initialContent = post.content || post.excerpt || '';
    const formattedContent = prepareContentForEditor(initialContent);

    if (editRichContentEditor && editPostContent) {
      if (editEditorToolbar) {
        setupRichEditor(editEditorToolbar, editRichContentEditor, editPostContent);
      }
      editRichContentEditor.innerHTML = formattedContent;
      editPostContent.value = formattedContent;
    } else if (editPostContent) {
      editPostContent.value = initialContent;
    }

    if (editPostCategorySelect) {
      populateCategoryDropdown(editPostCategorySelect);
      editPostCategorySelect.value = post.category || 'General';
    }

    editUploadedFile = null;
    clearEditImagePreview();

    editPostModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeEditModal() {
    const editPostModal = document.getElementById('editPostModal');
    if (editPostModal) {
      editPostModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  // Setup Edit Form Image Dropzone & Submit Handlers
  const editPostForm = document.getElementById('editPostForm');
  const editImageDropZone = document.getElementById('editImageDropZone');
  const editCoverImageInput = document.getElementById('editCoverImageInput');
  const editDropZoneContent = document.getElementById('editDropZoneContent');
  const editImagePreviewWrapper = document.getElementById('editImagePreviewWrapper');
  const editImagePreviewImg = document.getElementById('editImagePreviewImg');
  const editRemoveImageBtn = document.getElementById('editRemoveImageBtn');

  if (editImageDropZone && editCoverImageInput) {
    editImageDropZone.addEventListener('click', (e) => {
      if (e.target !== editRemoveImageBtn) {
        editCoverImageInput.click();
      }
    });

    editCoverImageInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processEditImageFile(e.target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      editImageDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        editImageDropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      editImageDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        editImageDropZone.classList.remove('dragover');
      });
    });

    editImageDropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files[0]) {
        processEditImageFile(dt.files[0]);
      }
    });

    if (editRemoveImageBtn) {
      editRemoveImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearEditImagePreview();
      });
    }
  }

  function processEditImageFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB.');
      return;
    }
    editUploadedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (editImagePreviewImg && editImagePreviewWrapper && editDropZoneContent) {
        editImagePreviewImg.src = e.target.result;
        editImagePreviewWrapper.classList.remove('hidden');
        editDropZoneContent.classList.add('hidden');
      }
    };
    reader.readAsDataURL(file);
  }

  function clearEditImagePreview() {
    editUploadedFile = null;
    if (editCoverImageInput) editCoverImageInput.value = '';
    if (editImagePreviewImg) editImagePreviewImg.src = '';
    if (editImagePreviewWrapper) editImagePreviewWrapper.classList.add('hidden');
    if (editDropZoneContent) editDropZoneContent.classList.remove('hidden');
  }

  if (editPostForm) {
    const editCategorySelect = document.getElementById('editPostCategorySelect');
    const editCustomWrapper = document.getElementById('editCustomCategoryWrapper');
    const editCustomInput = document.getElementById('editCustomCategoryInput');

    if (editCategorySelect && editCustomWrapper && editCustomInput) {
      editCategorySelect.addEventListener('change', () => {
        if (editCategorySelect.value === 'CUSTOM') {
          editCustomWrapper.classList.remove('hidden');
          editCustomInput.required = true;
          editCustomInput.focus();
        } else {
          editCustomWrapper.classList.add('hidden');
          editCustomInput.required = false;
          editCustomInput.value = '';
        }
      });
    }

    editPostForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editFormAlert = document.getElementById('editFormAlert');
      const saveBtn = document.getElementById('saveEditPostBtn');
      hideAlert(editFormAlert);

      const editRichContentEditor = document.getElementById('editRichContentEditor');
      const editPostContentInput = document.getElementById('editPostContent');
      if (editRichContentEditor && editPostContentInput) {
        syncEditorContent(editRichContentEditor, editPostContentInput);
      }

      if (!currentEditPost || !currentEditPost.id) {
        showAlert(editFormAlert, 'Missing article reference.', 'error');
        return;
      }

      const rawFormData = new FormData(editPostForm);
      let finalCategory = rawFormData.get('category_select');
      if (finalCategory === 'CUSTOM') {
        finalCategory = rawFormData.get('custom_category')?.trim() || 'General';
      }

      const apiFormData = new FormData();
      apiFormData.append('title', rawFormData.get('title'));
      apiFormData.append('category', finalCategory);
      apiFormData.append('content', rawFormData.get('content'));

      if (editUploadedFile) {
        apiFormData.append('cover_image', editUploadedFile);
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const response = await fetch(`api.php?action=update_post&id=${currentEditPost.id}`, {
          method: 'POST',
          body: apiFormData
        });

        const result = await response.json();

        if (response.ok && result.success && result.data) {
          saveUserPost(result.data);
          showToast('Article updated successfully!');
          closeEditModal();
          renderSinglePost(result.data);
          return;
        } else {
          showAlert(editFormAlert, result.error || 'Failed to update article.', 'error');
        }
      } catch (err) {
        const updatedLocalPost = {
          ...currentEditPost,
          title: rawFormData.get('title')?.trim() || currentEditPost.title,
          category: finalCategory,
          content: rawFormData.get('content')?.trim() || currentEditPost.content,
          updated_at: new Date().toISOString()
        };
        const cleanBody = updatedLocalPost.content.replace(/<[^>]*>/g, '');
        const words = cleanBody.split(/\s+/).filter(Boolean);
        updatedLocalPost.excerpt = words.slice(0, 30).join(' ') + (words.length > 30 ? '...' : '');
        updatedLocalPost.read_time = Math.max(1, Math.ceil(words.length / 200)) + ' min read';

        saveUserPost(updatedLocalPost);
        showToast('Article updated successfully!');
        closeEditModal();
        renderSinglePost(updatedLocalPost);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    });
  }
});

