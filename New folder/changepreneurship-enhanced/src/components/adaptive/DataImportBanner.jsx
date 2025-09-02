import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Linkedin, 
  DollarSign, 
  FileText, 
  MessageSquare,
  Mail,
  Calendar,
  X
} from 'lucide-react'

const DataImportBanner = ({ onDismiss, onOptimize }) => {
  const [connectedSources, setConnectedSources] = useState([])
  const [showDetails, setShowDetails] = useState(false)

  const dataSources = [
    {
      id: 'linkedin',
      name: 'LinkedIn Profile',
      icon: Linkedin,
      description: 'Work history, skills, education',
      timeSaved: 15,
      coverage: 85,
      status: 'available'
    },
    {
      id: 'financial',
      name: 'Financial Data',
      icon: DollarSign,
      description: 'Income, expenses, savings',
      timeSaved: 10,
      coverage: 60,
      status: 'available'
    },
    {
      id: 'resume',
      name: 'Resume/CV',
      icon: FileText,
      description: 'Professional experience',
      timeSaved: 12,
      coverage: 70,
      status: 'available'
    },
    {
      id: 'social',
      name: 'Social Media',
      icon: MessageSquare,
      description: 'Interests, personality insights',
      timeSaved: 8,
      coverage: 45,
      status: 'available'
    },
    {
      id: 'email',
      name: 'Email Analysis',
      icon: Mail,
      description: 'Communication patterns',
      timeSaved: 6,
      coverage: 35,
      status: 'available'
    },
    {
      id: 'calendar',
      name: 'Calendar Data',
      icon: Calendar,
      description: 'Time management patterns',
      timeSaved: 4,
      coverage: 25,
      status: 'available'
    }
  ]

  const handleConnect = (sourceId) => {
    if (!connectedSources.includes(sourceId)) {
      setConnectedSources([...connectedSources, sourceId])
    }
  }

  const calculateOptimization = () => {
    const totalTimeSaved = connectedSources.reduce((total, sourceId) => {
      const source = dataSources.find(s => s.id === sourceId)
      return total + (source?.timeSaved || 0)
    }, 0)
    
    const averageCoverage = connectedSources.length > 0 
      ? connectedSources.reduce((total, sourceId) => {
          const source = dataSources.find(s => s.id === sourceId)
          return total + (source?.coverage || 0)
        }, 0) / connectedSources.length
      : 0

    return { totalTimeSaved, averageCoverage: Math.round(averageCoverage) }
  }

  const { totalTimeSaved, averageCoverage } = calculateOptimization()
  const estimatedTime = Math.max(15, 60 - totalTimeSaved) // Minimum 15 minutes

  return (
    <Card className="border-2 border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Speed Up Your Assessment</CardTitle>
              <CardDescription>
                Connect your data sources to pre-populate answers and save time
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{estimatedTime}min</div>
            <div className="text-sm text-muted-foreground">Estimated Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalTimeSaved}min</div>
            <div className="text-sm text-muted-foreground">Time Saved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{averageCoverage}%</div>
            <div className="text-sm text-muted-foreground">Pre-populated</div>
          </div>
        </div>

        {/* Quick Connect Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Quick Connect</h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show All Sources'}
            </Button>
          </div>
          
          {showDetails ? (
            <div className="grid grid-cols-2 gap-3">
              {dataSources.map((source) => {
                const IconComponent = source.icon
                const isConnected = connectedSources.includes(source.id)
                
                return (
                  <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{source.name}</div>
                        <div className="text-xs text-muted-foreground">{source.timeSaved}min saved</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={isConnected ? "secondary" : "outline"}
                      onClick={() => handleConnect(source.id)}
                      disabled={isConnected}
                    >
                      {isConnected ? <CheckCircle className="h-3 w-3" /> : 'Connect'}
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {dataSources.slice(0, 3).map((source) => {
                const IconComponent = source.icon
                const isConnected = connectedSources.includes(source.id)
                
                return (
                  <Button
                    key={source.id}
                    variant={isConnected ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleConnect(source.id)}
                    disabled={isConnected}
                    className="flex items-center gap-2"
                  >
                    <IconComponent className="h-3 w-3" />
                    {source.name}
                    {isConnected && <CheckCircle className="h-3 w-3" />}
                  </Button>
                )
              })}
            </div>
          )}
        </div>

        {/* Optimization Progress */}
        {connectedSources.length > 0 && (
          <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Optimization Active
                </span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {connectedSources.length} source{connectedSources.length !== 1 ? 's' : ''} connected
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Assessment Optimization</span>
                <span>{Math.round((totalTimeSaved / 45) * 100)}%</span>
              </div>
              <Progress value={(totalTimeSaved / 45) * 100} className="h-2" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={() => onOptimize && onOptimize(connectedSources)}
            className="flex-1"
            disabled={connectedSources.length === 0}
          >
            <Clock className="h-4 w-4 mr-2" />
            Start Optimized Assessment
          </Button>
          <Button variant="outline" onClick={onDismiss}>
            Continue Without Optimization
          </Button>
        </div>

        {/* Benefits Preview */}
        <div className="text-xs text-muted-foreground text-center">
          💡 Users typically save 40-75% of assessment time with data import
        </div>
      </CardContent>
    </Card>
  )
}

export default DataImportBanner

