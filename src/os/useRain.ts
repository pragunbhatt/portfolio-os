import { useEffect, useState } from 'react';
import { onRainChange, rainEnabled } from './rainSound';

export function useRainOn() {
  const [on, setOn] = useState(rainEnabled);
  useEffect(() => onRainChange(setOn), []);
  return on;
}
