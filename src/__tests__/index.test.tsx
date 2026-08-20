import { readFileSync } from 'fs';
import path from 'path';

describe('Gesture Handler compatibility', () => {
  it('uses the Gesture Handler 3 pan hook lifecycle', () => {
    const source = readFileSync(
      path.resolve(__dirname, '..', 'SnapArea.tsx'),
      'utf8'
    );

    expect(source).toMatch(/\busePanGesture\s*\(/);
    expect(source).toMatch(/\bonDeactivate\s*:/);
    expect(source).not.toMatch(/\bGesture\.Pan\s*\(/);
  });
});
