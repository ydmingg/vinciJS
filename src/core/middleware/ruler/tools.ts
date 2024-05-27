import type { Element, ViewScaleInfo, ViewSizeInfo, ViewContext2D, BoardViewerFrameSnapshot, ViewRectInfo, ViewCalculator } from '../../../types';
import { formatNumber, rotateByCenter, getViewScaleInfoFromSnapshot, getViewSizeInfoFromSnapshot } from '../../../tools';
import type { DeepRulerSharedStorage } from './types';
import { keySelectedElementList, keyActionType } from '../selector';

const rulerSize = 16;
const background = '#FFFFFFA8';
const borderColor = '#00000080';
const scaleColor = '#000000';
const textColor = '#00000080';
const fontFamily = 'monospace';
const fontSize = 10;
const fontWeight = 100;
const gridColor = '#AAAAAA20';
const gridKeyColor = '#AAAAAA40';
const lineSize = 1;
const selectedAreaColor = '#196097';

// const rulerUnit = 10;
// const rulerKeyUnit = 100;
// const rulerSubKeyUnit = 50;

interface RulerScale {
  num: number;
  showNum: boolean;
  position: number;
  isKeyNum: boolean;
  isSubKeyNum: boolean;
}

function calcRulerScaleList(opts: { axis: 'X' | 'Y'; scale: number; viewLength: number; viewOffset: number }): RulerScale[] {
  const { scale, viewLength, viewOffset } = opts;
  const list: RulerScale[] = [];
  let rulerUnit = 10;

  rulerUnit = formatNumber(rulerUnit / scale, { decimalPlaces: 0 });
  rulerUnit = Math.max(10, Math.min(rulerUnit, 1000));

  const rulerKeyUnit = rulerUnit * 10;
  const rulerSubKeyUnit = rulerUnit * 5;

  let index: number = 0;
  const viewUnit = rulerUnit * scale;
  const startNum = 0 - viewOffset;
  const startPosition = 0;
  const remainderNum = startNum % viewUnit;
  const firstNum = (startNum - remainderNum + viewUnit) / scale;
  const firstPosition = startPosition + (viewUnit - remainderNum);
  while (firstPosition + index * viewUnit < viewLength) {
    const num = formatNumber(firstNum + index * rulerUnit, { decimalPlaces: 0 });
    const position = formatNumber(firstPosition + index * viewUnit, { decimalPlaces: 0 });
    const rulerScale = {
      num,
      position,
      showNum: num % rulerKeyUnit === 0,
      isKeyNum: num % rulerKeyUnit === 0,
      isSubKeyNum: num % rulerSubKeyUnit === 0
    };
    list.push(rulerScale);
    index++;
  }

  return list;
}

export function calcXRulerScaleList(opts: { viewScaleInfo: ViewScaleInfo; viewSizeInfo: ViewSizeInfo }): RulerScale[] {
  const { viewScaleInfo, viewSizeInfo } = opts;
  const { scale, offsetLeft } = viewScaleInfo;
  const { width } = viewSizeInfo;
  return calcRulerScaleList({
    axis: 'X',
    scale,
    viewLength: width,
    viewOffset: offsetLeft
  });
}

export function calcYRulerScaleList(opts: { viewScaleInfo: ViewScaleInfo; viewSizeInfo: ViewSizeInfo }): RulerScale[] {
  const { viewScaleInfo, viewSizeInfo } = opts;
  const { scale, offsetTop } = viewScaleInfo;
  const { height } = viewSizeInfo;
  return calcRulerScaleList({
    axis: 'Y',
    scale,
    viewLength: height,
    viewOffset: offsetTop
  });
}

