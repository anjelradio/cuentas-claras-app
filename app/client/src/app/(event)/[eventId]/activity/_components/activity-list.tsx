"use client"

import { useState, useEffect, useRef } from "react"
import { type ActivityLogEntry } from "../../../_types/activity-types"
import { ActivityItem } from "./activity-item"
import { listEventActivities } from "../../../_services/activity"

interface ActivityListProps {
  eventId: string
  initialActivities: ActivityLogEntry[]
  initialHasMore: boolean
}

export function ActivityList({ eventId, initialActivities, initialHasMore }: ActivityListProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>(initialActivities)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [offset, setOffset] = useState(initialActivities.length)
  
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 1.0 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, isLoading, offset])

  const loadMore = async () => {
    setIsLoading(true)
    try {
      const data = await listEventActivities(eventId, 20, offset)
      setActivities(prev => [...prev, ...data.items])
      setHasMore(data.has_more)
      setOffset(prev => prev + 20)
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">No hay actividad registrada en este evento aún.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col rounded-2xl border border-white/5 bg-surface shadow-xl">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
      
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  )
}
