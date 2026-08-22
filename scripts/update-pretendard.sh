#!/usr/bin/env bash
# Pretendard self-host 파일 갱신. app/fonts.css 와 public/fonts/pretendard-<버전>/ 을 다시 만든다.
#
#   ./scripts/update-pretendard.sh 1.3.10
#
# 왜 빌드 스텝이 아니라 수동 스크립트인가: 마지막 `pnpm remove` 가 핵심이다. pretendard 패키지는
# 40MB 가 넘는데 결과물을 커밋하므로 런타임에도 빌드에도 필요 없다. 빌드 훅으로 만들면 Vercel 이
# 매 배포마다 그걸 받게 된다. 폰트 업그레이드는 몇 달에 한 번이라 그 값을 치를 이유가 없다.
set -euo pipefail

V="${1:?사용법: $0 <pretendard 버전>   예: $0 1.3.10}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/node_modules/pretendard/dist/web/variable"
DST="$ROOT/public/fonts/pretendard-$V"
CSS="$ROOT/app/fonts.css"

cd "$ROOT"
pnpm add -D "pretendard@$V"

# 기존 버전 디렉터리는 URL 이 통째로 바뀌므로 남겨둘 이유가 없다.
# 지우기 전에 무엇을 지우는지 먼저 보여 준다.
for old in public/fonts/pretendard-*/; do
  [ -d "$old" ] && [ "$old" != "$DST/" ] && echo "  기존 디렉터리: $old ($(find "$old" -type f | wc -l) 파일) — 확인 후 직접 지울 것"
done

mkdir -p "$DST"
cp "$SRC"/woff2-dynamic-subset/*.woff2 "$DST"/

# 헤더 주석은 보존하고 @font-face 본문만 갈아끼운다.
head -n "$(grep -n '^ \*/$' "$CSS" | head -1 | cut -d: -f1)" "$CSS" > "$CSS.tmp"
printf '\n' >> "$CSS.tmp"
sed "s#url(\./woff2-dynamic-subset/\([^)]*\))#url(\"/fonts/pretendard-$V/\1\")#g" \
  "$SRC/pretendardvariable-dynamic-subset.css" >> "$CSS.tmp"
mv "$CSS.tmp" "$CSS"

pnpm remove pretendard

echo
echo "완료. 남은 일:"
echo "  1. app/fonts.css 헤더의 버전·수치를 새 값으로 고칠 것"
echo "  2. next.config.ts 의 source 패턴은 버전 무관(:version)이라 손댈 필요 없음"
echo "  3. 옛 public/fonts/pretendard-*/ 디렉터리 정리"
echo "  4. pnpm build 후 폰트가 실제로 서빙되는지 확인"
