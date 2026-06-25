// 브랜드 마크 — 아이콘 + ClipNote(Note 는 브랜드 컬러). 헤더·로그인·푸터 공통.
// iconClassName 으로 크기 조절, showIcon=false 면 텍스트만.
export default function Brand({
  className,
  iconClassName = "h-7 w-7",
  showIcon = true,
  children,
}: {
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
  children?: React.ReactNode; // 'ClipNote' 뒤에 붙는 텍스트(예: '란?') — 한 줄로 정렬됨
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {showIcon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icon-192.png" alt="" className={`${iconClassName} rounded-md`} />
      )}
      <span>
        Clip<span className="text-brand">Note</span>
        {children}
      </span>
    </span>
  );
}
