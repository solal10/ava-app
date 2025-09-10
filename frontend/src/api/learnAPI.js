// src/api/learnAPI.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getToken = () => localStorage.getItem('token');

const learnAPI = {
  async addLearn(log) {
    try {
      const res = await fetch(`${BASE_URL}/api/learn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(log),
      });
      return await res.json();
    } catch (err) {
      console.error('Erreur Learn API:', err);
      return null;
    }
  },

  async getUserLogs(userId) {
    try {
      const res = await fetch(`${BASE_URL}/api/learn/${userId}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      return await res.json();
    } catch (err) {
      console.error('Erreur récupération logs Learn:', err);
      return [];
    }
  }
};

export default learnAPI;
