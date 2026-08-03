"use client";

import { useEffect, useRef } from "react";

/**
 * 링크 정보를 읽는 동안 **테두리를 따라 걸어 다니는** 공룡.
 *
 * iOS 앱의 `RunningDino` 이식. 도트·움직임·수치를 그대로 옮겨 두 플랫폼이 같은 장면을
 * 보여 준다(4프레임 47×45 스프라이트, `public/dino-run.png`).
 *
 * ## 왜 이런 모양인가
 *
 * - **안쪽에서 벽을 밟는다.** 바깥에 세우면 상자 밖으로 나가는 만큼이 잘린다. 대신 천장
 *   면에서는 거꾸로 매달려 걷는다.
 * - **아래쪽 면은 걷지 않는다.** 광고·하단 UI 와 겹치는 자리다. 오른쪽 → 위 → 왼쪽 세 면만
 *   돌고, 빠진 아래쪽은 잠깐 사라졌다 반대편에서 나타나는 구간이 된다.
 * - **출발점은 매번 다르다.** 늘 같은 자리에서 나오면 두 번째부터는 그냥 배경이 된다.
 * - **코너는 점프로 돈다.** 앞뒤 30px 를 하나의 도약으로 묶어 각도를 나눠 돌린다. 즉시
 *   꺾으면 걷다가 몸만 홱 돌아가 순간이동처럼 보인다.
 * - **속도와 한 바퀴 시간을 둘 다 건다.** 속도만 고정하면 큰 상자에서 한 바퀴가 10초씩
 *   걸려 모서리에서 꿈틀대고, 시간만 고정하면 작은 상자에서 총알이 된다.
 * - **프레임은 시간이 아니라 걸은 거리로 넘긴다.** 시간 기준이면 빨리 달릴수록 다리가
 *   헛돌아 미끄러진다.
 *
 * 부모에 `relative` 가 있어야 그 상자를 돈다. 클릭은 통과시킨다.
 */

const FRAME_COUNT = 4;
/** 원본 도트 크기(px). 스프라이트가 이 크기로 가로 4칸이다. */
const SPRITE_W = 47;
const SPRITE_H = 45;
/** 그려질 높이(px)와 그에 맞춘 폭. */
const HEIGHT = 34;
const WIDTH = (HEIGHT * SPRITE_W) / SPRITE_H;
/** 네 프레임을 한 번 도는 데 걷는 거리(px). */
const STRIDE = 36;
/** 목표 속도(px/초)와 한 바퀴 시간의 상·하한(초). */
const TARGET_SPEED = 150;
const LAP_MIN = 3;
const LAP_MAX = 7;
/** 코너를 넘는 동안 지나가는 거리(px)와 도약 높이(px). */
const TURN_SPAN = 30;
const JUMP = 12;
/** 뛰는 동안 고정할 프레임(0부터). 다리가 벌어진 자세라 도약으로 읽힌다. */
const LEAP_FRAME = 1;
/** 건너뛰는 면(0=위 1=오른쪽 2=아래 3=왼쪽). 아래쪽 고정. */
const SKIPPED = 2;
/** 반시계로 도는 세 면 — 오른쪽 → 위 → 왼쪽. */
const ROUTE = [1, 2, 3].map((i) => (SKIPPED + 4 - i) % 4);

type Spot = { x: number; y: number; angle: number; frame: number };
type Vector = { x: number; y: number };

function sideLength(side: number, w: number, h: number): number {
  return side % 2 === 0 ? w : h;
}

/** 면 위 `distance` 지점. **반시계**로 훑는다(위는 오른쪽에서 왼쪽으로). */
function edgePoint(side: number, distance: number, w: number, h: number): Vector {
  if (side === 0) return { x: w - distance, y: 0 };
  if (side === 1) return { x: w, y: h - distance };
  if (side === 2) return { x: distance, y: h };
  return { x: 0, y: distance };
}

/** 그 벽의 안쪽 방향. 공룡은 상자 안에 서서 벽을 밟는다. */
function inward(side: number): Vector {
  if (side === 0) return { x: 0, y: 1 };
  if (side === 1) return { x: -1, y: 0 };
  if (side === 2) return { x: 0, y: -1 };
  return { x: 1, y: 0 };
}

