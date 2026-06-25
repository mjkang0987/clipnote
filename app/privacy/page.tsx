import type { Metadata } from "next";
import Header from "@/app/_components/Header";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description:
    "ClipNote가 수집하는 개인정보 항목, 이용 목적, 보유 기간, 처리위탁(국외 이전), 이용자 권리를 안내합니다.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

// ── 운영자 정보 ──────────────────────────────────
const CONTACT_EMAIL = "pikaworks.help@gmail.com";
const PRIVACY_OFFICER = "pikaworks 운영자";
const EFFECTIVE_DATE = "2026년 6월 19일";

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          개인정보처리방침
        </h1>
        <p className="mt-2 text-sm text-fg-muted">시행일: {EFFECTIVE_DATE}</p>

        <p className="mt-6 leading-relaxed text-fg-muted">
          ClipNote(이하 “서비스”)는 「개인정보 보호법」을 준수하며, 이용자의
          개인정보를 보호하기 위해 다음과 같이 개인정보처리방침을 두고 있습니다.
          서비스는 회원 로그인에 필요한 최소한의 정보만 수집합니다.
        </p>

        <Section title="1. 수집하는 개인정보 항목">
          <p>
            서비스는 Google·카카오 소셜 로그인을 통해 회원 식별에 필요한 정보를
            수집합니다. 서비스의 자체 데이터베이스에는 회원 구분용 고유 식별자만
            저장하며, 이메일·프로필 정보는 인증 처리(Supabase)에 보관됩니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>필수: 소셜 계정 고유 식별자(고유 ID), 이메일</li>
            <li>선택: 프로필 닉네임, 프로필 이미지(공급자가 제공하는 경우)</li>
            <li>
              자동 생성: 서비스 이용 과정에서 만들어지는 클립 정보(저장한 URL,
              제목, 태그 등)와 로그인 유지를 위한 쿠키
            </li>
          </ul>
        </Section>

        <Section title="2. 개인정보의 수집·이용 목적">
          <ul className="list-disc space-y-1 pl-5">
            <li>회원 식별 및 로그인 상태 유지</li>
            <li>이용자가 만든 클립(공유 링크·내 클립)의 저장·조회·관리</li>
            <li>서비스 운영 및 문의 대응</li>
          </ul>
        </Section>

        <Section title="3. 보유 및 이용 기간">
          <p>
            수집한 개인정보는 회원 탈퇴 시까지 보유하며, 탈퇴 요청 시 지체 없이
            파기합니다. 다만 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안
            보관합니다.
          </p>
        </Section>

        <Section title="4. 개인정보 처리위탁">
          <p>
            서비스는 안정적인 운영을 위해 아래와 같이 개인정보 처리 업무를
            위탁하고 있습니다. 이용자의 데이터는 국내(대한민국) 리전 서버에
            저장됩니다. 다만 소셜 로그인 인증 과정에서 일부 정보가 각 공급자의
            서버(국외 포함)에서 처리될 수 있습니다.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-fg">
                  <th className="py-2 pr-4 font-semibold">수탁자</th>
                  <th className="py-2 pr-4 font-semibold">위탁 업무</th>
                  <th className="py-2 font-semibold">저장 위치</th>
                </tr>
              </thead>
              <tbody className="text-fg-muted">
                <tr className="border-b border-border">
                  <td className="py-2 pr-4">Supabase, Inc.</td>
                  <td className="py-2 pr-4">
                    데이터베이스 저장, 사용자 인증(로그인) 처리
                  </td>
                  <td className="py-2">대한민국 (서울 리전)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            소셜 로그인 과정에서 Google LLC, ㈜카카오가 각 사의 정책에 따라
            인증을 처리합니다. 각 공급자의 개인정보 처리 기준은 해당 공급자의
            방침을 따릅니다.
          </p>
        </Section>

        <Section title="5. 개인정보의 제3자 제공">
          <p>
            서비스는 이용자의 개인정보를 외부에 판매하거나 제3자에게 제공하지
            않습니다. 다만 법령에 따라 요구되는 경우는 예외로 합니다.
          </p>
        </Section>

        <Section title="6. 이용자의 권리와 행사 방법">
          <p>
            이용자는 언제든지 자신의 개인정보에 대해 열람·정정·삭제·처리정지를
            요청할 수 있습니다. 요청은 아래 연락처로 문의해 주시면 지체 없이
            조치합니다. 서비스 내 로그아웃·클립 삭제 기능으로도 직접 처리할 수
            있습니다.
          </p>
        </Section>

        <Section title="7. 개인정보의 파기">
          <p>
            보유 기간이 지나거나 처리 목적이 달성된 개인정보는 지체 없이
            파기합니다. 전자적 파일은 복구할 수 없는 방법으로 영구 삭제합니다.
          </p>
        </Section>

        <Section title="8. 쿠키 사용">
          <p>
            서비스는 로그인 상태 유지를 위해 세션 쿠키를 사용합니다. 이용자는
            브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 로그인이
            제한될 수 있습니다.
          </p>
        </Section>

        <Section title="9. 개인정보 보호책임자">
          <p>
            개인정보 처리에 관한 문의·불만·피해 구제는 아래로 연락해 주세요.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>책임자: {PRIVACY_OFFICER}</li>
            <li>
              이메일:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-brand-strong underline"
              >
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </Section>

        <Section title="10. 방침의 변경">
          <p>
            이 개인정보처리방침은 시행일부터 적용되며, 내용이 변경되는 경우
            변경 사항을 서비스 화면에 공지합니다.
          </p>
        </Section>

        <p className="mt-10 text-xs leading-relaxed text-fg-muted">
          ※ 본 방침은 시행일 기준 내용이며, 변경 시 서비스 화면에 공지합니다.
        </p>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-6 text-xs text-fg-muted">
          <span>© 2026 PIKAWORKS</span>
          <a href="/" className="font-semibold hover:text-fg">
            홈으로
          </a>
        </div>
      </footer>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-fg">{title}</h2>
      <div className="mt-2 leading-relaxed text-fg-muted">{children}</div>
    </section>
  );
}
