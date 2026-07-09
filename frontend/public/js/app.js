// ==========================================================================
// VibeNet Main SPA Application logic
// Coordinates views, routing, post/comment renders, profile editing, and widgets
// ==========================================================================

let currentUser = null;
let currentView = 'home'; // 'home', 'explore', 'profile'
let viewingUsername = null; // Username of profile currently being viewed

// Avatar Preset Resolver
function getAvatarUrl(avatar) {
  const presets = {
    avatar1: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    avatar2: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
    avatar3: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Jack',
    avatar4: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster',
    avatar5: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Cody',
    avatar6: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna'
  };
  return presets[avatar] || avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=placeholder';
}

// Time formatter (relative time: e.g. "5m ago", "2h ago", "July 1, 2026")
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ==========================================================================
// APPLICATION INITIALIZATION & SECURITY CHECK
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Authenticate user session
    const response = await API.auth.getMe();
    if (!response.success) {
      window.location.href = '/auth.html';
      return;
    }
    currentUser = response.user;

    // 2. Setup user identities in header & panels
    updateSidebarUserPill();

    // 3. Initialize Router
    window.addEventListener('hashchange', handleRouting);
    handleRouting();

    // 4. Load Right Sidebar Suggestions
    loadSuggestionsWidget();

  } catch (error) {
    console.error('Initialization security check failed:', error);
    window.location.href = '/auth.html';
  }
});

// Update sidebar profile information
function updateSidebarUserPill() {
  if (!currentUser) return;
  
  const avatarEl = document.getElementById('sidebar-user-avatar');
  const usernameEl = document.getElementById('sidebar-user-username');
  const handleEl = document.getElementById('sidebar-user-handle');
  const composerAvatarEl = document.getElementById('composer-avatar');

  const avatarUrl = getAvatarUrl(currentUser.avatar);
  
  if (avatarEl) avatarEl.src = avatarUrl;
  if (composerAvatarEl) composerAvatarEl.src = avatarUrl;
  if (usernameEl) usernameEl.textContent = currentUser.username;
  if (handleEl) handleEl.textContent = `@${currentUser.username}`;
}

// ==========================================================================
// ROUTER & NAVIGATION
// ==========================================================================

function handleRouting() {
  const hash = window.location.hash || '#/home';
  
  // Close any open modals
  closeEditProfileModal();

  // Reset page views
  document.getElementById('page-feed').classList.add('hidden');
  document.getElementById('page-profile').classList.add('hidden');

  // Deactivate all navigation items
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));

  if (hash.startsWith('#/home')) {
    currentView = 'home';
    document.getElementById('page-feed').classList.remove('hidden');
    document.getElementById('nav-home').classList.add('active');
    document.getElementById('mob-nav-home').classList.add('active');
    
    // Showcomposer & configure feed page header
    document.getElementById('feed-title').textContent = 'Home Feed';
    document.getElementById('composer-card').classList.remove('hidden');
    loadFeedPosts('home');

  } else if (hash.startsWith('#/explore')) {
    currentView = 'explore';
    document.getElementById('page-feed').classList.remove('hidden');
    document.getElementById('nav-explore').classList.add('active');
    document.getElementById('mob-nav-explore').classList.add('active');
    
    // Hide composer & configure explore page header
    document.getElementById('feed-title').textContent = 'Explore Vibes';
    document.getElementById('composer-card').classList.add('hidden');
    loadFeedPosts('explore');

  } else if (hash.startsWith('#/profile')) {
    currentView = 'profile';
    document.getElementById('page-profile').classList.remove('hidden');
    document.getElementById('nav-profile-link').classList.add('active');
    document.getElementById('mob-nav-profile').classList.add('active');

    // Parse username if profile/username. Else use current user
    const parts = hash.split('/');
    if (parts.length > 2 && parts[2]) {
      viewingUsername = parts[2].toLowerCase();
    } else {
      viewingUsername = currentUser.username;
    }
    
    loadUserProfile(viewingUsername);
  }
}

function navigateToOwnProfile() {
  window.location.hash = '#/profile';
}