/** 그 거리에서 **걸어가고 있을 때**의 자리와 각도. */
function standing(distance: number, lengths: number[], w: number, h: number) {
  let walked = Math.max(0, distance);
  let index = 0;
  while (index < lengths.length - 1 && walked >= lengths[index]) {
    walked -= lengths[index];
    index += 1;
  }
  const side = ROUTE[index];
  const edge = edgePoint(side, Math.min(walked, lengths[index]), w, h);
  const into = inward(side);
  // 발이 벽에 닿도록 중심을 안쪽으로 반 칸 민다. 스프라이트는 아랫변이 곧 발바닥이다.
  const standoff = HEIGHT / 2;
  return {
    x: edge.x + into.x * standoff,
    y: edge.y + into.y * standoff,
    // 180° 를 더해 발이 바깥(벽)을 향하게 한다. 천장 면에서는 거꾸로 매달린다.
    angle: side * 90 + 180,
  };
}

/** 코너를 넘는 동작. 코너 근처가 아니면 null. */
function turning(
  distance: number,
  lengths: number[],
  w: number,
  h: number,
): Omit<Spot, "frame"> | null {
  // 짧은 면에서 도약 구간이 면보다 길면 앞뒤 코너가 겹친다.
  const span = Math.min(TURN_SPAN, Math.min(...lengths));
  if (span <= 0) return null;

  let corner = 0;
  for (let i = 0; i < lengths.length - 1; i++) {
    corner += lengths[i];
    const entered = distance - (corner - span / 2);
    if (entered < 0 || entered > span) continue;

    const p = entered / span;
    const before = standing(corner - span / 2, lengths, w, h);
    const after = standing(corner + span / 2, lengths, w, h);
    // 두 벽의 안쪽 방향을 합치면 코너에서 상자 안을 향하는 대각선이 된다.
    const a = inward(ROUTE[i]);
    const b = inward(ROUTE[i + 1]);
    const len = Math.hypot(a.x + b.x, a.y + b.y) || 1;
    const height = Math.sin(p * Math.PI) * JUMP;
    return {
      x: before.x + (after.x - before.x) * p + ((a.x + b.x) / len) * height,
      y: before.y + (after.y - before.y) * p + ((a.y + b.y) / len) * height,
      // 반시계로 도니 각도는 항상 90° 줄어든다.
      angle: before.angle - 90 * p,
    };
  }
  return null;
}

function spotAt(elapsed: number, offset: number, w: number, h: number): Spot | null {
  const lengths = ROUTE.map((side) => sideLength(side, w, h));
  const total = lengths.reduce((sum, n) => sum + n, 0);
  if (total <= 0) return null;

  const lap = Math.min(Math.max(total / TARGET_SPEED, LAP_MIN), LAP_MAX);
  const progress = (((elapsed / lap + offset) % 1) + 1) % 1;
  const distance = total * progress;

  const turn = turning(distance, lengths, w, h);
  if (turn) return { ...turn, frame: LEAP_FRAME };
  return {
    ...standing(distance, lengths, w, h),
    frame: Math.floor(distance / (STRIDE / FRAME_COUNT)) % FRAME_COUNT,
  };
}

export default function RunningDino() {
  const box = useRef<HTMLDivElement>(null);
  const dino = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const frame = box.current;
    const sprite = dino.current;
    if (!frame || !sprite) return;

    // **React 상태로 그리지 않는다.** 좌표가 초당 60번 바뀌는데 그때마다 리렌더하면
    // 장식 하나 때문에 화면 전체가 다시 그려진다. DOM 을 직접 만진다.
    const draw = (elapsed: number) => {
      const rect = frame.getBoundingClientRect();
      const spot = spotAt(elapsed, offset, rect.width, rect.height);
      if (!spot) return;
      sprite.style.backgroundPosition = `-${spot.frame * WIDTH}px 0`;
      sprite.style.transform =
        `translate(${spot.x - WIDTH / 2}px, ${spot.y - HEIGHT / 2}px) rotate(${spot.angle}deg)`;
      sprite.style.visibility = "visible";
    };

    // 출발점은 마운트 때 한 번만 뽑는다. 매 프레임 뽑으면 순간이동한다.
    const offset = Math.random();

    // 동작 줄이기가 켜져 있으면 움직이지 않는다 — 전정기관 장애가 있는 사용자에게
    // 화면을 가로지르는 반복 운동은 불편을 준다. 세워는 두되 걷지 않는다.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(0);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      draw((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={box}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <span
        ref={dino}
        className="absolute left-0 top-0 block"
        style={{
          width: WIDTH,
          height: HEIGHT,
          // 첫 좌표를 계산하기 전에는 왼쪽 위에 붙어 한 번 깜빡인다. 그리고 나서 보여 준다.
          visibility: "hidden",
          // 스프라이트를 가로 4칸으로 늘려 두고 한 칸씩 민다.
          backgroundImage: "url(/dino-run.png)",
          backgroundSize: `${WIDTH * FRAME_COUNT}px ${HEIGHT}px`,
          // 없으면 47px 도트를 34px 로 줄일 때 브라우저가 뭉갠다.
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
