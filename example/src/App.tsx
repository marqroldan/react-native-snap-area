import React, { useState } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SnapArea from 'react-native-snap-area';
import type { SnapPointsImplicit } from '../../src/helpers/snapPointsGenerator';

const snapPoints = [
  [1, 0, 0],
  [1, 0, 1],
] as SnapPointsImplicit;

function SnapAreaExample(): React.ReactElement {
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
        <SnapArea snapPoints={snapPoints}>
          <View
            style={[
              styles.head,
              { backgroundColor: 'black' },
              childChanged ? { width: 75, height: 150 } : undefined,
            ]}
          />
        </SnapArea>
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

function FinalApp() {
  /// SnapAreaExample
  /// ScrollableViewExample
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SnapAreaExample />
    </GestureHandlerRootView>
  );
}

export default FinalApp;
