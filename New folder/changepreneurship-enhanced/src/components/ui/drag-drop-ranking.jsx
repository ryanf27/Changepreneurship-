import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  GripVertical, 
  ArrowUp, 
  ArrowDown,
  CheckCircle
} from 'lucide-react'

const DragDropRanking = ({ options, value = [], onChange, maxRankings = null }) => {
  const [rankings, setRankings] = useState([])
  const [unrankedItems, setUnrankedItems] = useState([])
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  // Initialize rankings and unranked items
  useEffect(() => {
    if (value && value.length > 0) {
      // Convert from existing format if needed
      const existingRankings = value.map(item => ({
        ...item,
        id: item.value || item.id,
        label: item.label || options.find(opt => opt.value === item.value)?.label
      })).sort((a, b) => a.rank - b.rank)
      
      setRankings(existingRankings)
      
      const rankedIds = existingRankings.map(item => item.id)
      const unranked = options.filter(option => !rankedIds.includes(option.value))
      setUnrankedItems(unranked)
    } else {
      setRankings([])
      setUnrankedItems(options)
    }
  }, [options, value])

  // Update parent component when rankings change
  useEffect(() => {
    const formattedRankings = rankings.map((item, index) => ({
      value: item.id,
      label: item.label,
      rank: index + 1
    }))
    onChange(formattedRankings)
  }, [rankings, onChange])

  const handleDragStart = (e, item, source) => {
    setDraggedItem({ ...item, source })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, targetIndex) => {
    e.preventDefault()
    setDragOverIndex(null)
    
    if (!draggedItem) return

    if (draggedItem.source === 'unranked') {
      // Moving from unranked to ranked
      const newItem = {
        id: draggedItem.value,
        label: draggedItem.label,
        rank: targetIndex + 1
      }
      
      const newRankings = [...rankings]
      newRankings.splice(targetIndex, 0, newItem)
      
      // Update ranks
      newRankings.forEach((item, index) => {
        item.rank = index + 1
      })
      
      setRankings(newRankings)
      setUnrankedItems(unrankedItems.filter(item => item.value !== draggedItem.value))
    } else {
      // Reordering within ranked items
      const newRankings = [...rankings]
      const draggedIndex = newRankings.findIndex(item => item.id === draggedItem.id)
      
      if (draggedIndex !== -1) {
        const [removed] = newRankings.splice(draggedIndex, 1)
        newRankings.splice(targetIndex, 0, removed)
        
        // Update ranks
        newRankings.forEach((item, index) => {
          item.rank = index + 1
        })
        
        setRankings(newRankings)
      }
    }
    
    setDraggedItem(null)
  }

  const handleDropToUnranked = (e) => {
    e.preventDefault()
    setDragOverIndex(null)
    
    if (!draggedItem || draggedItem.source === 'unranked') return

    // Moving from ranked back to unranked
    const itemToRemove = rankings.find(item => item.id === draggedItem.id)
    if (itemToRemove) {
      const originalOption = options.find(opt => opt.value === itemToRemove.id)
      if (originalOption) {
        setUnrankedItems([...unrankedItems, originalOption])
        setRankings(rankings.filter(item => item.id !== draggedItem.id).map((item, index) => ({
          ...item,
          rank: index + 1
        })))
      }
    }
    
    setDraggedItem(null)
  }

  const moveItem = (fromIndex, direction) => {
    const newRankings = [...rankings]
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    
    if (toIndex < 0 || toIndex >= newRankings.length) return
    
    const [moved] = newRankings.splice(fromIndex, 1)
    newRankings.splice(toIndex, 0, moved)
    
    // Update ranks
    newRankings.forEach((item, index) => {
      item.rank = index + 1
    })
    
    setRankings(newRankings)
  }

  const addToRanking = (option) => {
    if (maxRankings && rankings.length >= maxRankings) return
    
    const newItem = {
      id: option.value,
      label: option.label,
      rank: rankings.length + 1
    }
    
    setRankings([...rankings, newItem])
    setUnrankedItems(unrankedItems.filter(item => item.value !== option.value))
  }

  const removeFromRanking = (itemId) => {
    const itemToRemove = rankings.find(item => item.id === itemId)
    if (itemToRemove) {
      const originalOption = options.find(opt => opt.value === itemToRemove.id)
      if (originalOption) {
        setUnrankedItems([...unrankedItems, originalOption])
        setRankings(rankings.filter(item => item.id !== itemId).map((item, index) => ({
          ...item,
          rank: index + 1
        })))
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <div className="font-medium mb-1">How to rank:</div>
        <ul className="space-y-1">
          <li>• Drag items from the list below to rank them in order of importance</li>
          <li>• Use the arrow buttons or drag to reorder ranked items</li>
          <li>• Drag items back to remove them from your ranking</li>
          {maxRankings && <li>• You can rank up to {maxRankings} items</li>}
        </ul>
      </div>

      {/* Ranked Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Your Ranking</h4>
          <Badge variant="outline">
            {rankings.length}{maxRankings ? `/${maxRankings}` : ''} ranked
          </Badge>
        </div>
        
        {rankings.length === 0 ? (
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center text-muted-foreground"
            onDragOver={(e) => handleDragOver(e, 0)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 0)}
          >
            Drag items here to start ranking
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((item, index) => (
              <div key={item.id}>
                {/* Drop zone above each item */}
                <div
                  className={`h-2 transition-all ${
                    dragOverIndex === index ? 'bg-primary/20 rounded' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                />
                
                <Card 
                  className={`cursor-move transition-all ${
                    draggedItem?.id === item.id ? 'opacity-50 scale-95' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item, 'ranked')}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 font-medium">
                        {item.label}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === rankings.length - 1}
                          className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeFromRanking(item.id)}
                          className="p-1 hover:bg-destructive/10 hover:text-destructive rounded ml-1"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Drop zone after last item */}
                {index === rankings.length - 1 && (
                  <div
                    className={`h-2 transition-all ${
                      dragOverIndex === index + 1 ? 'bg-primary/20 rounded' : ''
                    }`}
                    onDragOver={(e) => handleDragOver(e, index + 1)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index + 1)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Items */}
      {unrankedItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Available Options</h4>
          <div 
            className="grid grid-cols-1 gap-2"
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={handleDropToUnranked}
          >
            {unrankedItems.map((option) => (
              <Card 
                key={option.value}
                className="cursor-move hover:bg-muted/50 transition-colors"
                draggable
                onDragStart={(e) => handleDragStart(e, option, 'unranked')}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <button
                      onClick={() => addToRanking(option)}
                      disabled={maxRankings && rankings.length >= maxRankings}
                      className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add to ranking
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completion Status */}
      {rankings.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>
            {rankings.length} item{rankings.length !== 1 ? 's' : ''} ranked
            {maxRankings && rankings.length >= maxRankings && ' (maximum reached)'}
          </span>
        </div>
      )}
    </div>
  )
}

export default DragDropRanking

