'use client'

import React from "react"
import { Bell, Sparkles } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Card } from "@/components/ui/card"
import { NotificationItem } from "@/lib/data-store"

interface NotificationsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notifications: NotificationItem[]
  userRole: 'student' | 'teacher'
}

export function NotificationsDrawer({
  open,
  onOpenChange,
  notifications
}: NotificationsDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:w-96 bg-[#FFF9F1] border-l border-[#E5DCD0] p-6 text-[#292724]">
        <SheetHeader className="pb-4 border-b border-[#E5DCD0]">
          <SheetTitle className="text-left font-serif font-bold text-[#292724] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#E76F51]" /> Notifications & Activity Stream
          </SheetTitle>
          <SheetDescription className="text-xs text-[#77716A]">
            Real-time updates on assignments, live session spikes, and doubt bounties.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 pt-4">
          {notifications.map((item) => (
            <Card key={item.id} className="bg-white border border-[#E5DCD0] shadow-2xs rounded-xl p-3.5 space-y-1 hover:border-[#E76F51]/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-[#292724]">{item.title}</span>
                <span className="text-[10px] text-[#77716A]">{item.timestamp}</span>
              </div>
              <p className="text-xs text-[#77716A] font-semibold">{item.message}</p>
            </Card>
          ))}

          <div className="p-3 bg-[#FFF9F1] border border-[#E5DCD0] rounded-xl text-center space-y-1 mt-6">
            <p className="text-[11px] font-bold text-[#77716A] flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#E9B949]" /> Synchronized with Central Event Bus
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
