import { atoms as a } from '#/theme'
import { Star, View } from 'lucide-react-native'

export function StarRating({ rating = 1 }: { rating: number }) {
  if (rating > 5) return
  const limit = Math.floor(rating)
  return (
    <View style={[a.flex_row]}>
      {Array.from({ length: limit }).map((_, index) => {
        return <Star key={index} size={12} color="#FF8700" fill="#FF8700" />
      })}
    </View>
  )
}
