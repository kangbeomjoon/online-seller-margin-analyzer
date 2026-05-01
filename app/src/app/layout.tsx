import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "셀러 마진 리포트 자동화 대시보드",
  description: "온라인 셀러 주문 CSV 기반 정산·마진 분석 포트폴리오 데모",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