// Create Vibe button scroll focus
function focusComposer() {
  window.location.hash = '#/home';
  setTimeout(() => {
    const input = document.getElementById('post-content-input');
    if (input) input.focus();
  }, 100);
}

// Log out trigger
async function triggerLogout() {
  try {
    const response = await API.auth.logout();
    if (response.success) {
      window.location.href = '/auth.html';
    }
  } catch (error) {
    alert('Failed to logout. Please try again.');
  }
}

// ==========================================================================
// COMPOSER ATTACHMENTS & IMAGE UTILS
// ==========================================================================

function updateCharCount() {
  const textarea = document.getElementById('post-content-input');
  const counter = document.getElementById('char-counter');
  counter.textContent = `${textarea.value.length} / 500`;
}

function toggleImageInput() {
  const container = document.getElementById('image-url-input-container');
  container.classList.toggle('hidden');
}

function previewPostImage() {
  const urlInput = document.getElementById('post-image-url').value.trim();
  const previewContainer = document.getElementById('image-preview-container');
  const previewImg = document.getElementById('image-preview');

  if (urlInput) {
    previewImg.src = urlInput;
    previewContainer.classList.remove('hidden');
  } else {
    removeImageLink();
  }
}

function removeImageLink() {
  document.getElementById('post-image-url').value = '';
  document.getElementById('image-preview-container').classList.add('hidden');
  document.getElementById('image-preview').src = '';
}

// ==========================================================================
// API TRIGGERS - POSTS & INTERACTIONS
// ==========================================================================

// Create new post
async function triggerCreatePost() {
  const contentInput = document.getElementById('post-content-input');
  const imageInput = document.getElementById('post-image-url');
  
  const content = contentInput.value.trim();
  const image = imageInput.value.trim();

  if (!content) {
    alert('Please enter some text content first.');
    return;
  }

  try {
    const response = await API.posts.create(content, image);
    if (response.success) {
      // Clear composer inputs
      contentInput.value = '';
      imageInput.value = '';
      removeImageLink();
      document.getElementById('image-url-input-container').classList.add('hidden');
      updateCharCount();

      // Reload posts
      if (currentView === 'home') {
        loadFeedPosts('home');
      } else if (currentView === 'profile' && viewingUsername === currentUser.username) {
        loadUserProfile(currentUser.username);
      }
    }
  } catch (error) {
    alert(error.message || 'Error creating post.');
  }
}

