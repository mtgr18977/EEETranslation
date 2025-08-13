"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { HelpCircle } from "lucide-react"

export default function AlignmentLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <HelpCircle className="h-4 w-4 mr-1" />
          Alignment Legend
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-medium">Alignment Color Guide</h4>
          <p className="text-sm text-muted-foreground">
            The alignment view highlights matching elements between source and target text:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-block bg-blue-100 rounded"></span>
              <span>Numbers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-block bg-yellow-100 rounded"></span>
              <span>Proper Nouns</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-block bg-green-100 rounded"></span>
              <span>URLs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-block bg-teal-100 rounded"></span>
              <span>Email Addresses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-block bg-orange-100 rounded"></span>
              <span>Dates</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 inline-block bg-purple-100 rounded"></span>
              <span>Tags</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Hover over any highlighted element to see its matching counterpart in the other text.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}
