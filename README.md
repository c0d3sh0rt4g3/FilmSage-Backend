# FilmSage Backend API

A comprehensive movie recommendation and review platform backend built with Node.js, Express, and MongoDB. FilmSage provides AI-powered movie recommendations using Google's Gemini AI, along with a complete user management and review system.

## 🌟 Features

### Core Functionality
- **AI-Powered Recommendations**: Personalized movie recommendations using Google Gemini AI
- **User Management**: Complete authentication system with JWT tokens
- **Review System**: Users can create, read, update, and delete movie/TV show reviews
- **Social Features**: Follow users, like reviews, comment on reviews
- **Watchlist Management**: Add movies to personal watchlists
- **Favorites System**: Save favorite movies and TV shows
- **Rating System**: Rate movies and TV shows (1-5 stars)
- **Admin Panel**: Administrative controls for user and content management

### Advanced Features
- **Role-Based Access Control**: User, Reviewer, and Admin roles
- **Real-time Activity Tracking**: Monitor user interactions and activities
- **Content Moderation**: Admin approval system for reviews
- **Cross-Origin Resource Sharing (CORS)**: Configured for multiple frontend environments
- **Data Validation**: Comprehensive input validation using express-validator

## 🛠️ Technology Stack

- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: Google Generative AI (Gemini 1.5 Flash)
- **Authentication**: JWT (JSON Web Tokens) with bcrypt for password hashing
- **Validation**: Express Validator
- **Development Tools**: JSDoc for documentation

## 📁 Project Structure

```
filmsage-backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── db.js         # MongoDB connection
│   │   ├── gemini.js     # Google AI configuration
│   │   └── jwt.config.js # JWT configuration
│   ├── controllers/      # Route controllers
│   │   ├── user.controller.js
│   │   ├── review.controller.js
│   │   ├── userInteraction.controller.js
│   │   └── recommendationController.js
│   ├── middleware/       # Custom middleware
│   │   └── auth.middleware.js
│   ├── models/           # Database models
│   │   ├── user/         # User-related models
│   │   └── review/       # Review-related models
│   ├── routes/           # API routes
│   │   ├── user.routes.js
│   │   ├── review.routes.js
│   │   ├── userInteraction.routes.js
│   │   └── recommendationRoutes.js
│   ├── services/         # Business logic services
│   │   └── recommendationService.js
│   └── server.js         # Application entry point
├── package.json
├── package-lock.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB installation
- Google AI Studio API key for Gemini AI
- TMDB API key for automatic movie ID search
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/filmsage-backend.git
   cd filmsage-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=3000
   
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   
   # Google AI Configuration
   GEMINI_API_KEY=your_gemini_api_key
   
   # TMDB Configuration (for automatic movie ID search)
   TMDB_API_KEY=your_tmdb_api_key
   
   # Frontend URLs (for CORS)
   FRONTEND_URL_DEV=http://localhost:3000
   FRONTEND_URL_LOCAL=http://localhost:8080
   FRONTEND_URL_PROD=https://your-production-domain.com
   
   
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000` (or your specified PORT).

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/users/register` | Register a new user | None |
| POST | `/users/login` | User login | None |

### User Management

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/users` | Get all users | Admin |
| GET | `/users/:id` | Get user by ID | JWT |
| GET | `/users/:id/stats` | Get user statistics | JWT |
| PUT | `/users/:id` | Update user profile | JWT |
| PATCH | `/users/:id/password` | Change password | JWT |
| DELETE | `/users/:id` | Delete user | Admin |

### Review System

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/reviews` | Create a new review | JWT |
| GET | `/reviews` | Get all reviews | JWT |
| GET | `/reviews/:id` | Get review by ID | JWT |
| PUT | `/reviews/:id` | Update review | JWT |
| DELETE | `/reviews/:id` | Delete review | JWT |
| POST | `/reviews/:id/like` | Like a review | JWT |
| DELETE | `/reviews/:id/like` | Remove like | JWT |

### User Interactions

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/userInteractions/ratings` | Add rating | JWT |
| GET | `/userInteractions/ratings/user/:userId` | Get user ratings | JWT |
| POST | `/userInteractions/watchlist` | Add to watchlist | JWT |
| GET | `/userInteractions/watchlist/user/:userId` | Get user watchlist | JWT |
| POST | `/userInteractions/favorites` | Add to favorites | JWT |
| POST | `/userInteractions/follow` | Follow user | JWT |

### AI Recommendations

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/api/recommendations` | Get AI-powered recommendations | None |

**Request Body Example:**
```json
{
  "reviews": [
    {
      "title": "The Matrix",
      "contentType": "movie",
      "rating": 5,
      "content": "Amazing sci-fi movie with groundbreaking visual effects..."
    }
  ],
  "userId": "user_id_here",
  "favoriteGenres": [28, 878, 53]
}
```

**Available Genre IDs:**
- 28: Action, 12: Adventure, 16: Animation, 35: Comedy
- 80: Crime, 99: Documentary, 18: Drama, 10751: Family
- 14: Fantasy, 36: History, 27: Horror, 10402: Music
- 9648: Mystery, 10749: Romance, 878: Science Fiction
- 53: Thriller, 10752: War, 37: Western

## 🤖 AI Recommendation System

FilmSage uses Google's Gemini AI to provide personalized movie recommendations based on user reviews and favorite genres. The system:

1. **Analyzes User Reviews**: Processes the content and ratings of user reviews
2. **Considers Favorite Genres**: Takes into account the user's preferred movie genres
3. **Identifies Patterns**: Finds preferences in genres, themes, directors, and styles
4. **Generates Recommendations**: Provides 6 personalized movie suggestions with TMDB IDs
5. **Explains Reasoning**: Each recommendation includes detailed justification

### How It Works

The recommendation system uses RAG (Retrieval-Augmented Generation):
- **Retrieval**: Gathers user review data, ratings, and favorite genre preferences
- **Augmentation**: Enhances prompts with user statistics, patterns, and genre preferences
- **Generation**: Uses Gemini AI to generate contextual recommendations prioritizing favorite genres
- **Enrichment**: Automatically finds TMDB IDs for all recommended movies

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access**: Different permission levels (User, Reviewer, Admin)
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Environment Variables**: Sensitive data protected via environment configuration

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

## 📦 Dependencies

### Production Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `@google/generative-ai` - Google AI integration
- `axios` - HTTP client for TMDB API integration
- `jsonwebtoken` - JWT implementation
- `bcrypt` & `bcryptjs` - Password hashing libraries
- `cors` - Cross-origin resource sharing
- `express-validator` - Input validation
- `dotenv` - Environment variable management
- `sequelize` - SQL ORM (available but not actively used)

### Development Dependencies
- `jsdoc` - Documentation generation
- `docdash` - JSDoc theme

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Ensure all production environment variables are set
2. **Database**: Configure production MongoDB instance
3. **Security**: Update CORS origins for production domains
4. **Monitoring**: Implement logging and monitoring solutions
5. **Process Management**: Use PM2 or similar for process management

### Docker Deployment (Optional)

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**FilmSage Backend API** - Bringing AI-powered movie recommendations to film enthusiasts worldwide. 🎬✨