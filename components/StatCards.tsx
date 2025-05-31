"use client"

import { Camera, Bell, PawPrint, Gauge, Scan } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { StatCard } from "../types"

const iconMap = {
  Camera,
  Activity: Scan,
  Bell,
  Zap: Gauge,
  MapPin: PawPrint,
}

const colorMap = {
  emerald: "bg-emerald-400/20 text-emerald-400",
  blue: "bg-blue-400/20 text-blue-400",
  red: "bg-red-400/20 text-red-400",
  purple: "bg-purple-400/20 text-purple-400",
  yellow: "bg-yellow-400/20 text-yellow-400",
}

interface StatCardsProps {
  stats: StatCard[]
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="pointer-events-auto px-3 pt-2">
      <div className="grid grid-cols-5 gap-2">
        {stats.map((stat, index) => {
          const Icon = iconMap[stat.icon as keyof typeof iconMap]
          const colorClass = colorMap[stat.color as keyof typeof colorMap]

          return (
            <Card
              key={index}
              className="bg-black/20 backdrop-blur-md border-white/10 text-white stat-card-animate"
              style={{
                animationDelay: `${index * 150}ms`,
                opacity: 0,
                transform: "translateY(20px)",
              }}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                    <p className={`text-xs ${stat.changeType === "positive" ? "text-emerald-400" : "text-red-400"}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stat-card-animate {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
