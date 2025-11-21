import React from 'react';
import { Sun, Moon, Cloud, Zap } from "lucide-react";

export default function DashboardHeader({ name = 'Driver', onAutoSwap }) {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
  const GreetingIcon = currentHour < 12 ? Sun : currentHour < 18 ? Cloud : Moon;

  return (
    <div className="bg-blue-800 rounded-lg p-4 text-white mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GreetingIcon className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">{greeting}, {name}</h1>
            <p className="text-blue-100 text-sm">Ready for your next journey?</p>
          </div>
        </div>

        {/* Auto Swap Button */}
        {onAutoSwap && (
          <button
            onClick={onAutoSwap}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors"
          >
            <Zap className="w-5 h-5" />
            Auto Swap
          </button>
        )}
      </div>
    </div>
  );
}
