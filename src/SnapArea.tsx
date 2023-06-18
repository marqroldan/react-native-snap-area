import React, { useEffect, useState } from 'react';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Dimensions, LayoutChangeEvent, View } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import {
  snapPointsGenerator,
  SnapPointsImplicit,
} from './helpers/snapPointsGenerator';
import type { SnapPointItem, WrapTypes } from './helpers/snapPointsGenerator';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

type Props = {
  snapPoints?: SnapPointsImplicit;
  snapPointsExplicit?: SnapPointItem[];
  wrapType?: WrapTypes;
};

export function SnapArea(props: React.PropsWithChildren<Props>) {
  const { children } = props;
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

  const [snapPoints, setSnapPoints] = useState<undefined | SnapPointItem[]>(
    undefined
  );

  useEffect(() => {
    if (props.snapPointsExplicit) {
      setSnapPoints(props.snapPointsExplicit);
    } else if (props.snapPoints?.length) {
      setSnapPoints(
        snapPointsGenerator(
          parentDimensions.width - (childDimensions.width ?? 0),
          parentDimensions.height - (childDimensions.height ?? 0),
          props.snapPoints,
          props.wrapType
        )
      );
    } else {
      if (snapPoints) {
        setSnapPoints(undefined);
      }
    }
  }, [
    parentDimensions,
    childDimensions,
    props.snapPoints,
    props.snapPointsExplicit,
    props.wrapType,
  ]);

  function moveIt(velocityX: number, velocityY: number) {
    'worklet';

    const width = parentDimensions.width - (childDimensions.width ?? 0); // minus width
    const height = parentDimensions.height - (childDimensions.height ?? 0); // minus height
    const toss = 0.2;

    const targetX = clamp(transX.value + toss * velocityX, 0, width);
    const targetY = clamp(transY.value + toss * velocityY, 0, height);

    let snapX = targetX;
    let snapY = targetY;

    if (snapPoints?.length) {
      let currentSmallestIndex = 0;
      let currentSmallestDistance = parentDimensions.width;

      for (let i = 0; i < snapPoints.length; i++) {
        /// weird how it keeps saying it might be undefined when the loop should have provided that info?
        const snapPoint = snapPoints[i]!;

        const dist = Math.sqrt(
          Math.pow(targetX - snapPoint.x, 2) +
            Math.pow(targetY - snapPoint.y, 2)
        );

        if (dist < currentSmallestDistance) {
          currentSmallestDistance = dist;
          currentSmallestIndex = i;
        }
      }

      /// weird how it keeps saying it might be undefined when the loop should have provided that info?
      const selectedSnapPoint = snapPoints[currentSmallestIndex]!;
      snapX = selectedSnapPoint.x;
      snapY = selectedSnapPoint.y;

      /// correction
    } else {
      const top = targetY;
      const bottom = height - targetY;
      const left = targetX;
      const right = width - targetX;
      const minDistance = Math.min(top, bottom, left, right);
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
  }, [snapPoints, parentDimensions, childDimensions]);

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
