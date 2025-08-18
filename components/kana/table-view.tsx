import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { KanaCharacter } from "@/types/kana"

interface TableViewProps {
  filteredKana: KanaCharacter[]
}

export function TableView({ filteredKana }: TableViewProps) {
  const getKanaByTypeAndCategory = () => {
    const hiragana = filteredKana.filter((k) => k.type === "hiragana")
    const katakana = filteredKana.filter((k) => k.type === "katakana")

    const groupByCategory = (kanaList: KanaCharacter[]) => {
      return kanaList.reduce(
        (acc, kana) => {
          if (!acc[kana.category]) {
            acc[kana.category] = []
          }
          acc[kana.category].push(kana)
          return acc
        },
        {} as Record<string, KanaCharacter[]>,
      )
    }

    return {
      hiragana: groupByCategory(hiragana),
      katakana: groupByCategory(katakana),
    }
  }

  const { hiragana, katakana } = getKanaByTypeAndCategory()

  const renderCategoryGrid = (categorizedKana: Record<string, KanaCharacter[]>, type: string) => {
    const categories = Object.keys(categorizedKana)
    if (categories.length === 0) return null

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-primary capitalize">{type}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card key={`${type}-${category}`} className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-primary capitalize">
                  {category} ({categorizedKana[category].length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Character</th>
                        <th className="text-left p-2 text-sm font-medium text-muted-foreground">Romanji</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorizedKana[category].map((kana) => (
                        <tr key={kana.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-2">
                            <span className="text-xl font-bold text-primary">{kana.character}</span>
                          </td>
                          <td className="p-2">
                            <span className="text-sm font-medium">{kana.romanji}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {renderCategoryGrid(hiragana, "hiragana")}
      {renderCategoryGrid(katakana, "katakana")}
      {Object.keys(hiragana).length === 0 && Object.keys(katakana).length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No characters match your current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
