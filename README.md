# Artist Atlas

**Artist Atlas** is a web application that allows users to discover and explore artists. The frontend is built with React and Tailwind CSS, providing a responsive and intuitive user experience. The backend serves as a FastAPI, delivering artist data and search functionality.

This repository contains both the frontend and backend code for the Artist Atlas application.

## Features

- **Browse Artists**: View a paginated list of artists with details like name, image, and genres.
- **Search Artists**: Search for artists with real-time suggestions using a debounced API call.
- **Artist Details**: Navigate to individual artist pages for more information.
- **Responsive Design**: Optimized for mobile, tablet, and desktop screens.
- **Efficient Performance**: Uses lazy-loaded images, memoized components, and debounced search.

## Tech Stack

### Frontend
- **React**: JavaScript library for building the user interface.
- **React Router**: Handles client-side routing.
- **Axios**: Makes HTTP requests to the backend API.
- **Lodash**: Provides utilities like `debounce` for search optimization.
- **Tailwind CSS**: Utility-first CSS framework for styling.

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL


## Installation

Follow these steps to set up and run the project locally.

### 1. Clone the Repository
```bash
  git clone https://github.com/Rabeeh-m/artist_atlas.git
  cd artist_atlas
```

### 2. Set Up the Backend

1. Navigate to the backend directory:
```bash
  cd backend
```

2. Install dependencies:
```bash
  pip install -r requirements.txt
```

3. Configure environment variables:
   Create a .env file in the backend directory.
   Add necessary variables
```bash
  DATABASE_URL=
  SPOTIFY_CLIENT_ID=
  SPOTIFY_CLIENT_SECRET=
```

4. Start the backend server:
```bash
  uvicorn main:app --reload
```

### 3. Set Up the Frontend

1. Navigate to the frontend directory:
```bash
  cd frontend
```

2. Install dependencies:
```bash
  npm install
```

4. Start the frontend development server:
```bash
  npm run dev
```
