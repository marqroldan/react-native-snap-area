export type SnapPointItem = { x: number; y: number };
export type WrapTypes = 'around' | 'edge';
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
