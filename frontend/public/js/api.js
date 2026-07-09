// ==========================================================================
// VibeNet API Service Client
// Handles backend endpoint communications using relative fetch queries
// ==========================================================================

const API = {
  // Base request handler
  async request(url, options = {}) {
    // Default headers
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    // If body is object, stringify it
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${url}]:`, error);
      throw error;
    }
  },

  // Auth Operations
  auth: {
    async register(username, email, password) {
      return API.request('/api/auth/register', {
        method: 'POST',
        body: { username, email, password }
      });
    },

    async login(usernameOrEmail, password) {
      return API.request('/api/auth/login', {
        method: 'POST',
        body: { usernameOrEmail, password }
      });
    },

    async logout() {
      return API.request('/api/auth/logout', {
        method: 'POST'
      });
    },

    async getMe() {
      return API.request('/api/auth/me', {
        method: 'GET'
      });
    }
  },

  // User Operations
  users: {
    async getProfile(username) {
      return API.request(`/api/users/profile/${username}`, {
        method: 'GET'
      });
    },

    async updateProfile(bio, avatar) {
      return API.request('/api/users/profile', {
        method: 'PUT',
        body: { bio, avatar }
      });
    },

    async toggleFollow(userId) {
      return API.request(`/api/users/follow/${userId}`, {
        method: 'POST'
      });
    },

    async getSuggestions() {
      return API.request('/api/users/suggestions', {
        method: 'GET'
      });
    }
  },

  // Post Operations
  posts: {
    async create(content, image) {
      return API.request('/api/posts', {
        method: 'POST',
        body: { content, image }
      });
    },

    async getFeed() {
      return API.request('/api/posts/feed', {
        method: 'GET'
      });
    },

    async getExplore() {
      return API.request('/api/posts/explore', {
        method: 'GET'
      });
    },

    async delete(postId) {
      return API.request(`/api/posts/${postId}`, {
        method: 'DELETE'
      });
    },

    async toggleLike(postId) {
      return API.request(`/api/posts/${postId}/like`, {
        method: 'POST'
      });
    },

    // Comments Operations nested under posts
    comments: {
      async add(postId, content) {
        return API.request(`/api/posts/${postId}/comments`, {
          method: 'POST',
          body: { content }
        });
      },

      async get(postId) {
        return API.request(`/api/posts/${postId}/comments`, {
          method: 'GET'
        });
      },

      async delete(commentId) {
        return API.request(`/api/posts/comments/${commentId}`, {
          method: 'DELETE'
        });
      }
    }
  }
};
