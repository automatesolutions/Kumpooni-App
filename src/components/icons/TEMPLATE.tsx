import React from 'react'
import { Path, Svg } from 'react-native-svg'

import { useCommonSVGProps, Props } from '#/components/icons/common'
export function createSinglePathSVG({ path }: { path: string }) {
  return React.forwardRef<Svg, Props>(function LogoImpl(props, ref) {
    const { fill, size, style, ...rest } = useCommonSVGProps(props)

    return (
      <Svg
        fill="none"
        {...rest}
        ref={ref}
        viewBox="0 0 24 24"
        width={size}
        height={size}
        style={[style]}>
        <Path fill={fill} fillRule="evenodd" clipRule="evenodd" d={path} />
      </Svg>
    )
  })
}
