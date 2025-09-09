/**
 * API Service for Changepreneurship Platform
 * Handles all backend communication with proper session token management
 */

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();
const API_BASE_URL = RAW_BASE
  ? RAW_BASE.replace(/\/+$/, "")
  : "http://localhost:5000/api";

const SESSION_TOKEN_KEY =
  import.meta.env.VITE_SESSION_STORAGE_KEY || "changepreneurship_session_token";
const USER_DATA_KEY =
  import.meta.env.VITE_USER_STORAGE_KEY || "changepreneurship_user_data";

class ApiService {
  constructor() {
    this.sessionToken = localStorage.getItem(SESSION_TOKEN_KEY);
    this.userData = this.getUserData();
  }

  getHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (this.sessionToken)
      headers["Authorization"] = `Bearer ${this.sessionToken}`;
    return headers;
  }

  async handleResponse(response) {
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid response format from server");
    }
    if (!response.ok) {
      const msg =
        data.error ||
        data.message ||
        `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(msg);
    }
    return data;
  }

  setSession(sessionToken, userData, expiresAt) {
    this.sessionToken = sessionToken;
    this.userData = userData;
    if (sessionToken) {
      localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
      localStorage.setItem(
        USER_DATA_KEY,
        JSON.stringify({ ...userData, expiresAt })
      );
    } else {
      this.clearSession();
    }
  }

  clearSession() {
    this.sessionToken = null;
    this.userData = null;
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  }

  getUserData() {
    try {
      const raw = localStorage.getItem(USER_DATA_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  isSessionExpired() {
    if (!this.userData || !this.userData.expiresAt) return true;
    return Date.now() >= new Date(this.userData.expiresAt).getTime();
  }

  isAuthenticated() {
    return !!(this.sessionToken && !this.isSessionExpired());
  }

  async register(userData) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await this.handleResponse(res);
    if (data.session_token)
      this.setSession(data.session_token, data.user, data.expires_at);
    return data;
  }

  async login(credentials) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });
    const data = await this.handleResponse(res);
    if (data.session_token)
      this.setSession(data.session_token, data.user, data.expires_at);
    return data;
  }

  async logout() {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: this.getHeaders(),
      });
      await this.handleResponse(res);
    } catch {
    } finally {
      this.clearSession();
    }
    return { message: "Logout successful" };
  }

  async verifySession() {
    if (!this.sessionToken) throw new Error("No authentication token");
    if (this.isSessionExpired()) {
      this.clearSession();
      throw new Error("Session expired");
    }
    const res = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const data = await this.handleResponse(res);
    if (data.user)
      this.setSession(this.sessionToken, data.user, this.userData?.expiresAt);
    return data;
  }

  async getProfile() {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }

  // ==================== ASSESSMENT METHODS ====================

  /**
   * Get all assessment phases
   * @returns {Promise<Object>} Assessment phases data
   */
  async getAssessmentPhases() {
    const response = await fetch(`${API_BASE_URL}/assessment/phases`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Start a new assessment phase
   * @param {string} phaseId - Assessment phase identifier
   * @returns {Promise<Object>} Assessment start response
   */
  async startAssessmentPhase(phaseId) {
    const response = await fetch(
      `${API_BASE_URL}/assessment/start/${phaseId}`,
      {
        method: "POST",
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Save assessment response
   * @param {string} assessmentId - Assessment identifier
   * @param {Object} responseData - Response data
   * @returns {Promise<Object>} Save response
   */
  async saveAssessmentResponse(assessmentId, responseData) {
    const response = await fetch(
      `${API_BASE_URL}/assessment/${assessmentId}/response`,
      {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(responseData),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Update assessment progress
   * @param {string} assessmentId - Assessment identifier
   * @param {Object} progressData - Progress data
   * @returns {Promise<Object>} Update response
   */
  async updateAssessmentProgress(assessmentId, progressData) {
    const response = await fetch(
      `${API_BASE_URL}/assessment/${assessmentId}/progress`,
      {
        method: "PUT",
        headers: this.getHeaders(),
        body: JSON.stringify(progressData),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Get assessment responses
   * @param {string} assessmentId - Assessment identifier
   * @returns {Promise<Object>} Assessment responses
   */
  async getAssessmentResponses(assessmentId) {
    const response = await fetch(
      `${API_BASE_URL}/assessment/${assessmentId}/responses`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Update entrepreneur profile
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>} Update response
   */
  async updateEntrepreneurProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/assessment/profile/update`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(profileData),
    });

    return this.handleResponse(response);
  }

  // ==================== ANALYTICS METHODS ====================

  /**
   * Get dashboard overview
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardOverview() {
    const response = await fetch(
      `${API_BASE_URL}/analytics/dashboard/overview`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Get progress history
   * @param {number} days - Number of days to retrieve
   * @returns {Promise<Object>} Progress history data
   */
  async getProgressHistory(days = 30) {
    const response = await fetch(
      `${API_BASE_URL}/analytics/dashboard/progress-history?days=${days}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Get entrepreneur profile analytics
   * @returns {Promise<Object>} Profile analytics data
   */
  async getEntrepreneurProfileAnalytics() {
    const response = await fetch(
      `${API_BASE_URL}/analytics/dashboard/entrepreneur-profile`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Get personalized recommendations
   * @returns {Promise<Object>} Recommendations data
   */
  async getRecommendations() {
    const response = await fetch(
      `${API_BASE_URL}/analytics/dashboard/recommendations`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  /**
   * Fetch entrepreneurship principles
   * @param {Object} params - Filter options
   * @param {string} [params.category] - Principle category
   * @param {string} [params.stage] - Business stage
   * @param {number} [params.limit] - Max number of results
   * @returns {Promise<Array>} List of principles
   */
  async getPrinciples(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query
      ? `${API_BASE_URL}/principles?${query}`
      : `${API_BASE_URL}/principles`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  /**
   * Get assessment statistics
   * @returns {Promise<Object>} Assessment statistics
   */
  async getAssessmentStatistics() {
    const response = await fetch(
      `${API_BASE_URL}/analytics/dashboard/assessment-stats`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    return this.handleResponse(response);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get current user data
   * @returns {Object|null} Current user data
   */
  getCurrentUser() {
    return this.userData;
  }

  /**
   * Get current session token
   * @returns {string|null} Current session token
   */
  getSessionToken() {
    return this.sessionToken;
  }

  /**
   * Get API base URL
   * @returns {string} API base URL
   */
  getApiBaseUrl() {
    return API_BASE_URL;
  }

  /**
   * Check if API is available
   * @returns {Promise<boolean>} True if API is available
   */
  async checkApiHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      return response.ok;
    } catch (error) {
      console.warn("API health check failed:", error.message);
      return false;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

// Auto-verify session on initialization if token exists
if (apiService.isAuthenticated()) {
  apiService.verifySession().catch(() => apiService.clearSession());
}

export default apiService;
