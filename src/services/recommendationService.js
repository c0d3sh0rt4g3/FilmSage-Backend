import genAI from '../config/gemini.js';

async function getMovieRecommendations(userReviews) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // RAG: Retrieval-Augmented Generation
    // 1. Validation: Verificar que se recibieron reviews
    if (!userReviews || userReviews.length === 0) {
        throw new Error("No se proporcionaron reviews del usuario para generar recomendaciones.");
    }

    // 2. Augmentation: Las reviews ya vienen preparadas desde el frontend
    const reviewsData = userReviews;

    // Calcular estadísticas
    const averageRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
    const highRatedReviews = reviewsData.filter(review => review.rating >= 4);
    const lowRatedReviews = reviewsData.filter(review => review.rating <= 2);

    // 3. Build a detailed prompt
    const prompt = `
        Actúa como un experto en cine y un sistema de recomendación de películas llamado FilmSage.
        Analiza las siguientes reviews escritas por un usuario para entender sus gustos y preferencias cinematográficas:

        ESTADÍSTICAS DEL USUARIO:
        - Puntuación promedio: ${averageRating.toFixed(1)}/5
        - Reviews con puntuación alta (4-5): ${highRatedReviews.length}
        - Reviews con puntuación baja (1-2): ${lowRatedReviews.length}

        REVIEWS DEL USUARIO:
        ${reviewsData.map((review, index) => `
        ${index + 1}. "${review.title}" (${review.contentType}) - Puntuación: ${review.rating}/5
           Review: "${review.content}"
        `).join('\n')}

        INSTRUCCIONES:
        1. Analiza el tono y contenido de cada review para identificar qué elementos le gustan o disgustan al usuario
        2. Considera tanto la puntuación numérica como el contenido escrito de la review
        3. Identifica patrones en géneros, directores, actores, temáticas, estilos narrativos, etc.
        4. Recomienda 5 películas que coincidan con los gustos identificados
        5. NO recomiendes ninguna película que ya haya reseñado

        Tu respuesta DEBE ser únicamente un objeto JSON válido, sin ningún texto o formato adicional antes o después.
        El objeto JSON debe tener una única clave "recommendations" que sea un array de objetos.
        Cada objeto en el array debe tener las siguientes claves: "title", "year", y "justification" (explicación detallada basada en el análisis de sus reviews).

        Ejemplo de la estructura de respuesta:
        {
          "recommendations": [
            {
              "title": "Blade Runner 2049",
              "year": 2017,
              "justification": "Basándome en tu review positiva de films de ciencia ficción con narrativa compleja y tu apreciación por la cinematografía atmosférica, esta secuela combina elementos visuales impresionantes con profundidad filosófica."
            }
          ]
        }
    `;

    // 4. Generation: Call the model
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Validar que la respuesta sea JSON válido
        if (!text.trim().startsWith('{')) {
            throw new Error('Respuesta inválida de Gemini - no es JSON válido');
        }
        
        return JSON.parse(text);

    } catch (error) {
        console.error("Error getting recommendations from Gemini:", error);
        throw new Error("Failed to get recommendations: " + error.message);
    }
}

export {
    getMovieRecommendations,
}; 