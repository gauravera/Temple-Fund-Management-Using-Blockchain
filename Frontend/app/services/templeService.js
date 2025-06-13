import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const templeService = {
    // Get all temples with pagination and filters
    getAllTemples: async (page = 1, limit = 10, filters = {}) => {
        try {
            const queryParams = new URLSearchParams({
                page,
                limit,
                ...filters
            });
            
            const response = await axios.get(`${API_URL}/temples/get-all-temples?${queryParams}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get temple by admin
    getTempleByAdmin: async () => {
        try {
            const response = await axios.get(`${API_URL}/temples/get-temple-by-admin`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
}; 