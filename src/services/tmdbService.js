import axios from 'axios';
import 'dotenv/config';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Search for a movie in TMDB and return the most likely match
 * @param {string} title - Movie title
 * @param {number} year - Movie year
 * @returns {Promise<number|null>} TMDB ID or null if not found
 */
async function searchMovieId(title, year) {
    if (!TMDB_API_KEY) {
        console.warn('TMDB_API_KEY not provided, skipping TMDB search');
        return null;
    }

    try {
        // Search for the movie
        const searchUrl = `${TMDB_BASE_URL}/search/movie`;
        const response = await axios.get(searchUrl, {
            params: {
                api_key: TMDB_API_KEY,
                query: title,
                year: year,
                language: 'en-US'
            }
        });

        const results = response.data.results;
        
        if (!results || results.length === 0) {
            console.log(`No TMDB results found for: ${title} (${year})`);
            return null;
        }

        // Find the best match
        const bestMatch = findBestMatch(results, title, year);
        
        if (bestMatch) {
            console.log(`Found TMDB ID ${bestMatch.id} for: ${title} (${year})`);
            return bestMatch.id;
        }

        return null;

    } catch (error) {
        console.error(`Error searching TMDB for ${title} (${year}):`, error.message);
        return null;
    }
}

/**
 * Find the best match from TMDB search results
 * @param {Array} results - TMDB search results
 * @param {string} originalTitle - Original movie title
 * @param {number} originalYear - Original movie year
 * @returns {Object|null} Best matching result or null
 */
function findBestMatch(results, originalTitle, originalYear) {
    // Normalize titles for comparison
    const normalizeTitle = (title) => title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const normalizedOriginal = normalizeTitle(originalTitle);
    
    // Sort results by relevance
    const scored = results.map(movie => {
        const movieYear = movie.release_date ? parseInt(movie.release_date.split('-')[0]) : null;
        const normalizedMovieTitle = normalizeTitle(movie.title);
        
        let score = 0;
        
        // Exact title match gets highest score
        if (normalizedMovieTitle === normalizedOriginal) {
            score += 100;
        } else if (normalizedMovieTitle.includes(normalizedOriginal) || normalizedOriginal.includes(normalizedMovieTitle)) {
            score += 50;
        }
        
        // Year match bonus
        if (movieYear === originalYear) {
            score += 30;
        } else if (movieYear && Math.abs(movieYear - originalYear) <= 1) {
            score += 20; // Allow 1 year difference
        }
        
        // Popularity bonus (but not too much weight)
        score += Math.min(movie.popularity / 10, 10);
        
        return { ...movie, score };
    });
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    // Return the best match if it has a reasonable score
    const bestMatch = scored[0];
    
    // Require at least some title similarity
    if (bestMatch && bestMatch.score >= 30) {
        return bestMatch;
    }
    
    return null;
}

/**
 * Enrich recommendations with TMDB IDs
 * @param {Array} recommendations - Array of recommendation objects
 * @returns {Promise<Array>} Enriched recommendations with TMDB IDs
 */
async function enrichRecommendationsWithTmdbIds(recommendations) {
    if (!TMDB_API_KEY) {
        console.warn('TMDB_API_KEY not provided, returning recommendations without TMDB IDs');
        return recommendations;
    }

    const enrichedRecommendations = [];
    
    for (const rec of recommendations) {
        try {
            // If tmdb_id is null or undefined, try to find it
            if (!rec.tmdb_id) {
                const tmdbId = await searchMovieId(rec.title, rec.year);
                rec.tmdb_id = tmdbId;
            }
            
            enrichedRecommendations.push(rec);
            
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 250));
            
        } catch (error) {
            console.error(`Error enriching recommendation ${rec.title}:`, error.message);
            enrichedRecommendations.push(rec); // Include it even without TMDB ID
        }
    }
    
    return enrichedRecommendations;
}

export {
    searchMovieId,
    enrichRecommendationsWithTmdbIds
}; 