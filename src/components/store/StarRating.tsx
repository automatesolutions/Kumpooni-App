import {atoms as a} from '#/theme';
import {Star, StarHalf} from 'lucide-react-native';
import {View} from 'react-native';

const STAR_COLOR = '#ff8700';
export function StarRating({rating = 1}: {rating: number}) {
  if (rating > 5) return;
  const limit = Math.floor(rating);
  let numberStr = rating.toFixed(1);
  const firstDecimal = parseInt(numberStr.split('.')[1].charAt(0));
  const isHalf = firstDecimal >= 1 && firstDecimal <= 4;
  return (
    <View style={[a.flex_row]}>
      {Array.from({length: 5}).map((_, index) => {
        if (limit >= index) {
          if (limit === index) {
            return isHalf ? (
              <StarHalf
                key={index}
                size={10}
                color={STAR_COLOR}
                fill={STAR_COLOR}
                stroke={STAR_COLOR}
              />
            ) : (
              <Star
                key={index}
                size={10}
                color={STAR_COLOR}
                fill={STAR_COLOR}
              />
            );
          }
          return (
            <Star key={index} size={10} color={STAR_COLOR} fill={STAR_COLOR} />
          );
        }
        return (
          <Star
            key={index}
            size={10}
            color={'transparent'}
            fill={'transparent'}
            stroke={STAR_COLOR}
          />
        );
      })}
    </View>
  );
}

function EmptyStar({index}: {index: number}) {
  return (
    <Star
      key={index}
      // color={'transparent'}
      fill={'red'}
      stroke={'red'}
    />
  );
}
