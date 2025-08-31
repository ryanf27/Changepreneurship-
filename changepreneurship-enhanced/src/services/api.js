// API service for backend communication
const API_BASE_URL = 'https://5000-i0dlqt7t67jcvprs9lflc-e0f5bbcf.manusvm.computer/api'

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token')
  }

  // Helper method to get headers with authentication
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    return headers
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || 'API request failed')
    }
    return response.json()
  }

  // Authentication methods
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData)
    })
    
    const data = await this.handleResponse(response)
    
    if (data.token) {
      this.token = data.token
      localStorage.setItem('auth_token', data.token)
    }
    
    return data
  }

  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials)
    })
    
    const data = await this.handleResponse(response)
    
    if (data.token) {
      this.token = data.token
      localStorage.setItem('auth_token', data.token)
    }
    
    return data
  }

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders()
    })
    
    this.token = null
    localStorage.removeItem('auth_token')
    
    return this.handleResponse(response)
  }

  async verifySession() {
    if (!this.token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse(response)
  }

  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse(response)
  }

  // Assessment methods
  async getAssessmentPhases() {
    const response = await fetch(`${API_BASE_URL}/assessment/phases`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse(response)
  }

  async startAssessmentPhase(phaseId) {
    const response = await fetch(`${API_BASE_URL}/assessment/start/${phaseId}`, {
      method: 'POST',
      headers: this.getHeaders()
    })
    
    return this.handleResponse(response)
  }

  async saveAssessmentResponse(assessmentId, responseData) {
    const response = await fetch(`${API_BASE_URL}/assessment/${assessmentId}/response`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(responseData)
    })
    
    return this.handleResponse(response)
  }

  async updateAssessmentProgress(assessmentId, progressData) {
    const response = await fetch(`${API_BASE_URL}/assessment/${assessmentId}/progress`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(progressData)
    })
    
    return this.handleResponse(response)
  }

  async getAssessmentResponses(assessmentId) {
    const response = await fetch(`${API_BASE_URL}/assessment/${assessmentId}/responses`, {
      method: 'GET',
      headers: this.getHeaders()
    })
    
    return this.handleResponse(response)
  }

  async updateEntrepreneurProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/assessment/profile/update`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData)
    })
    
    return this.handleResponse(response)
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService()
export default apiService

