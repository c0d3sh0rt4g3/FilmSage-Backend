import genAI from '../config/gemini.js';
import { enrichRecommendationsWithTmdbIds } from './tmdbService.js';

// Genre mapping from TMDB IDs to names
const GENRE_MAP = {
    28: 'Action',
    12: 'Adventure', 
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    53: 'Thriller',
    10752: 'War',
    37: 'Western'
};

async function getMovieRecommendations(userReviews, favoriteGenres = []) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // RAG: Retrieval-Augmented Generation
    // 1. Validation: Verificar que se recibieron reviews
    if (!userReviews || userReviews.length === 0) {
        throw new Error("No se proporcionaron reviews del usuario para generar recomendaciones.");
    }

    // 2. Augmentation: Las reviews ya vienen preparadas desde el frontend
    const reviewsData = userReviews;
    
    // Convert favorite genre IDs to names
    const favoriteGenreNames = favoriteGenres.map(id => GENRE_MAP[id]).filter(Boolean);

    // Calcular estadísticas
    const averageRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
    const highRatedReviews = reviewsData.filter(review => review.rating >= 4);
    const lowRatedReviews = reviewsData.filter(review => review.rating <= 2);

    // 3. Build a detailed prompt
    const favoriteGenresText = favoriteGenreNames.length > 0 
        ? `User's favorite genres: ${favoriteGenreNames.join(', ')}`
        : 'No specific favorite genres provided';
    
    const prompt = `
        Act as a movie expert and a movie recommendation system called FilmSage.
        Analyze the following user reviews to understand their movie tastes and cinematographic preferences:

        USER STATISTICS:
        - Average rating: ${averageRating.toFixed(1)}/5
        - High-rated reviews (4-5): ${highRatedReviews.length}
        - Low-rated reviews (1-2): ${lowRatedReviews.length}

        USER PREFERENCES:
        - ${favoriteGenresText}

        USER REVIEWS:
        ${reviewsData.map((review, index) => `
        ${index + 1}. "${review.title}" (${review.contentType}) - Rating: ${review.rating}/5
           Review: "${review.content}"
        `).join('\n')}

        INSTRUCTIONS:
        1. Analyze the tone and content of each review to identify what elements the user likes or dislikes
        2. Consider both the numerical rating and the written content of the review
        3. Pay special attention to the user's favorite genres and give preference to movies in those genres
        4. Identify patterns in genres, directors, actors, themes, narrative styles, etc.
        5. Recommend 6 movies that match the identified preferences, prioritizing the user's favorite genres when possible
        6. DO NOT recommend any movie that the user has already reviewed
        7. Don't worry about including TMDB IDs - the system will find them automatically

        REQUIRED RESPONSE FORMAT:
        Your response MUST be only a valid JSON object. DO NOT include explanatory text, markdown, or additional code formatting.
        The JSON object must have a single key "recommendations" that is an array of objects.
        Each object in the array must have exactly these keys: "title", "year", and "justification".
        You can optionally include "tmdb_id" if you're absolutely certain of the ID, otherwise omit it entirely.

        EXACT EXPECTED FORMAT EXAMPLE:
        {
          "recommendations": [
            {
              "title": "Blade Runner 2049",
              "year": 2017,
              "justification": "Based on your positive review of sci-fi films with complex narratives and your appreciation for atmospheric cinematography, this sequel combines impressive visual elements with philosophical depth."
            },
            {
              "title": "The Shawshank Redemption",
              "year": 1994,
              "justification": "Considering your positive evaluation of emotional narratives with deep character development, this prison drama offers a moving story about hope and friendship."
            }
          ]
        }

        IMPORTANT: Respond ONLY with the JSON, without additional text or code formatting.
        ALL JUSTIFICATIONS MUST BE IN ENGLISH.
    `;

    // 4. Generation: Call the model
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("Raw Gemini response:", text); // Debug log
        
        // Extract JSON from the response (handle markdown code blocks)
        let jsonString = text.trim();
        
        // If response is wrapped in markdown code blocks, extract the JSON
        if (jsonString.includes('```json')) {
            const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonString = jsonMatch[1].trim();
            }
        } else if (jsonString.includes('```')) {
            // Handle generic code blocks
            const codeMatch = jsonString.match(/```\s*([\s\S]*?)\s*```/);
            if (codeMatch) {
                jsonString = codeMatch[1].trim();
            }
        }
        
        // Remove any leading/trailing non-JSON text
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
        }
        
        // Validate that we have JSON-like content
        if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
            console.error("Processed response doesn't look like JSON:", jsonString);
            throw new Error('Respuesta inválida de Gemini - no es JSON válido');
        }
        
        const parsedResponse = JSON.parse(jsonString);
        
        // Validate the structure
        if (!parsedResponse.recommendations || !Array.isArray(parsedResponse.recommendations)) {
            throw new Error('Invalid response structure - missing recommendations array');
        }

        // Validate each recommendation has required fields
        for (const rec of parsedResponse.recommendations) {
            if (!rec.title || !rec.year || !rec.justification) {
                throw new Error('Invalid recommendation structure - missing required fields (title, year, justification)');
            }
            // tmdb_id is optional, but if present should be a number or null
            if (rec.tmdb_id !== null && rec.tmdb_id !== undefined && typeof rec.tmdb_id !== 'number') {
                console.warn('Warning: tmdb_id should be a number or null, got:', typeof rec.tmdb_id);
                // Set to null if invalid
                rec.tmdb_id = null;
            }
        }
        
        // Enrich recommendations with TMDB IDs if missing
        console.log('Enriching recommendations with TMDB IDs...');
        const enrichedRecommendations = await enrichRecommendationsWithTmdbIds(parsedResponse.recommendations);
        
        return {
            ...parsedResponse,
            recommendations: enrichedRecommendations
        };

    } catch (error) {
        console.error("Error getting recommendations from Gemini:", error);
        throw new Error("Failed to get recommendations: " + error.message);
    }
}

export {
    getMovieRecommendations,
}; 