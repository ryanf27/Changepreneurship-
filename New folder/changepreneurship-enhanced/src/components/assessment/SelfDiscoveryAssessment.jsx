import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import DragDropRanking from '@/components/ui/drag-drop-ranking.jsx'
import AutoSaveManager, { useAutoSave } from '../AutoSaveManager'
import { 
  Heart, 
  Target, 
  Star, 
  Compass, 
  Brain, 
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react'
import { useAssessment, ENTREPRENEUR_ARCHETYPES } from '../../contexts/AssessmentContext'
import DataImportBanner from '../adaptive/DataImportBanner'
import { SELF_DISCOVERY_QUESTIONS } from './ComprehensiveQuestionBank'

const SelfDiscoveryAssessment = () => {
  const { 
    assessmentData, 
    updateResponse, 
    updateProgress, 
    completePhase, 
    calculateArchetype 
  } = useAssessment()
  
  const [currentSection, setCurrentSection] = useState('motivation')
  const [sectionProgress, setSectionProgress] = useState({})
  const [showDataImport, setShowDataImport] = useState(true)
  const [isOptimized, setIsOptimized] = useState(false)
  const [connectedSources, setConnectedSources] = useState([])
  const [errors, setErrors] = useState({})
  
  const selfDiscoveryData = assessmentData['self-discovery'] || {}
  const responses = selfDiscoveryData.responses || {}

  // Auto-save functionality
  const { save, saveStatus, AutoSaveComponent } = useAutoSave(
    assessmentData,
    async (data) => {
      // Custom save function - could be API call
      console.log('Saving assessment data:', data)
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    },
    { saveInterval: 30000 } // Save every 30 seconds
  )

  // Memoize question data from comprehensive question bank
  const motivationQuestions = useMemo(() => SELF_DISCOVERY_QUESTIONS.motivation, [])
  const lifeImpactQuestions = useMemo(() => SELF_DISCOVERY_QUESTIONS['life-impact'], [])
  const valuesQuestions = useMemo(() => SELF_DISCOVERY_QUESTIONS.values, [])
  const visionQuestions = useMemo(() => SELF_DISCOVERY_QUESTIONS.vision, [])
  const confidenceQuestions = useMemo(() => SELF_DISCOVERY_QUESTIONS.confidence, [])

  // Memoize sections configuration to prevent re-creation
  const sections = useMemo(() => [
    {
      id: 'motivation',
      title: 'Core Motivation & Why',
      description: 'Understand your fundamental drive for entrepreneurship',
      icon: Heart,
      duration: '10-15 minutes',
      questions: motivationQuestions
    },
    {
      id: 'life-impact',
      title: 'Life Impact Assessment',
      description: 'How entrepreneurship fits into your life priorities',
      icon: Target,
      duration: '15-20 minutes',
      questions: lifeImpactQuestions
    },
    {
      id: 'values',
      title: 'Values & Priorities',
      description: 'Identify core values to guide business decisions',
      icon: Star,
      duration: '10-15 minutes',
      questions: valuesQuestions
    },
    {
      id: 'vision',
      title: 'Future Vision',
      description: 'Define your long-term vision and goals',
      icon: Compass,
      duration: '15-20 minutes',
      questions: visionQuestions
    },
    {
      id: 'confidence',
      title: 'Belief & Confidence',
      description: 'Assess your confidence in achieving your vision',
      icon: Brain,
      duration: '10-15 minutes',
      questions: confidenceQuestions
    },
    {
      id: 'results',
      title: 'Your Entrepreneur Archetype',
      description: 'Discover your unique entrepreneur profile',
      icon: TrendingUp,
      duration: '5 minutes',
      questions: []
    }
  ], [motivationQuestions, lifeImpactQuestions, valuesQuestions, visionQuestions, confidenceQuestions])

  const currentSectionIndex = sections.findIndex(s => s.id === currentSection)
  const currentSectionData = sections[currentSectionIndex]

  // Memoize response handler with error handling and validation
  const handleResponse = useCallback((questionId, answer) => {
    try {
      // Clear any existing errors for this question
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })

      // Validate the answer
      const currentSectionData = sections[currentSectionIndex]
      const question = currentSectionData?.questions?.find(q => q.id === questionId)
      
      if (question?.required && (!answer || answer === '' || (Array.isArray(answer) && answer.length === 0))) {
        setErrors(prev => ({
          ...prev,
          [questionId]: 'This question is required'
        }))
        return
      }

      updateResponse('self-discovery', currentSection, questionId, answer)
      
      // Update section progress
      const sectionQuestions = currentSectionData?.questions || []
      const sectionResponses = responses[currentSection] || {}
      const answeredQuestions = Object.keys({ ...sectionResponses, [questionId]: answer }).length
      const progress = sectionQuestions.length > 0 ? (answeredQuestions / sectionQuestions.length) * 100 : 0
      
      setSectionProgress(prev => ({
        ...prev,
        [currentSection]: progress
      }))

      // Trigger auto-save
      save(assessmentData)
    } catch (error) {
      console.error('Error handling response:', error)
      setErrors(prev => ({
        ...prev,
        [questionId]: 'Failed to save response. Please try again.'
      }))
    }
  }, [updateResponse, currentSection, currentSectionIndex, responses, sections, save, assessmentData])

  // Memoize optimization handler
  const handleOptimization = useCallback((sources) => {
    setConnectedSources(sources)
    setIsOptimized(true)
    setShowDataImport(false)
    
    // Simulate pre-population based on connected sources
    if (sources.includes('linkedin')) {
      updateResponse('self-discovery', 'motivation', 'primary-motivation', 'solve-problems')
    }
    if (sources.includes('financial')) {
      updateResponse('self-discovery', 'confidence', 'vision-confidence', 7)
    }
  }, [updateResponse])

  // Navigation functions
  const nextSection = useCallback(() => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSection(sections[currentSectionIndex + 1].id)
    }
  }, [currentSectionIndex, sections])

  const previousSection = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSection(sections[currentSectionIndex - 1].id)
    }
  }, [currentSectionIndex, sections])

  // Calculate overall progress with proper memoization
  const overallProgress = useMemo(() => {
    const totalSections = sections.length - 1 // Exclude results section
    const completedSections = Object.values(sectionProgress).filter(p => p === 100).length
    return Math.round((completedSections / totalSections) * 100)
  }, [sectionProgress, sections.length])

  return (
    <div className="space-y-6">
      {/* Data Import Banner */}
      {showDataImport && (
        <DataImportBanner 
          onDismiss={() => setShowDataImport(false)}
          onOptimize={handleOptimization}
        />
      )}

      {/* Optimization Status */}
      {isOptimized && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800 dark:text-green-200">
                  Assessment Optimized
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {connectedSources.length} data source{connectedSources.length !== 1 ? 's' : ''} connected • 
                  Some answers pre-populated
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Self Discovery Assessment
              </CardTitle>
              <CardDescription>
                Understand your entrepreneurial personality and motivations
              </CardDescription>
            </div>
            <AutoSaveComponent />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Section Navigation */}
            <Tabs value={currentSection} onValueChange={setCurrentSection}>
              <TabsList className="grid grid-cols-6 w-full">
                {sections.map((section) => {
                  const IconComponent = section.icon
                  const isCompleted = sectionProgress[section.id] === 100
                  return (
                    <TabsTrigger 
                      key={section.id} 
                      value={section.id}
                      className="flex flex-col items-center gap-1 p-2"
                    >
                      <IconComponent className={`h-4 w-4 ${isCompleted ? 'text-green-500' : ''}`} />
                      <span className="text-xs">{section.title.split(' ')[0]}</span>
                      {isCompleted && <CheckCircle className="h-3 w-3 text-green-500" />}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
            
            {/* Overall Progress */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <Badge variant="outline">{overallProgress}%</Badge>
              </div>
              <Progress value={overallProgress} className="flex-1 mx-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentSectionData && <currentSectionData.icon className="h-5 w-5" />}
            {currentSectionData?.title}
          </CardTitle>
          <CardDescription>
            {currentSectionData?.description}
          </CardDescription>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{currentSectionData?.duration}</Badge>
            <span className="text-sm text-muted-foreground">
              Section {currentSectionIndex + 1} of {sections.length}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {currentSection === 'results' ? (
            <ArchetypeResults archetype={selfDiscoveryData.archetype} insights={selfDiscoveryData.insights} />
          ) : (
            <SectionQuestions 
              section={currentSectionData}
              responses={responses[currentSection] || {}}
              onResponse={handleResponse}
              errors={errors}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={previousSection}
          disabled={currentSectionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button 
          onClick={nextSection}
          disabled={currentSectionIndex === sections.length - 1}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Section Questions Component
const SectionQuestions = React.memo(({ section, responses, onResponse, errors = {} }) => {
  if (!section?.questions || section.questions.length === 0) {
    return <div className="text-center text-muted-foreground">No questions available for this section.</div>
  }

  return (
    <div className="space-y-8">
      {section.questions.map((question, index) => (
        <QuestionCard 
          key={question.id}
          question={question}
          response={responses[question.id]}
          onResponse={(answer) => onResponse(question.id, answer)}
          questionNumber={index + 1}
          totalQuestions={section.questions.length}
          error={errors[question.id]}
        />
      ))}
    </div>
  )
})

// Individual Question Card Component
const QuestionCard = React.memo(({ question, response, onResponse, questionNumber, totalQuestions, error }) => {
  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup value={response || ''} onValueChange={onResponse}>
            {question.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'scale':
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{question.scaleLabels?.min || 'Low'}</span>
              <span>{question.scaleLabels?.max || 'High'}</span>
            </div>
            <Slider
              value={[response || question.scaleRange?.min || 1]}
              onValueChange={(value) => onResponse(value[0])}
              min={question.scaleRange?.min || 1}
              max={question.scaleRange?.max || 10}
              step={1}
              className="w-full"
            />
            <div className="text-center text-sm font-medium">
              Current value: {response || question.scaleRange?.min || 1}
            </div>
          </div>
        )

      case 'textarea':
        return (
          <Textarea
            value={response || ''}
            onChange={(e) => onResponse(e.target.value)}
            placeholder={question.placeholder || 'Enter your response...'}
            rows={4}
            className={`w-full ${error ? 'border-destructive' : ''}`}
          />
        )

      case 'multiple-scale':
        return (
          <MultipleScaleInput 
            areas={question.areas}
            scaleRange={question.scaleRange}
            value={response || {}}
            onChange={onResponse}
          />
        )

      case 'ranking':
        return (
          <DragDropRanking 
            options={question.options}
            value={response || []}
            onChange={onResponse}
            maxRankings={question.maxRankings}
          />
        )

      default:
        return <div className="text-muted-foreground">Unsupported question type: {question.type}</div>
    }
  }

  return (
    <Card className={`border-l-4 ${error ? 'border-l-destructive' : 'border-l-primary'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">Question {questionNumber} of {totalQuestions}</Badge>
              {question.required && <Badge variant="destructive">Required</Badge>}
            </div>
            <CardTitle className="text-lg">{question.question}</CardTitle>
            {question.description && (
              <CardDescription className="mt-2">{question.description}</CardDescription>
            )}
            {error && (
              <div className="mt-2 flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
          {response && !error && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
        </div>
      </CardHeader>
      <CardContent>
        {renderQuestionInput()}
        {question.helpText && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{question.helpText}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

// Multiple Scale Input Component
const MultipleScaleInput = React.memo(({ areas, scaleRange, value, onChange }) => {
  const handleScaleChange = useCallback((area, scaleValue) => {
    const newValue = { ...value, [area]: scaleValue }
    onChange(newValue)
  }, [value, onChange])

  return (
    <div className="space-y-6">
      {areas.map((area) => (
        <div key={area} className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="font-medium">{area}</Label>
            <span className="text-sm text-muted-foreground">
              {value[area] || scaleRange.min}/{scaleRange.max}
            </span>
          </div>
          <Slider
            value={[value[area] || scaleRange.min]}
            onValueChange={(newValue) => handleScaleChange(area, newValue[0])}
            min={scaleRange.min}
            max={scaleRange.max}
            step={1}
            className="w-full"
          />
        </div>
      ))}
    </div>
  )
})

// Archetype Results Component
const ArchetypeResults = React.memo(({ archetype, insights }) => {
  if (!archetype || !insights) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Complete Assessment to See Results</h3>
        <p className="text-muted-foreground">
          Finish all sections to discover your entrepreneur archetype and get personalized insights.
        </p>
      </div>
    )
  }

  const archetypeData = ENTREPRENEUR_ARCHETYPES[archetype]

  return (
    <div className="space-y-6">
      {/* Main Archetype Card */}
      <Card className="border-2 border-primary">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{archetypeData?.name || 'Unknown Archetype'}</CardTitle>
          <CardDescription className="text-lg italic">
            "{archetypeData?.description || 'No description available'}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Key Traits</h4>
              <ul className="space-y-2">
                {(archetypeData?.traits || []).map((trait, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{trait}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Business Focus</h4>
              <p className="text-sm text-muted-foreground mb-4">{archetypeData?.businessFocus || 'No focus defined'}</p>
              <h4 className="font-semibold mb-3">Time Horizon</h4>
              <p className="text-sm text-muted-foreground">{archetypeData?.timeHorizon || 'No time horizon defined'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

export default SelfDiscoveryAssessment

