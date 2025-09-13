import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export const useAssessmentAPI = () => {
  const { isAuthenticated, apiCall } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Auto-save assessment data to backend
  const saveAssessmentData = async (phaseId, data) => {
    if (!isAuthenticated) {
      // Save to localStorage for non-authenticated users
      const existingData = JSON.parse(localStorage.getItem('changepreneurship-assessment') || '{}')
      const updatedData = {
        ...existingData,
        assessmentData: {
          ...existingData.assessmentData,
          [phaseId]: {
            ...existingData.assessmentData?.[phaseId],
            ...data,
            lastUpdated: new Date().toISOString()
          }
        }
      }
      localStorage.setItem('changepreneurship-assessment', JSON.stringify(updatedData))
      return { success: true }
    }

    try {
      setLoading(true)
      setError(null)

      // Start assessment phase if not already started
      const startResponse = await apiCall(`/assessment/start/${phaseId}`, {
        method: 'POST'
      })

      if (!startResponse.success) {
        throw new Error('Failed to start assessment phase')
      }

      const assessmentId = startResponse.data?.assessment?.id
      if (!assessmentId) {
        throw new Error('Assessment ID not found')
      }

      // Save responses if provided
      if (data.responses) {
        for (const [section, sectionResponses] of Object.entries(data.responses)) {
          for (const [questionId, response] of Object.entries(sectionResponses)) {
            await apiCall(`/assessment/${assessmentId}/response`, {
              method: 'POST',
              body: JSON.stringify({
                section_id: section,
                question_id: questionId,
                question_text: data.questionTexts?.[section]?.[questionId],
                response_type: typeof response === 'object' ? 'complex' : 'simple',
                response_value: response
              })
            })
          }
        }
      }

      // Update progress and completion status
      await apiCall(`/assessment/${assessmentId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({
          progress_percentage: data.progress || 0,
          is_completed: data.completed || false,
          assessment_data: data
        })
      })

      return { success: true, assessmentId }
    } catch (err) {
      setError(err.message)
      console.error('Assessment save error:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Load assessment data from backend
  const loadAssessmentData = async () => {
    if (!isAuthenticated) {
      const localData = localStorage.getItem('changepreneurship-assessment')
      return localData ? JSON.parse(localData) : null
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiCall('/assessment/phases')
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.error || 'Failed to load assessment data')
      }
    } catch (err) {
      setError(err.message)
      console.error('Assessment load error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Save entrepreneur profile
  const saveProfile = async (profileData) => {
    if (!isAuthenticated) {
      const existingData = JSON.parse(localStorage.getItem('changepreneurship-assessment') || '{}')
      const updatedData = {
        ...existingData,
        userProfile: {
          ...existingData.userProfile,
          ...profileData
        }
      }
      localStorage.setItem('changepreneurship-assessment', JSON.stringify(updatedData))
      return { success: true }
    }

    try {
      setLoading(true)
      setError(null)

      const response = await apiCall('/assessment/profile/update', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      })

      if (response.success) {
        return { success: true }
      } else {
        throw new Error(response.error || 'Failed to save profile')
      }
    } catch (err) {
      setError(err.message)
      console.error('Profile save error:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Get assessment responses for a specific phase
  const getAssessmentResponses = async (phaseId) => {
    if (!isAuthenticated) {
      const localData = JSON.parse(localStorage.getItem('changepreneurship-assessment') || '{}')
      return localData.assessmentData?.[phaseId]?.responses || {}
    }

    try {
      setLoading(true)
      setError(null)

      // First get the assessment ID for this phase
      const phasesResponse = await apiCall('/assessment/phases')
      if (!phasesResponse.success) {
        throw new Error(phasesResponse.error || 'Failed to get assessment phases')
      }

      const phasesData = phasesResponse.data
      const assessment = phasesData.assessments.find(a => a.phase_id === phaseId)
      
      if (!assessment) {
        return {}
      }

      const responsesResponse = await apiCall(`/assessment/${assessment.id}/responses`)
      if (responsesResponse.success) {
        return responsesResponse.data.responses || {}
      } else {
        throw new Error(responsesResponse.error || 'Failed to get assessment responses')
      }
    } catch (err) {
      setError(err.message)
      console.error('Get responses error:', err)
      return {}
    } finally {
      setLoading(false)
    }
  }

  // Debounced auto-save function
  const debouncedSave = (() => {
    let timeoutId
    return (phaseId, data, delay = 2000) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        saveAssessmentData(phaseId, data)
      }, delay)
    }
  })()

  return {
    loading,
    error,
    saveAssessmentData,
    loadAssessmentData,
    saveProfile,
    getAssessmentResponses,
    debouncedSave
  }
}

