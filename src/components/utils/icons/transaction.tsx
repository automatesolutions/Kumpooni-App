import React from 'react';
import Svg, {Path} from 'react-native-svg';
const SvgTransaction = (props: {focused: boolean; color: string}) => (
  <Svg width={24} height={24} viewBox="0 0 27 27" fill="none">
    <Path
      d="M23.1875 1.875H3.8125C3.29864 1.875 2.80583 2.07913 2.44248 2.44248C2.07913 2.80583 1.875 3.29864 1.875 3.8125V23.1875C1.875 23.7014 2.07913 24.1942 2.44248 24.5575C2.80583 24.9209 3.29864 25.125 3.8125 25.125H23.1875C23.7014 25.125 24.1942 24.9209 24.5575 24.5575C24.9209 24.1942 25.125 23.7014 25.125 23.1875V3.8125C25.125 3.29864 24.9209 2.80583 24.5575 2.44248C24.1942 2.07913 23.7014 1.875 23.1875 1.875Z"
      stroke={props.color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.5626 18.0208L14.7917 20.6042L19.9584 14.1458M7.04175 7.6875H19.9584M7.04175 12.8542H12.2084"
      stroke={props.color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default SvgTransaction;
