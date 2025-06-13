import * as recommendationService from '../services/recommendationService.js';

const getRecommendations = async (req, res) => {
    try {
        // Obtener las reviews desde el body de la request
        const { reviews, userId } = req.body;
        
        if (!reviews || !Array.isArray(reviews)) {
            return res.status(400).json({ 
                message: 'Reviews are required', 
                error: 'Debes proporcionar un array de reviews en el body de la request' 
            });
        }

        if (reviews.length === 0) {
            return res.status(400).json({ 
                message: 'No reviews provided', 
                error: 'El array de reviews está vacío. Se necesitan reviews para generar recomendaciones.' 
            });
        }

        console.log(`Generando recomendaciones basadas en ${reviews.length} reviews`);
        const recommendations = await recommendationService.getMovieRecommendations(reviews);
        
        res.status(200).json({
            message: 'Recomendaciones generadas exitosamente',
            reviewsAnalyzed: reviews.length,
            userId: userId || 'no especificado',
            ...recommendations
        });
    } catch (error) {
        console.error('Error en getRecommendations:', error);
        res.status(500).json({ 
            message: 'Error generating recommendations', 
            error: error.message 
        });
    }
};

export {
    getRecommendations,
}; 