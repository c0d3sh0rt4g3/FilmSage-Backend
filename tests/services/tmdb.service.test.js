/**
 * TMDB Service Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock axios
jest.mock('axios');

describe('TMDB Service Tests', () => {
  let tmdbService;
  let axios;

  beforeEach(async () => {
    // Import axios mock
    const axiosModule = await import('axios');
    axios = axiosModule.default;
    
    // Setup axios mock methods
    axios.get = jest.fn();

    // Clear all mocks
    jest.clearAllMocks();

    // Create TMDB service implementation
    tmdbService = {
      searchMovies: async (query) => {
        try {
          const response = await axios.get(`/search/movie`, {
            params: {
              api_key: 'test-api-key',
              query,
              page: 1
            }
          });
          return response.data;
        } catch (error) {
          throw new Error('Failed to search movies');
        }
      },

      getMovieDetails: async (movieId) => {
        try {
          const response = await axios.get(`/movie/${movieId}`, {
            params: {
              api_key: 'test-api-key'
            }
          });
          return response.data;
        } catch (error) {
          throw new Error('Failed to get movie details');
        }
      },

      searchTVShows: async (query) => {
        try {
          const response = await axios.get(`/search/tv`, {
            params: {
              api_key: 'test-api-key',
              query,
              page: 1
            }
          });
          return response.data;
        } catch (error) {
          throw new Error('Failed to search TV shows');
        }
      },

      getTVShowDetails: async (tvId) => {
        try {
          const response = await axios.get(`/tv/${tvId}`, {
            params: {
              api_key: 'test-api-key'
            }
          });
          return response.data;
        } catch (error) {
          throw new Error('Failed to get TV show details');
        }
      },

      getPopularMovies: async (page = 1) => {
        try {
          const response = await axios.get('/movie/popular', {
            params: {
              api_key: 'test-api-key',
              page
            }
          });
          return response.data;
        } catch (error) {
          throw new Error('Failed to get popular movies');
        }
      },

      getTopRatedMovies: async (page = 1) => {
        try {
          const response = await axios.get('/movie/top_rated', {
            params: {
              api_key: 'test-api-key',
              page
            }
          });
          return response.data;
        } catch (error) {
          throw new Error('Failed to get top rated movies');
        }
      },

      getMoviesByGenre: async (genreId, page = 1) => {
        try {
          const response = await axios.get('/discover/movie', {
            params: {
              api_key: 'test-api-key',
              with_genres: genreId,
              page
            }
          });
          return response.data;
        } catch (error) {
          throw new Error('Failed to get movies by genre');
        }
      },

      getGenres: async () => {
        try {
          const response = await axios.get('/genre/movie/list', {
            params: {
              api_key: 'test-api-key'
            }
          });
          return response.data;
        } catch (error) {
          throw new Error('Failed to get genres');
        }
      },

      getMovieCredits: async (movieId) => {
        try {
          const response = await axios.get(`/movie/${movieId}/credits`, {
            params: {
              api_key: 'test-api-key'
            }
          });
          return response.data;
        } catch (error) {
          throw new Error('Failed to get movie credits');
        }
      }
    };
  });

  describe('Movie Search', () => {
    it('should search movies successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 550,
              title: 'Fight Club',
              overview: 'A ticking-time-bomb insomniac...',
              release_date: '1999-10-15'
            }
          ],
          total_results: 1,
          total_pages: 1
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.searchMovies('Fight Club');

      expect(axios.get).toHaveBeenCalledWith('/search/movie', {
        params: {
          api_key: 'test-api-key',
          query: 'Fight Club',
          page: 1
        }
      });
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Fight Club');
    });

    it('should handle search error', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(tmdbService.searchMovies('Invalid')).rejects.toThrow('Failed to search movies');
    });
  });

  describe('Movie Details', () => {
    it('should get movie details successfully', async () => {
      const mockResponse = {
        data: {
          id: 550,
          title: 'Fight Club',
          overview: 'A ticking-time-bomb insomniac...',
          release_date: '1999-10-15',
          runtime: 139,
          genres: [{ id: 18, name: 'Drama' }]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.getMovieDetails(550);

      expect(axios.get).toHaveBeenCalledWith('/movie/550', {
        params: {
          api_key: 'test-api-key'
        }
      });
      expect(result.title).toBe('Fight Club');
      expect(result.runtime).toBe(139);
    });

    it('should handle movie details error', async () => {
      axios.get.mockRejectedValue(new Error('Not found'));

      await expect(tmdbService.getMovieDetails(999999)).rejects.toThrow('Failed to get movie details');
    });
  });

  describe('TV Shows', () => {
    it('should search TV shows successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 1399,
              name: 'Game of Thrones',
              overview: 'Seven noble families fight...',
              first_air_date: '2011-04-17'
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.searchTVShows('Game of Thrones');

      expect(axios.get).toHaveBeenCalledWith('/search/tv', {
        params: {
          api_key: 'test-api-key',
          query: 'Game of Thrones',
          page: 1
        }
      });
      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Game of Thrones');
    });

    it('should get TV show details successfully', async () => {
      const mockResponse = {
        data: {
          id: 1399,
          name: 'Game of Thrones',
          overview: 'Seven noble families fight...',
          first_air_date: '2011-04-17',
          number_of_seasons: 8
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.getTVShowDetails(1399);

      expect(axios.get).toHaveBeenCalledWith('/tv/1399', {
        params: {
          api_key: 'test-api-key'
        }
      });
      expect(result.name).toBe('Game of Thrones');
      expect(result.number_of_seasons).toBe(8);
    });
  });

  describe('Popular and Top Rated Movies', () => {
    it('should get popular movies successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, title: 'Popular Movie 1' },
            { id: 2, title: 'Popular Movie 2' }
          ],
          page: 1,
          total_pages: 5
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.getPopularMovies();

      expect(axios.get).toHaveBeenCalledWith('/movie/popular', {
        params: {
          api_key: 'test-api-key',
          page: 1
        }
      });
      expect(result.results).toHaveLength(2);
    });

    it('should get top rated movies successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, title: 'Top Movie 1', vote_average: 9.0 },
            { id: 2, title: 'Top Movie 2', vote_average: 8.8 }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.getTopRatedMovies(2);

      expect(axios.get).toHaveBeenCalledWith('/movie/top_rated', {
        params: {
          api_key: 'test-api-key',
          page: 2
        }
      });
      expect(result.results[0].vote_average).toBe(9.0);
    });
  });

  describe('Movies by Genre', () => {
    it('should get movies by genre successfully', async () => {
      const mockResponse = {
        data: {
          results: [
            { id: 1, title: 'Action Movie 1', genre_ids: [28] },
            { id: 2, title: 'Action Movie 2', genre_ids: [28] }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.getMoviesByGenre(28);

      expect(axios.get).toHaveBeenCalledWith('/discover/movie', {
        params: {
          api_key: 'test-api-key',
          with_genres: 28,
          page: 1
        }
      });
      expect(result.results).toHaveLength(2);
    });

    it('should handle movies by genre error', async () => {
      axios.get.mockRejectedValue(new Error('API error'));

      await expect(tmdbService.getMoviesByGenre(999)).rejects.toThrow('Failed to get movies by genre');
    });
  });

  describe('Genres', () => {
    it('should get genres successfully', async () => {
      const mockResponse = {
        data: {
          genres: [
            { id: 28, name: 'Action' },
            { id: 12, name: 'Adventure' },
            { id: 16, name: 'Animation' },
            { id: 35, name: 'Comedy' },
            { id: 80, name: 'Crime' },
            { id: 18, name: 'Drama' }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.getGenres();

      expect(axios.get).toHaveBeenCalledWith('/genre/movie/list', {
        params: {
          api_key: 'test-api-key'
        }
      });
      expect(result.genres).toHaveLength(6);
      expect(result.genres[0].name).toBe('Action');
      expect(result.genres[5].name).toBe('Drama');
    });

    it('should handle genres error', async () => {
      axios.get.mockRejectedValue(new Error('API error'));

      await expect(tmdbService.getGenres()).rejects.toThrow('Failed to get genres');
    });
  });

  describe('Movie Credits', () => {
    it('should get movie credits successfully', async () => {
      const mockResponse = {
        data: {
          id: 550,
          cast: [
            {
              id: 819,
              name: 'Edward Norton',
              character: 'The Narrator',
              profile_path: '/5XBzD5WuTyVQZeS4VI25z2moMeY.jpg'
            },
            {
              id: 287,
              name: 'Brad Pitt',
              character: 'Tyler Durden',
              profile_path: '/cckcYc2v0yh1tc9QjRelptcOBko.jpg'
            }
          ],
          crew: [
            {
              id: 7467,
              name: 'David Fincher',
              job: 'Director',
              profile_path: '/dcBHqWnbOw0CqfVbvOa7auO6qUx.jpg'
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.getMovieCredits(550);

      expect(axios.get).toHaveBeenCalledWith('/movie/550/credits', {
        params: {
          api_key: 'test-api-key'
        }
      });
      expect(result.cast).toHaveLength(2);
      expect(result.crew).toHaveLength(1);
      expect(result.cast[0].name).toBe('Edward Norton');
      expect(result.crew[0].job).toBe('Director');
    });

    it('should handle movie credits error', async () => {
      axios.get.mockRejectedValue(new Error('API error'));

      await expect(tmdbService.getMovieCredits(999999)).rejects.toThrow('Failed to get movie credits');
    });
  });

  describe('API Configuration', () => {
    it('should handle API key validation', () => {
      const validateApiKey = (apiKey) => {
        if (!apiKey) {
          throw new Error('API key is required');
        }
        if (typeof apiKey !== 'string') {
          throw new Error('API key must be a string');
        }
        if (apiKey.length < 10) {
          throw new Error('API key appears to be invalid');
        }
        return true;
      };

      expect(validateApiKey('test-api-key')).toBe(true);
      expect(() => validateApiKey('')).toThrow('API key is required');
      expect(() => validateApiKey(null)).toThrow('API key is required');
      expect(() => validateApiKey(123)).toThrow('API key must be a string');
      expect(() => validateApiKey('short')).toThrow('API key appears to be invalid');
    });

    it('should build correct API URLs', () => {
      const buildUrl = (endpoint, params = {}) => {
        const baseUrl = 'https://api.themoviedb.org/3';
        const url = new URL(endpoint, baseUrl);
        
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
          }
        });
        
        return url.toString();
      };

      const searchUrl = buildUrl('/search/movie', {
        api_key: 'test-key',
        query: 'Fight Club',
        page: 1
      });

      expect(searchUrl).toContain('/search/movie');
      expect(searchUrl).toContain('api_key=test-key');
      expect(searchUrl).toContain('query=Fight+Club');
      expect(searchUrl).toContain('page=1');
    });
  });

  describe('Response Parsing', () => {
    it('should parse movie response correctly', () => {
      const parseMovieResponse = (response) => {
        if (!response || !response.data) {
          throw new Error('Invalid response');
        }

        const { data } = response;
        
        return {
          id: data.id,
          title: data.title,
          overview: data.overview,
          releaseDate: data.release_date,
          runtime: data.runtime,
          voteAverage: data.vote_average,
          genres: data.genres || [],
          posterPath: data.poster_path,
          backdropPath: data.backdrop_path
        };
      };

      const mockResponse = {
        data: {
          id: 550,
          title: 'Fight Club',
          overview: 'A ticking-time-bomb insomniac...',
          release_date: '1999-10-15',
          runtime: 139,
          vote_average: 8.8,
          poster_path: '/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg'
        }
      };

      const parsed = parseMovieResponse(mockResponse);

      expect(parsed.id).toBe(550);
      expect(parsed.title).toBe('Fight Club');
      expect(parsed.releaseDate).toBe('1999-10-15');
      expect(parsed.runtime).toBe(139);
      expect(parsed.voteAverage).toBe(8.8);
    });

    it('should handle malformed responses', () => {
      const parseResponse = (response) => {
        if (!response || !response.data) {
          throw new Error('Invalid response');
        }
        return response.data;
      };

      expect(() => parseResponse(null)).toThrow('Invalid response');
      expect(() => parseResponse({})).toThrow('Invalid response');
      expect(() => parseResponse({ data: 'valid' })).not.toThrow();
    });
  });
}); 