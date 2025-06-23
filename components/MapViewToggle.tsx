"use client"

import React from 'react'
import { Globe, Map } from 'lucide-react'

interface MapViewToggleProps {
  isGlobeView: boolean
  onToggle: (isGlobeView: boolean) => void
  className?: string
}

export default function MapViewToggle({ isGlobeView, onToggle, className = "" }: MapViewToggleProps) {
  return (
    <div className={`fixed top-20 right-4 z-40 ${className}`}>
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center p-2">
          {/* Flat Map Button */}
          <button
            onClick={() => onToggle(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              !isGlobeView
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Flat</span>
          </button>

          {/* Separator */}
          <div className="mx-2 w-px h-6 bg-white/20" />

          {/* Globe Button */}
          <button
            onClick={() => onToggle(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isGlobeView
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Globe</span>
          </button>
        </div>
      </div>
    </div>
  )
} 