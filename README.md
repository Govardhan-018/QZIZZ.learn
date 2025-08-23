# 📚 QZIZZ – AI Powered Quiz Platform

QZIZZ is a **full-stack MERN-style application** that allows users to **create, join, and analyze quizzes powered by AI**.
It provides **authentication (local & Google OAuth)**, **real-time quiz hosting**, **leaderboard ranking**, and **quiz analysis reports**.

-----

## 🚀 Features

  * 🔐 **Authentication** – Local signup/login & Google OAuth
  * 📝 **AI Quiz Generation** – Create quizzes dynamically using AI (OpenRouter API)
  * 🎮 **Join & Play** – Participants can join quizzes using quiz codes
  * 📊 **Quiz Dashboard** – Manage, monitor, and close quizzes
  * 🏆 **Leaderboard** – Ranking system with score & position updates
  * 📈 **Quiz Analysis** – Detailed report of answers vs correct answers
  * 👤 **User Profile** – View created & joined quizzes with results history

-----

## 📂 Project Structure

Here is the project folder structure (frontend + backend):

### **Frontend (`frontend/qz-front`)**

  * **`src/assets`** – Images, icons, and static files
  * **`src/components`** – Reusable components (Navbar, Profilebar, etc.)
  * **`src/pages`** – React pages (Login, Home, CreateQuiz, JoinQuiz, Quiz, Profile, Dashboard, Analysis)
  * **`App.jsx`** – Routes setup with React Router
  * **`ProtectedRoute.jsx`** – Ensures authenticated access
  * **`main.jsx`** – Entry point

### **Backend (`backend/`)**

  * **`index.js`** – Express server with routes
  * **`cron jobs`** – Cleans up old quizzes automatically
  * **`Supabase`** – Used as database for user, quiz, and result management
  * **`passport.js`** – Google OAuth strategy
  * **`.env`** – Environment configuration

-----

## ⚙️ Tech Stack

### **Frontend**

  * React + Vite
  * React Router DOM
  * Tailwind CSS
  * Context & LocalStorage for auth

### **Backend**

  * Node.js + Express
  * Supabase (Postgres)
  * JWT Authentication
  * Passport.js (Google OAuth)
  * Bcrypt (Password Hashing)
  * Node-Cron (Auto cleanup jobs)

### **AI**

  * OpenRouter API (Mistral-7B-Instruct) – Generates quiz questions

-----

## 🛠️ Installation & Setup

### 1\. Clone Repository

```bash
git clone https://github.com/your-username/qzizz.git
cd qzizz
```

### 2\. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:

```
PORT=3939
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3939/auth/google/callback

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

Run the backend:

```bash
node index.js
```

### 3\. Setup Frontend

```bash
cd frontend/qz-front
npm install
```

Create a `.env` file in the `frontend/qz-front` directory:

```
VITE_PROTECTED_URL=http://localhost:3939/protected
VITE_CREATE_QUIZ_URL=http://localhost:3939/create-quiz
VITE_JOIN_QUIZ_URL=http://localhost:3939/join-quiz
VITE_SUBMIT_ANS_URL=http://localhost:3939/submit-ans
VITE_USERLOG_URL=http://localhost:3939/login
VITE_USERSIGN_URL=http://localhost:3939/signup
VITE_USERGOOGLE_URL=http://localhost:3939/auth/google
VITE_GET_PROFILE_DATA_URL=http://localhost:3939/profile
VITE_CLOSE_QUIZ_URL=http://localhost:3939/close-quiz
VITE_QUIZ_GET_URL=http://localhost:3939/quiz
VITE_QUIZ_ANALYSIS_URL=http://localhost:3939/analysis
```

Run the frontend:

```bash
npm run dev
```

-----

## ⚡ Quickstart (Optional)

To streamline the development process and run both the frontend and backend with a **single command**, you can use the `concurrently` package.

### 1\. Install `concurrently`

First, install `concurrently` in the **root directory** of your project (where the `backend` and `frontend` folders are located).

```bash
npm install concurrently --save-dev
```

### 2\. Add a `dev` script to `package.json`

Create a `package.json` file in the **root directory** with the following scripts. This file will be responsible for running both the frontend and backend simultaneously.

```json
{
  "name": "qzizz-project",
  "version": "1.0.0",
  "description": "AI-powered quiz platform",
  "main": "index.js",
  "scripts": {
    "start-frontend": "cd frontend/qz-front && npm run dev",
    "start-backend": "cd backend && nodemon index.js",
    "dev": "concurrently \"npm run start-backend\" \"npm run start-frontend\""
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### 3\. Run with a single command

Now, you can start both the frontend and backend with a single command from the **root directory**:

```bash
npm run dev
```

-----

## 🔑 API Endpoints

### Authentication

  * `POST /signup` – Register new user
  * `POST /login` – Login with email & password
  * `GET /auth/google` – Google OAuth login
  * `POST /logout` – Logout

### Quiz Management

  * `POST /create-quiz` – Generate AI-powered quiz
  * `POST /join-quiz` – Join quiz with code
  * `POST /quiz` – Get quiz details
  * `POST /submit-ans` – Submit answers
  * `POST /close-quiz` – Close quiz & update rankings

### Profile

  * `GET /profile` – Get user info, created quizzes, joined quizzes, results
  * `POST /analysis` – Get detailed quiz analysis

-----

## 📸 Screenshots

Add screenshots inside a `screenshots/` folder and link them here. Example:

  * Login Page: `![Login Page](screenshots/login-page.png)`
  * Home Dashboard: `![Home Dashboard](screenshots/home-dashboard.png)`
  * Quiz Creation: `![Quiz Creation](screenshots/create-quiz.png)`
  * Quiz Analysis: `![Quiz Analysis](screenshots/quiz-analysis.png)`

-----

## 👨‍💻 Contributing

1.  Fork the repo
2.  Create a feature branch (`git checkout -b feature-x`)
3.  Commit your changes (`git commit -m 'Added feature x'`)
4.  Push the branch (`git push origin feature-x`)
5.  Create a Pull Request

-----

## 📜 License

This project is licensed under the MIT License.