/**
 * Recommendation controller module
 * Handles movie recommendation requests using AI-powered analysis
 * @file recommendationController.js
 * @module controllers/recommendationController
 */

import * as recommendationService from '../services/recommendationService.js';

/**
 * Generates movie recommendations based on user reviews and favorite genres
 * @async
 * @function getRecommendations
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Array} req.body.reviews - Array of user review objects
 * @param {string} req.body.userId - User identifier (optional)
 * @param {Array} req.body.favoriteGenres - Array of favorite genre IDs (optional)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with generated recommendations
 * @throws {Object} 400 status when reviews are missing or invalid
 * @throws {Object} 500 status when recommendation generation fails
 */
const getRecommendations = async (req, res) => {
    try {
        // Obtener las reviews y géneros favoritos desde el body de la request
        const { reviews, userId, favoriteGenres = [] } = req.body;
        
        if (!reviews || !Array.isArray(reviews)) {
            return res.status(400).json({ 
                message: 'Reviews are required', 
                error: 'Must provide an array of reviews in the request body' 
            });
        }

        if (reviews.length === 0) {
            return res.status(400).json({ 
                message: 'No reviews provided', 
                error: 'The reviews array is empty. Reviews are needed to generate recommendations.' 
            });
        }

        console.log(`Generating recommendations based on ${reviews.length} reviews and ${favoriteGenres.length} favorite genres`);
        const recommendations = await recommendationService.getMovieRecommendations(reviews, favoriteGenres);
        
        res.status(200).json({
            message: 'Recommendations generated successfully',
            reviewsAnalyzed: reviews.length,
            favoriteGenresCount: favoriteGenres.length,
            userId: userId || 'not specified',
            ...recommendations
        });
    } catch (error) {
        console.error('Error in getRecommendations:', error);
        res.status(500).json({ 
            message: 'Error generating recommendations', 
            error: error.message 
        });
    }
};

export {
    getRecommendations,
}; 