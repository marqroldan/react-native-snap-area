import React, { useEffect, useState } from 'react';
import { Dimensions, LayoutChangeEvent, View } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

type SnapPointItem = { x: number; y: number };
type WrapTypes = 'around' | 'edge';

type Props = {
  /**
   * Col x Row
   * [
   *  [1] ---> center
   * ]
   */
  snapPoints?: (1 | 0)[][];
  snapPointsExplicit?: SnapPointItem[];
  wrapType?: WrapTypes;
};

const defaultSnapPoints: SnapPointItem[] = [];
export function snapPointsGenerator(
  width: number,
  height: number,
  snapPoints: number[][],
  wrapType: WrapTypes = 'edge'
) {
  let finalSnapPoints = defaultSnapPoints;

  if (!snapPoints?.length) {
    return finalSnapPoints;
  }
  finalSnapPoints = [];

  let numberOfRows = (snapPoints?.length ?? 0) + 1;
  let finalRowWrapType: WrapTypes;
  if (wrapType === 'edge' && numberOfRows - 2 > 0) {
    finalRowWrapType = 'edge';
    numberOfRows = numberOfRows - 2;
  } else {
    finalRowWrapType = 'around';
  }

  const rowHeightPerSegment = height / numberOfRows;

  const columnWidthCache: { [key: string]: number } = {};

  let currHeightSegment = finalRowWrapType === 'edge' ? 0 : rowHeightPerSegment;
  for (let i = 0; i < snapPoints.length; i++) {
    const itemColumns = snapPoints[i];
    if (!itemColumns?.length) {
      currHeightSegment += rowHeightPerSegment;
      continue;
    }

    let numberOfColumns = (itemColumns?.length ?? 0) + 1;
    let finalColumnWrapType: WrapTypes;
    if (wrapType === 'edge' && numberOfColumns - 2 > 0) {
      finalColumnWrapType = 'edge';
      numberOfColumns = numberOfColumns - 2;
    } else {
      finalColumnWrapType = 'around';
    }

    if (!columnWidthCache[numberOfColumns]) {
      columnWidthCache[numberOfColumns] = width / numberOfColumns;
    }

    const currWidth = columnWidthCache[numberOfColumns] as number;
    let currWidthSegment = finalColumnWrapType === 'edge' ? 0 : currWidth;
    for (let j = 0; j < itemColumns.length; j++) {
      if (!itemColumns[j]) {
        currWidthSegment += currWidth;
        continue;
      }
      finalSnapPoints.push({
        x: currWidthSegment,
        y: currHeightSegment,
      } as SnapPointItem);
      currWidthSegment += currWidth;
    }

    currHeightSegment += rowHeightPerSegment;
  }

  return finalSnapPoints;
}

function SnapArea({ children }: React.PropsWithChildren<Props>) {
  const transX = useSharedValue(0);
  const transY = useSharedValue(0);

  const [childDimensions, setChildDimensions] = useState({
    width: 0,
    height: 0,
  });

  function onLayoutChild(evt: LayoutChangeEvent) {
    setChildDimensions({
      width: evt.nativeEvent.layout.width,
      height: evt.nativeEvent.layout.height,
    });
  }

  const [parentDimensions, setParentDimensions] = useState({
    width: windowWidth,
    height: windowHeight,
  });

  function onLayoutParent(evt: LayoutChangeEvent) {
    setParentDimensions({
      width: evt.nativeEvent.layout.width,
      height: evt.nativeEvent.layout.height,
    });
  }

  function moveIt(velocityX: number, velocityY: number) {
    'worklet';

    const width = parentDimensions.width - (childDimensions.width ?? 0); // minus width
    const height = parentDimensions.height - (childDimensions.height ?? 0); // minus height
    const toss = 0.2;

    const targetX = clamp(transX.value + toss * velocityX, 0, width);
    const targetY = clamp(transY.value + toss * velocityY, 0, height);
    // return;

    const top = targetY;
    const bottom = height - targetY;
    const left = targetX;
    const right = width - targetX;
    const minDistance = Math.min(top, bottom, left, right);
    let snapX = targetX;
    let snapY = targetY;
    switch (minDistance) {
      case top:
        snapY = 0;
        break;
      case bottom:
        snapY = height;
        break;
      case left:
        snapX = 0;
        break;
      case right:
        snapX = width;
        break;
    }
    transX.value = withSpring(snapX, {
      velocity: velocityX,
    });
    transY.value = withSpring(snapY, {
      velocity: velocityY,
    });
  }

  type AnimatedGHContext = {
    startX: number;
    startY: number;
  };
  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    AnimatedGHContext
  >({
    onStart: (_, ctx) => {
      ctx.startX = transX.value;
      ctx.startY = transY.value;
    },
    onActive: (event, ctx) => {
      transX.value = ctx.startX + event.translationX;
      transY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      moveIt(event.velocityX, event.velocityY);
    },
  });

  useEffect(() => {
    moveIt(0, 0);
  }, [parentDimensions, childDimensions]);

  const stylez = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: transX.value,
        },
        {
          translateY: transY.value,
        },
      ],
    };
  });

  const child = React.Children.only(children);

  return (
    <View style={{ width: '100%', height: '100%' }} onLayout={onLayoutParent}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[{ position: 'absolute' }, stylez]}>
          <View onLayout={onLayoutChild}>{child}</View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

export default SnapArea;