// Delete post
async function triggerDeletePost(postId) {
  if (!confirm('Are you sure you want to delete this vibe? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await API.posts.delete(postId);
    if (response.success) {
      // Find element and animate deletion
      const postCard = document.getElementById(`post-${postId}`);
      if (postCard) {
        postCard.style.opacity = '0';
        postCard.style.transform = 'translateY(20px)';
        setTimeout(() => {
          postCard.remove();
          // If profile view, update stats
          if (currentView === 'profile') {
            loadUserProfile(viewingUsername);
          }
        }, 300);
      }
    }
  } catch (error) {
    alert(error.message || 'Error deleting post.');
  }
}

// Toggle Like
async function triggerLikePost(postId, buttonElement) {
  try {
    const response = await API.posts.toggleLike(postId);
    if (response.success) {
      const countSpan = buttonElement.querySelector('.likes-count');
      const heartIcon = buttonElement.querySelector('i');
      
      countSpan.textContent = response.likesCount;
      
      if (response.isLiked) {
        buttonElement.classList.add('liked');
        heartIcon.classList.remove('fa-regular');
        heartIcon.classList.add('fa-solid');
        
        // Minor pop animation
        buttonElement.style.transform = 'scale(1.2)';
        setTimeout(() => buttonElement.style.transform = 'none', 150);
      } else {
        buttonElement.classList.remove('liked');
        heartIcon.classList.remove('fa-solid');
        heartIcon.classList.add('fa-regular');
      }
    }
  } catch (error) {
    console.error('Error toggling like:', error);
  }
}

// Toggle comments panel visibility
function toggleCommentsPanel(postId) {
  const commentsSection = document.getElementById(`comments-${postId}`);
  commentsSection.classList.toggle('hidden');

  // If opening, fetch and load comments
  if (!commentsSection.classList.contains('hidden')) {
    loadComments(postId);
  }
}

// Load comments from backend
async function loadComments(postId) {
  const commentsList = document.getElementById(`comments-list-${postId}`);
  commentsList.innerHTML = '<div class="loading-state-sm"><div class="spinner-sm"></div></div>';

  try {
    const response = await API.posts.comments.get(postId);
    if (response.success) {
      commentsList.innerHTML = '';
      
      if (response.comments.length === 0) {
        commentsList.innerHTML = '<p class="empty-state-text" style="font-size:0.8rem; text-align:center; padding:10px; color:var(--text-muted);">No comments yet. Start the conversation!</p>';
        return;
      }

      response.comments.forEach(comment => {
        const isOwner = comment.user._id === currentUser._id;
        const commentHtml = `
          <div class="comment-item" id="comment-${comment._id}">
            <img src="${getAvatarUrl(comment.user.avatar)}" class="avatar-sm" alt="${comment.user.username}">
            <div class="comment-bubble">
              <div class="comment-bubble-header">
                <span class="comment-author" onclick="navigateToProfile('${comment.user.username}')">${comment.user.username}</span>
                <span class="comment-time">${formatRelativeTime(comment.createdAt)}</span>
              </div>
              <p class="comment-text">${comment.content}</p>
            </div>
            ${isOwner ? `<button class="comment-delete-btn" onclick="triggerDeleteComment('${postId}', '${comment._id}')" title="Delete Comment"><i class="fa-regular fa-trash-can"></i></button>` : ''}
          </div>
        `;
        commentsList.insertAdjacentHTML('beforeend', commentHtml);
      });
    }
  } catch (error) {
    commentsList.innerHTML = '<p class="error-text" style="font-size:0.8rem; text-align:center;">Failed to load comments.</p>';
  }
}

// Add comment
async function triggerAddComment(event, postId) {
  event.preventDefault();
  const form = event.target;
  const input = form.querySelector('input');
  const content = input.value.trim();

  if (!content) return;

  try {
    const response = await API.posts.comments.add(postId, content);
    if (response.success) {
      input.value = '';
      
      // Reload comments
      await loadComments(postId);
      
      // Update comment count on post card
      const commentActionBtn = document.querySelector(`#post-${postId} .post-action.comment-btn`);
      if (commentActionBtn) {
        const countSpan = commentActionBtn.querySelector('.comments-count');
        const currentCount = parseInt(countSpan.textContent) || 0;
        countSpan.textContent = currentCount + 1;
      }
    }
  } catch (error) {
    alert(error.message || 'Error submitting comment.');
  }
}

// Delete comment
async function triggerDeleteComment(postId, commentId) {
  if (!confirm('Delete this comment?')) return;

  try {
    const response = await API.posts.comments.delete(commentId);
    if (response.success) {
      document.getElementById(`comment-${commentId}`).remove();
      
      // Update comment count on post card
      const commentActionBtn = document.querySelector(`#post-${postId} .post-action.comment-btn`);
      if (commentActionBtn) {
        const countSpan = commentActionBtn.querySelector('.comments-count');
        const currentCount = parseInt(countSpan.textContent) || 0;
        countSpan.textContent = Math.max(0, currentCount - 1);
      }
    }
  } catch (error) {
    alert(error.message || 'Error deleting comment.');
  }
}

// Navigate helper to set hash
function navigateToProfile(username) {
  window.location.hash = `#/profile/${username}`;
}

// ==========================================================================
// RENDER COMPONET - POST CARD BUILDER
// ==========================================================================

function buildPostCardHtml(post) {
  const isPostOwner = post.user._id === currentUser._id;
  const isLiked = post.likes.includes(currentUser._id);
  const likesCount = post.likes.length;
  // backend populate might return count virtual or raw comment details array
  const commentsCount = typeof post.comments === 'number' ? post.comments : (post.comments ? post.comments.length : 0);

  return `
    <article class="post-card" id="post-${post._id}">
      <div class="post-header">
        <div class="post-author-info" onclick="navigateToProfile('${post.user.username}')">
          <img src="${getAvatarUrl(post.user.avatar)}" alt="${post.user.username}" class="avatar-md">
          <div class="post-author-details">
            <span class="post-author-name">${post.user.username}</span>
            <span class="post-timestamp">${formatRelativeTime(post.createdAt)}</span>
          </div>
        </div>
        ${isPostOwner ? `
          <button class="post-delete-btn" onclick="triggerDeletePost('${post._id}')" title="Delete Vibe">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        ` : ''}
      </div>

      <div class="post-content">${post.content}</div>

      ${post.image ? `
        <div class="post-image-attachment">
          <img src="${post.image}" alt="Post attachment image" loading="lazy">
        </div>
      ` : ''}

      <div class="post-footer">
        <button class="post-action ${isLiked ? 'liked' : ''}" onclick="triggerLikePost('${post._id}', this)">
          <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          <span class="likes-count">${likesCount}</span>
        </button>
        <button class="post-action comment-btn" onclick="toggleCommentsPanel('${post._id}')">
          <i class="fa-regular fa-comment"></i>
          <span class="comments-count">${commentsCount}</span>
        </button>
      </div>

      <!-- Comments Thread section -->
      <div class="comments-section hidden" id="comments-${post._id}">
        <div class="comments-list" id="comments-list-${post._id}">
          <!-- Ajax Comments list -->
        </div>
        <form class="comment-composer" onsubmit="triggerAddComment(event, '${post._id}')">
          <input type="text" placeholder="Write a comment..." required maxlength="280">
          <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-paper-plane"></i></button>
        </form>
      </div>
    </article>
  `;
}

// Load Feed or Explore Posts
async function loadFeedPosts(type) {
  const container = document.getElementById('posts-feed-container');
  container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading vibes...</p></div>';

  try {
    let response;
    if (type === 'home') {
      response = await API.posts.getFeed();
    } else {
      response = await API.posts.getExplore();
    }

    if (response.success) {
      container.innerHTML = '';
      
      if (response.posts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fa-regular fa-folder-open"></i>
            <p>No vibes found in your feed.</p>
            <p style="font-size:0.85rem; margin-top:5px;">Follow other users on the right column or share your first vibe!</p>
          </div>
        `;
        return;
      }

      response.posts.forEach(post => {
        container.insertAdjacentHTML('beforeend', buildPostCardHtml(post));
      });
    }
  } catch (error) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>Failed to load feed. Check server logs.</p></div>';
  }
}

// ==========================================================================
// PROFILE PAGE CONTROLLER
// ==========================================================================

let profileUserObjId = null;

async function loadUserProfile(username) {
  const postsContainer = document.getElementById('profile-posts-container');
  postsContainer.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Retrieving vibes...</p></div>';

  try {
    const response = await API.users.getProfile(username);
    if (response.success) {
      const profile = response.profile;
      profileUserObjId = profile._id;

      // Update Profile Details Card
      document.getElementById('profile-avatar').src = getAvatarUrl(profile.avatar);
      document.getElementById('profile-display-name').textContent = profile.username;
      document.getElementById('profile-display-handle').textContent = `@${profile.username}`;
      document.getElementById('profile-display-bio').textContent = profile.bio || "No bio added yet.";
      
      const joinDate = new Date(profile.createdAt);
      document.getElementById('profile-display-joined').textContent = joinDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

      document.getElementById('profile-stat-posts').textContent = response.posts.length;
      document.getElementById('profile-stat-followers').textContent = profile.followersCount;
      document.getElementById('profile-stat-following').textContent = profile.followingCount;

      // Setup actions buttons (Edit profile vs Follow)
      const editBtn = document.getElementById('edit-profile-btn');
      const followBtn = document.getElementById('follow-profile-btn');

      if (profile.username === currentUser.username) {
        editBtn.classList.remove('hidden');
        followBtn.classList.add('hidden');
      } else {
        editBtn.classList.add('hidden');
        followBtn.classList.remove('hidden');
        
        // Set Follow button text state
        if (profile.isFollowing) {
          followBtn.textContent = 'Unfollow';
          followBtn.classList.remove('btn-primary');
          followBtn.classList.add('btn-outline');
        } else {
          followBtn.textContent = 'Follow';
          followBtn.classList.add('btn-primary');
          followBtn.classList.remove('btn-outline');
        }
      }

      // Load profile posts
      postsContainer.innerHTML = '';
      if (response.posts.length === 0) {
        postsContainer.innerHTML = '<div class="empty-state"><i class="fa-regular fa-comment-dots"></i><p>No vibes published by this user yet.</p></div>';
        return;
      }

      response.posts.forEach(post => {
        postsContainer.insertAdjacentHTML('beforeend', buildPostCardHtml(post));
      });
    }
  } catch (error) {
    postsContainer.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-question"></i><p>Profile user not found.</p></div>';
  }
}

// Follow / Unfollow user on profile page
async function triggerFollowProfileUser() {
  if (!profileUserObjId) return;

  const followBtn = document.getElementById('follow-profile-btn');
  followBtn.disabled = true;

  try {
    const response = await API.users.toggleFollow(profileUserObjId);
    if (response.success) {
      // Reload profile views to refresh stats and states
      await loadUserProfile(viewingUsername);
      loadSuggestionsWidget(); // Refresh suggestion list follows
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
  } finally {
    followBtn.disabled = false;
  }
}

// ==========================================================================
// EDIT PROFILE MODAL INTERACTIVE STATE
// ==========================================================================

function openEditProfileModal() {
  const modal = document.getElementById('edit-profile-modal');
  const bioInput = document.getElementById('edit-profile-bio-input');
  const avatarValueInput = document.getElementById('edit-profile-avatar-value');

  bioInput.value = currentUser.bio || '';
  document.getElementById('bio-char-counter').textContent = `${bioInput.value.length} / 160`;
  
  // Highlight currently selected avatar
  const activeAvatar = currentUser.avatar || 'avatar1';
  avatarValueInput.value = activeAvatar;
  
  selectAvatarOption(activeAvatar);

  modal.classList.remove('hidden');

  // Modal Char Counter listener
  bioInput.oninput = () => {
    document.getElementById('bio-char-counter').textContent = `${bioInput.value.length} / 160`;
  };
}

function selectAvatarOption(avatarName) {
  document.getElementById('edit-profile-avatar-value').value = avatarName;
  
  document.querySelectorAll('.avatar-option').forEach(el => {
    el.classList.remove('selected');
    if (el.getAttribute('data-avatar') === avatarName) {
      el.classList.add('selected');
    }
  });
}

function closeEditProfileModal() {
  document.getElementById('edit-profile-modal').classList.add('hidden');
}

// Save profile update
async function triggerSaveProfile(event) {
  event.preventDefault();

  const bio = document.getElementById('edit-profile-bio-input').value.trim();
  const avatar = document.getElementById('edit-profile-avatar-value').value;

  try {
    const response = await API.users.updateProfile(bio, avatar);
    if (response.success) {
      currentUser = response.user; // Update cached global user
      updateSidebarUserPill();
      closeEditProfileModal();

      // Refresh current profile page if view is own profile
      if (currentView === 'profile' && viewingUsername === currentUser.username) {
        loadUserProfile(currentUser.username);
      }
    }
  } catch (error) {
    alert(error.message || 'Error updating profile.');
  }
}

// ==========================================================================
// SUGGESTIONS & SEARCH WIDGETS
// ==========================================================================

async function loadSuggestionsWidget() {
  const listContainer = document.getElementById('suggestions-list-container');
  listContainer.innerHTML = '<div class="loading-state-sm"><div class="spinner-sm"></div></div>';

  try {
    const response = await API.users.getSuggestions();
    if (response.success) {
      listContainer.innerHTML = '';
      
      if (response.suggestions.length === 0) {
        listContainer.innerHTML = '<p class="empty-state-text" style="font-size:0.75rem; text-align:center; padding:10px; color:var(--text-muted);">You follow everyone! 🎉</p>';
        return;
      }

      response.suggestions.forEach(user => {
        const itemHtml = `
          <div class="suggestion-item" id="suggestion-${user._id}">
            <div class="suggestion-user-info" onclick="navigateToProfile('${user.username}')">
              <img src="${getAvatarUrl(user.avatar)}" class="avatar-sm" alt="${user.username}">
              <div class="user-pill-info">
                <span class="suggestion-name">${user.username}</span>
                <span class="suggestion-followers">${user.followersCount} followers</span>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="triggerSuggestionFollow('${user._id}', this)">Follow</button>
          </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', itemHtml);
      });
    }
  } catch (error) {
    listContainer.innerHTML = '<p style="font-size:0.75rem; text-align:center;">Failed to load.</p>';
  }
}