export function drawXRuler(
  ctx: ViewContext2D,
  opts: {
    scaleList: RulerScale[];
  }
) {
  const { scaleList } = opts;
  const scaleDrawStart = rulerSize;
  const scaleDrawEnd = (rulerSize * 4) / 5;
  const subKeyScaleDrawEnd = (rulerSize * 2) / 5;
  const keyScaleDrawEnd = (rulerSize * 1) / 5;
  const fontStart = rulerSize / 5;
  for (let i = 0; i < scaleList.length; i++) {
    const item = scaleList[i];
    if (item.position < rulerSize) {
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(item.position, scaleDrawStart);
    ctx.lineTo(item.position, item.isKeyNum ? keyScaleDrawEnd : item.isSubKeyNum ? subKeyScaleDrawEnd : scaleDrawEnd);
    ctx.closePath();
    ctx.lineWidth = lineSize;
    ctx.setLineDash([]);
    ctx.fillStyle = scaleColor;
    ctx.stroke();
    if (item.isKeyNum) {
      ctx.fillStyle = textColor;
      ctx.textBaseline = 'top';
      ctx.$setFont({
        fontWeight,
        fontSize,
        fontFamily
      });
      ctx.fillText(`${item.num}`, item.position + fontStart, fontStart);
    }
  }
}

export function drawYRuler(
  ctx: ViewContext2D,
  opts: {
    scaleList: RulerScale[];
  }
) {
  const { scaleList } = opts;
  const scaleDrawStart = rulerSize;
  const scaleDrawEnd = (rulerSize * 4) / 5;
  const subKeyScaleDrawEnd = (rulerSize * 2) / 5;
  const keyScaleDrawEnd = (rulerSize * 1) / 5;
  const fontStart = rulerSize / 5;
  for (let i = 0; i < scaleList.length; i++) {
    const item = scaleList[i];
    if (item.position < rulerSize) {
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(scaleDrawStart, item.position);
    ctx.lineTo(item.isKeyNum ? keyScaleDrawEnd : item.isSubKeyNum ? subKeyScaleDrawEnd : scaleDrawEnd, item.position);
    ctx.closePath();
    ctx.fillStyle = scaleColor;
    ctx.lineWidth = lineSize;
    ctx.setLineDash([]);
    ctx.stroke();
    if (item.showNum === true) {
      const textX = fontStart;
      const textY = item.position + fontStart;
      const numText = `${item.num}`;
      rotateByCenter(ctx, -90, { x: textX, y: textY }, () => {
        ctx.fillStyle = textColor;
        ctx.textBaseline = 'top';
        ctx.$setFont({
          fontWeight,
          fontSize,
          fontFamily
        });
        ctx.fillText(numText, fontStart + fontSize, item.position + fontStart);
      });
    }
  }
}

export function drawRulerBackground(
  ctx: ViewContext2D,
  opts: {
    viewScaleInfo: ViewScaleInfo;
    viewSizeInfo: ViewSizeInfo;
  }
) {
  const { viewSizeInfo } = opts;
  const { width, height } = viewSizeInfo;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width + 1, 0);
  ctx.lineTo(width + 1, rulerSize);
  ctx.lineTo(rulerSize, rulerSize);
  ctx.lineTo(rulerSize, height + 1);
  ctx.lineTo(0, height + 1);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = background;
  ctx.fill();
  ctx.lineWidth = lineSize;
  ctx.setLineDash([]);
  ctx.strokeStyle = borderColor;
  ctx.stroke();
}

export function drawUnderGrid(
  ctx: ViewContext2D,
  opts: {
    xList: RulerScale[];
    yList: RulerScale[];
    viewScaleInfo: ViewScaleInfo;
    viewSizeInfo: ViewSizeInfo;
  }
) {
  const { xList, yList, viewSizeInfo } = opts;
  const { width, height } = viewSizeInfo;
  for (let i = 0; i < xList.length; i++) {
    const item = xList[i];
    ctx.beginPath();
    ctx.moveTo(item.position, 0);
    ctx.lineTo(item.position, height);
    if (item.isKeyNum === true || item.isSubKeyNum === true) {
      ctx.strokeStyle = gridKeyColor;
    } else {
      ctx.strokeStyle = gridColor;
    }
    ctx.closePath();
    ctx.lineWidth = lineSize;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  for (let i = 0; i < yList.length; i++) {
    const item = yList[i];
    ctx.beginPath();
    ctx.moveTo(0, item.position);
    ctx.lineTo(width, item.position);
    if (item.isKeyNum === true || item.isSubKeyNum === true) {
      ctx.strokeStyle = gridKeyColor;
    } else {
      ctx.strokeStyle = gridColor;
    }
    ctx.lineWidth = 1;
    ctx.closePath();
    ctx.stroke();
  }
  // TODO
}

export function drawScrollerSelectedArea(ctx: ViewContext2D, opts: { snapshot: BoardViewerFrameSnapshot<DeepRulerSharedStorage>; calculator: ViewCalculator }) {
  const { snapshot, calculator } = opts;
  const { sharedStore } = snapshot;
  const selectedElementList = sharedStore[keySelectedElementList];
  const actionType = sharedStore[keyActionType];

  if (['select', 'drag', 'drag-list', 'drag-list-end'].includes(actionType as string) && selectedElementList.length > 0) {
    const viewScaleInfo = getViewScaleInfoFromSnapshot(snapshot);
    const viewSizeInfo = getViewSizeInfoFromSnapshot(snapshot);
    const rangeRectInfoList: ViewRectInfo[] = [];
    const xAreaStartList: number[] = [];
    const xAreaEndList: number[] = [];
    const yAreaStartList: number[] = [];
    const yAreaEndList: number[] = [];
    selectedElementList.forEach((elem: Element) => {
      const rectInfo = calculator.calcViewRectInfoFromRange(elem.id, {
        viewScaleInfo,
        viewSizeInfo
      });
      if (rectInfo) {
        rangeRectInfoList.push(rectInfo);
        xAreaStartList.push(rectInfo.left.x);
        xAreaEndList.push(rectInfo.right.x);
        yAreaStartList.push(rectInfo.top.y);
        yAreaEndList.push(rectInfo.bottom.y);
      }
    });

    if (!(rangeRectInfoList.length > 0)) {
      return;
    }

    const xAreaStart = Math.min(...xAreaStartList);
    const xAreaEnd = Math.max(...xAreaEndList);
    const yAreaStart = Math.min(...yAreaStartList);
    const yAreaEnd = Math.max(...yAreaEndList);

    ctx.globalAlpha = 1;

    ctx.beginPath();
    ctx.moveTo(xAreaStart, 0);
    ctx.lineTo(xAreaEnd, 0);
    ctx.lineTo(xAreaEnd, rulerSize);
    ctx.lineTo(xAreaStart, rulerSize);
    ctx.fillStyle = selectedAreaColor;
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, yAreaStart);
    ctx.lineTo(rulerSize, yAreaStart);
    ctx.lineTo(rulerSize, yAreaEnd);
    ctx.lineTo(0, yAreaEnd);
    ctx.fillStyle = selectedAreaColor;
    ctx.closePath();
    ctx.fill();
  }
}
