import React, { useEffect, useState } from 'react';
import { View, Dimensions, StyleSheet, Button } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function ChatHeads({
  children,
}: React.PropsWithChildren<Record<never, never>>) {
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
        <Animated.View style={[styles.headContainer, stylez]}>
          <View onLayout={onLayoutChild}>{child}</View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

function ChatHeadsExample(): React.ReactElement {
  const [childChanged, setChildChanged] = useState(false);
  const [parentChanged, setParentChanged] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[
          { flex: 1, margin: 50, backgroundColor: 'red' },
          parentChanged ? { margin: 0, marginBottom: 150 } : undefined,
        ]}
      >
        <ChatHeads>
          <View
            style={[
              styles.head,
              { backgroundColor: 'black' },
              childChanged ? { width: 75, height: 150 } : undefined,
            ]}
          />
        </ChatHeads>
      </View>
      <Button
        title={'change child size'}
        onPress={() => {
          setChildChanged((val) => !val);
        }}
      />
      <Button
        title={'change parent size'}
        onPress={() => {
          setParentChanged((val) => !val);
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  head: {
    width: 40,
    height: 40,
  },
  headContainer: {
    position: 'absolute',
  },
});

////////////////////////////////////////////////

import { withDecay, withTiming, Easing } from 'react-native-reanimated';
import { Platform, LayoutChangeEvent } from 'react-native';

const windowDimensions = Dimensions.get('window');

const colors = [
  'black',
  'blue',
  'green',
  'yellow',
  'red',
  'gray',
  'pink',
  'orange',
];

const boxHeight = 120;

function friction(value: number) {
  'worklet';

  const MAX_FRICTION = 200;
  const MAX_VALUE = 400;

  const res = Math.max(
    1,
    Math.min(
      MAX_FRICTION,
      1 + (Math.abs(value) * (MAX_FRICTION - 1)) / MAX_VALUE
    )
  );

  if (value < 0) {
    return -res;
  }

  return res;
}

function ScrollableView({
  children,
}: React.PropsWithChildren<Record<never, never>>) {
  const translateY = useSharedValue(0);
  const loverBound = useSharedValue(0);
  const headerHeight = 0;

  function onLayout(evt: LayoutChangeEvent) {
    console.log('hello???');
    loverBound.value =
      windowDimensions.height - headerHeight - evt.nativeEvent.layout.height;
  }

  type AnimatedGHContext = {
    startY: number;
  };
  const handler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    AnimatedGHContext
  >({
    onStart: (_evt, ctx) => {
      const currentY = translateY.value;
      ctx.startY = currentY;
      translateY.value = currentY; // for stop animation
    },

    onActive: (evt, ctx) => {
      const nextTranslate = ctx.startY + evt.translationY;

      if (nextTranslate < loverBound.value) {
        translateY.value =
          loverBound.value + friction(nextTranslate - loverBound.value);
      } else if (nextTranslate > 0) {
        translateY.value = friction(nextTranslate);
      } else {
        translateY.value = nextTranslate;
      }
    },

    onEnd: (evt, _ctx) => {
      if (translateY.value < loverBound.value || translateY.value > 0) {
        const toValue = translateY.value > 0 ? 0 : loverBound.value;

        translateY.value = withTiming(toValue, {
          duration: 250,
          easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
        });
      } else {
        translateY.value = withDecay({
          clamp: [loverBound.value, 0],
          velocity: evt.velocityY,
        });
      }
    },
  });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: boxHeight * colors.length,
      transform: [
        {
          translateY: translateY.value,
        },
      ],
    };
  });

  return (
    <View style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={handler}>
        <Animated.View style={animatedStyles}>
          <View onLayout={onLayout}>{children}</View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

function Box({ color }: { color: string }) {
  return (
    <View
      style={{
        backgroundColor: color,
        height: boxHeight,
        borderBottomWidth: 1,
        borderBottomColor: 'gray',
      }}
    />
  );
}

function ScrollableViewExample(): React.ReactElement {
  const headerHeight = 0;

  const height =
    Platform.OS === 'web' ? windowDimensions.height - headerHeight : undefined;

  return (
    <View style={[styles2.wrapper, { height }]}>
      <ScrollableView>
        {colors.map((color) => (
          <Box color={color} key={color} />
        ))}
      </ScrollableView>
    </View>
  );
}

const styles2 = StyleSheet.create({
  wrapper: {
    overflow: Platform.OS === 'web' ? 'hidden' : undefined,
  },
});

function FinalApp() {
  /// ChatHeadsExample
  /// ScrollableViewExample
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ChatHeadsExample />
    </GestureHandlerRootView>
  );
}

export default FinalApp;
