# react-native-snap-area

Creates an area that makes the sides or specific points snappable by the child


https://github.com/marqroldan/react-native-snap-area/assets/11716376/72ff1afa-7d8f-4f5c-b94d-ffb358fe6125


## Installation

```sh
npm install react-native-snap-area
```

## Usage

```js
import SnapArea from 'react-native-snap-area';

const snapPoints = [
  [1, 1],
  [1, 1, 1],
  [1, 1],
];
// Check out the example App.tsx file file to test it

function App() {
  return (
    <SnapArea snapPoints={snapPoints}>
      <View
        style={[
          styles.head,
          { backgroundColor: 'black' },
          childChanged ? { width: 75, height: 150 } : undefined,
        ]}
      />
    </SnapArea>
  )
}

```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
