"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface FiltersCardProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  selectedType: "hiragana" | "katakana" | "all"
  onTypeChange: (value: "hiragana" | "katakana" | "all") => void
  selectedCategory: string
  onCategoryChange: (value: string) => void
  categories: string[]
  filteredCount: number
}

const getCategoryDisplayName = (category: string): string => {
  switch (category) {
    case "basic":
      return "Basic (vowels, n sound)"
    case "dakuten":
      return "Dakuten (g, z, d, b sounds)"
    case "handakuten":
      return "Handakuten (p sounds)"
    case "combination":
      return "Combination (kya, gya, etc.)"
    default:
      return category
  }
}

export function FiltersCard({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  categories,
  filteredCount,
}: FiltersCardProps) {
  return (
    <Card className="my-3">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Search + Filters */}
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search kana..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Select */}
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hiragana">Hiragana</SelectItem>
                <SelectItem value="katakana">Katakana</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Select */}
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {getCategoryDisplayName(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right: Count */}
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredCount} characters
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
