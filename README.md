# VibeNet - Mini Social Media Application

VibeNet is a complete, lightweight, and modern Single Page Application (SPA) social media site. It features a responsive, glassmorphic UI, JWT cookie-based secure authentication, interactive user profiles, following/follower networks, text & image posts, real-time comment threads, and post liking functionality.

Built on top of a modular **Express.js** backend, **MongoDB (Mongoose)** database schema, and **Vanilla HTML5/CSS3/JavaScript (ES6)**.

---

## Key Features

1. **Secure Session Authentication**: Registration and Login are protected by client-side validations and back-end password hashing (using `bcryptjs`). Authenticated sessions are securely stored in signed HTTP-Only cookies using signed JSON Web Tokens (JWT).
2. **Glassmorphic UI**: High-aesthetic responsive CSS layouts featuring custom CSS variables, hover micro-animations, glowing dark-theme elements, and scroll components.
3. **Follower System**: Follow/unfollow other users. Check followers count and following lists. Suggested accounts are automatically queried.
4. **Feed Routing**: Home Feed loads posts from accounts you follow + your own. Explore Feed allows browsing all global vibes.
5. **Interactive Posts**: Publish text posts with optional image attachments. Post creators can delete their posts.
6. **Double-State Liking**: Like and unlike posts, with visual icon toggles and instant counters.
7. **Threaded Comments**: Read and write comments on posts. Creators can delete their own comments, and post owners can manage all comments on their posts.
8. **Profile Customization**: Update bio text and select from curated avatar presets (powered by Dicebear).

---

## Project Structure

```
mini-social-media/
├── backend/
│   ├── config/
│   │   └── db.js            # Mongoose MongoDB Connection
│   ├── controllers/
│   │   ├── authController.js # Handles registration, login, logout
│   │   ├── postController.js # Handles post feeds, likes, explore, create/delete
│   │   └── userController.js # Handles user profiles, follow states, recommendations
│   ├── middleware/
│   │   └── authMiddleware.js # Authenticates HTTP-only cookie JWT tokens
│   ├── models/
│   │   ├── User.js          # User schema & encryption
│   │   ├── Post.js          # Post schema & likes array
│   │   └── Comment.js       # Comment schema
│   ├── routes/
│   │   ├── auth.js          # Auth endpoints
│   │   ├── posts.js         # Posts & comments endpoints
│   │   └── users.js         # User profiles & follows endpoints
│   └── server.js            # Entry server mounting static files & APIs
├── frontend/
│   └── public/
│       ├── index.html       # Dynamic SPA dashboard
│       ├── auth.html        # Authentication portal
│       ├── css/
│       │   └── style.css    # Premium CSS Variables & glassmorphism
│       └── js/
│           ├── api.js       # Fetch client wrappers
│           ├── auth.js      # Auth portal interface trigger
│           └── app.js       # Client router, render logic & widgets
├── .env                     # Local configuration parameters
├── package.json             # NPM dependencies & running scripts
└── README.md                # System documentation (This file)
```

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
* **Node.js** (v16.0.0 or higher) - [Download Node.js](https://nodejs.org/)
* **npm** (comes packaged with Node.js)
* **MongoDB Community Server** (running locally on port `27017` or using a MongoDB Atlas connection string) - [Download MongoDB](https://www.mongodb.com/try/download/community)

---

## Setup Instructions

### 1. Extract / Clone Code
Place the `mini-social-media` codebase directory onto your computer directory.

### 2. Configure Environment Variables
Inside the root folder `mini-social-media`, check the `.env` file (which is pre-configured with default values for local development):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/mini-social
JWT_SECRET=super_secret_session_key_987654321_abcdef
JWT_EXPIRE=30d
COOKIE_EXPIRE=30
```
> [!NOTE]
> If you are using a cloud-hosted database, replace the `MONGO_URI` value with your **MongoDB Atlas connection string**.

### 3. Install Dependencies
Open your command terminal (Command Prompt, PowerShell, or Bash) in the project root directory and run:
```bash
npm install
```
This installs the backend modules (`express`, `mongoose`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`) and dev tools (`nodemon`).

### 4. Start MongoDB
Ensure your local MongoDB instance is active:
* On Windows: Open Services and verify `MongoDB Server` service is `Running`.
* On Linux/macOS: Start via terminal: `sudo systemctl start mongod` or `brew services start mongodb-community`.

### 5. Launch Server
To run the server in development mode (with auto-reloading when editing backend code):
```bash
npm run dev
```

To run in production mode:
```bash
npm start
```

Once started, open your web browser and navigate to:
```
http://localhost:5000
```

---

## API Documentation Reference

All API routes require user authentication via cookie unless labeled **Public**.

### Authentication Routes
* `POST /api/auth/register` (Public) - Create a new user account.
* `POST /api/auth/login` (Public) - Validate user credentials and return HTTP-only Cookie JWT token.
* `POST /api/auth/logout` - Clear user JWT cookie session.
* `GET /api/auth/me` - Get credentials of the current logged-in user.

### User Routes
* `GET /api/users/profile/:username` - Get public profile data (bio, followers/following, join date) and posts list for a user.
* `PUT /api/users/profile` - Update own bio and avatar preset value.
* `POST /api/users/follow/:id` - Follow or unfollow a user by their MongoDB ObjectId.
* `GET /api/users/suggestions` - Get recommended accounts (excluding self and followed users).

### Post Routes
* `POST /api/posts` - Create a new text post (max 500 characters) with an optional image attachment URL.
* `GET /api/posts/feed` - Get combined feed containing posts of user + people they follow. Fallbacks to global explore feed if empty.
* `GET /api/posts/explore` - Get all posts in chronological order.
* `DELETE /api/posts/:id` - Delete a post (post creator only).
* `POST /api/posts/:id/like` - Like or unlike a post.
* `POST /api/posts/:postId/comments` - Post a comment on a post.
* `GET /api/posts/:postId/comments` - Retrieve list of comments for a post.
* `DELETE /api/posts/comments/:commentId` - Delete a comment (comment author or post owner only).
