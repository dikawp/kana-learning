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
    <Card className="mt-3">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search kana..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="hiragana">Hiragana</SelectItem>
              <SelectItem value="katakana">Katakana</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
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
          <div className="text-sm text-muted-foreground flex items-center">{filteredCount} characters</div>
        </div>
      </CardContent>
    </Card>
  )
}
