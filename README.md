# Online Seller Margin Analyzer

스마트스토어·쿠팡 주문 CSV, 상품 원가표, 수수료 설정표를 합쳐 온라인 셀러의 매출, 순이익, 마진율, 저마진 상품, 데이터 누락 경고를 자동으로 보여주는 웹 대시보드형 포트폴리오입니다.

## What It Does

- 스마트스토어·쿠팡 CSV를 공통 주문 데이터로 표준화합니다.
- 상품 원가와 플랫폼 수수료 기준으로 순이익과 마진율을 계산합니다.
- KPI, 월별 추이, 플랫폼 비교, 상품별 마진 테이블을 제공합니다.
- 원가 누락, 배송비 누락 의심, 저마진/적자 상품을 경고합니다.
- 분석 결과를 엑셀 리포트로 다운로드할 수 있습니다.

## Run Locally

```bash
cd app
npm ci
npm run dev
```

Then open `http://localhost:3000?sample=1`.

## Verify

```bash
cd app
npm test
npm run lint
npm run build
```

## Project Docs

- [Portfolio overview](portfolio/README.md)
- [Sample data design](docs/sample-data-design.md)
- [Implementation plan](docs/detailed-implementation-plan.md)

## Scope

The MVP is intentionally limited to CSV-based analysis, cost and fee based margin calculation, a web dashboard, and Excel export. It does not include live marketplace API integration, login automation, tax filing, or notification delivery.