// Quick Follow button in right suggestions widget
async function triggerSuggestionFollow(userId, buttonElement) {
  buttonElement.disabled = true;
  try {
    const response = await API.users.toggleFollow(userId);
    if (response.success) {
      // Remove item from sidebar suggestion list
      const suggestionEl = document.getElementById(`suggestion-${userId}`);
      if (suggestionEl) {
        suggestionEl.style.opacity = '0';
        setTimeout(() => {
          suggestionEl.remove();
          // reload suggestion widget list if empty
          const currentCount = document.getElementById('suggestions-list-container').children.length;
          if (currentCount === 0) {
            loadSuggestionsWidget();
          }
        }, 200);
      }

      // If viewing active feed or profile page, refresh posts
      if (currentView === 'home') {
        loadFeedPosts('home');
      } else if (currentView === 'profile') {
        loadUserProfile(viewingUsername);
      }
    }
  } catch (error) {
    console.error('Error toggling suggestion follow:', error);
    buttonElement.disabled = false;
  }
}

// Live Profile Search
async function handleSearchUsers() {
  const searchInput = document.getElementById('search-users-input');
  const dropdown = document.getElementById('search-results-dropdown');
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    dropdown.innerHTML = '';
    dropdown.classList.add('hidden');
    return;
  }

  try {
    // Basic search simulation: We'll retrieve suggestions, and if matching query, we render them.
    // Or we attempt to fetch profile of the exact name directly.
    const response = await API.users.getSuggestions(); // gives some users
    if (response.success) {
      // Filter list of users containing search term
      const matched = response.suggestions.filter(user => user.username.includes(query));
      
      // Also check if matches current user
      if (currentUser.username.includes(query)) {
        matched.push({
          _id: currentUser._id,
          username: currentUser.username,
          avatar: currentUser.avatar,
          followersCount: currentUser.followersCount || 0
        });
      }

      dropdown.innerHTML = '';

      if (matched.length === 0) {
        dropdown.innerHTML = '<p style="font-size:0.8rem; text-align:center; padding:10px; color:var(--text-muted);">No profiles found</p>';
      } else {
        matched.forEach(user => {
          const itemHtml = `
            <div class="search-result-item" onclick="navigateToProfileFromSearch('${user.username}')">
              <img src="${getAvatarUrl(user.avatar)}" class="avatar-sm" alt="${user.username}">
              <div class="search-result-details">
                <span class="search-result-name">${user.username}</span>
                <span class="search-result-handle">@${user.username}</span>
              </div>
            </div>
          `;
          dropdown.insertAdjacentHTML('beforeend', itemHtml);
        });
      }

      dropdown.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error search users:', error);
  }
}

function navigateToProfileFromSearch(username) {
  const searchInput = document.getElementById('search-users-input');
  const dropdown = document.getElementById('search-results-dropdown');
  
  searchInput.value = '';
  dropdown.innerHTML = '';
  dropdown.classList.add('hidden');

  navigateToProfile(username);
}

// Close search dropdown when clicking outside
document.addEventListener('click', (event) => {
  const searchWidget = document.querySelector('.search-widget');
  const dropdown = document.getElementById('search-results-dropdown');
  if (dropdown && searchWidget && !searchWidget.contains(event.target)) {
    dropdown.classList.add('hidden');
  }
});
