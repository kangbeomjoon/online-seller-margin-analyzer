# 셀러 마진 리포트 자동화 대시보드 상세 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스마트스토어와 쿠팡 샘플 CSV를 표준화하고, 상품별/월별/플랫폼별 마진을 계산해 웹 대시보드와 엑셀 다운로드로 보여주는 포트폴리오 데모를 만든다.

**Architecture:** 1차 버전은 A안으로 구현한다. Next.js 클라이언트 앱에서 샘플 CSV를 불러오고, 브라우저에서 CSV 파싱, 표준화, 원가/수수료 조인, 마진 계산, 대시보드 렌더링, 엑셀 다운로드를 처리한다. 서버 API, 로그인, 실제 쇼핑몰 API 연동은 제외한다.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, PapaParse, Recharts, ExcelJS, Vitest, React Testing Library

---

## 1. 누락 점검 결과

기획 문서 기준으로 큰 기능 범위는 충분하다. 구현 전에 다음 항목을 명시적으로 보강했다.

| 항목 | 결정 |
|---|---|
| 1차 플랫폼 범위 | 스마트스토어, 쿠팡 |
| 자사몰 | 첫 구현 제외, 확장 가능 항목 |
| 계산 포함 주문 | 결제완료, 배송중, 배송완료, 구매확정 |
| 계산 제외 주문 | 취소, 반품 |
| 상품 매칭 | `상품명 + 옵션명` 기준으로 원가표 매칭 |
| 원가 미등록 | 계산값을 임의로 0 처리하지 않고 경고로 분리 |
| 저마진 기준 | 마진율 0% 이상 20% 미만 |
| 적자 기준 | 순이익 0원 미만 |
| 세무 처리 | 부가세/소득세/신고 수준 회계 처리 제외 |
| 배송비 | 1차는 주문당 기본 배송비 적용, 합배송 제외 |
| 수수료 | 플랫폼별 기본수수료율, 결제수수료율, 주문당 고정비 적용 |
| 엑셀 다운로드 | 표준 주문 데이터, 상품별 마진 분석, 월별 요약 |

## 2. 파일 구조

구현 후 파일 구조는 다음을 기준으로 한다.

```text
online-seller-margin-analyzer/
  app/
    package.json
    next.config.ts
    tsconfig.json
    vitest.config.ts
    postcss.config.mjs
    tailwind.config.ts
    src/
      app/
        globals.css
        layout.tsx
        page.tsx
      components/
        DashboardShell.tsx
        FileUploadPanel.tsx
        KpiSummary.tsx
        MonthlyTrendChart.tsx
        PlatformComparisonChart.tsx
        ProductMarginTable.tsx
        ValidationPanel.tsx
        DownloadPanel.tsx
      lib/
        csv/
          parseCsv.ts
          platformMappers.ts
        domain/
          types.ts
          normalizeOrders.ts
          calculateMargins.ts
          aggregateMetrics.ts
          validations.ts
          exportWorkbook.ts
        sample-data/
          loadSampleData.ts
      test/
        calculateMargins.test.ts
        normalizeOrders.test.ts
        aggregateMetrics.test.ts
        validations.test.ts
  docs/
    portfolio-planning.md
    sample-data-design.md
    detailed-implementation-plan.md
  sample-data/
    smartstore-orders.csv
    coupang-orders.csv
    product-costs.csv
    fee-rules.csv
  outputs/
```

## 3. 구현 단계

### Task 1: 샘플 CSV 작성

**Files:**
- Create: `sample-data/smartstore-orders.csv`
- Create: `sample-data/coupang-orders.csv`
- Create: `sample-data/product-costs.csv`
- Create: `sample-data/fee-rules.csv`

- [x] **Step 1: 상품 원가표 작성**

`sample-data/product-costs.csv`에 10개 상품과 14~18개 옵션을 작성한다.

필수 포함 상품:

```text
P-001 프리미엄 무선 충전기
P-002 휴대용 미니 가습기
P-003 데일리 텀블러
P-004 3단 자동 우산
P-005 실리콘 주방 집게
P-006 여행용 파우치 세트
P-007 노트북 거치대
P-008 차량용 방향제
P-009 반려동물 급수기
P-010 에코 장바구니
```

원가표에는 일부러 주문 CSV에 등장하지 않는 상품도 1개 포함한다. 주문 CSV에는 원가표에 없는 상품도 1개 포함해 원가 미등록 경고를 만든다.

- [x] **Step 2: 수수료 설정표 작성**

`sample-data/fee-rules.csv`에는 다음 값을 사용한다.

```csv
플랫폼,기본수수료율,결제수수료율,주문당고정비
smartstore,0.035,0.018,0
coupang,0.085,0.022,150
```

- [x] **Step 3: 스마트스토어 주문 CSV 작성**

`sample-data/smartstore-orders.csv`는 40~60건으로 작성한다. 기간은 2026-01-01부터 2026-03-31까지 분산한다.

필수 상태:

```text
구매확정
배송완료
결제완료
배송중
취소
반품
```

- [x] **Step 4: 쿠팡 주문 CSV 작성**

`sample-data/coupang-orders.csv`는 40~60건으로 작성한다. 스마트스토어와 동일 상품 일부를 포함해 플랫폼 수수료 차이를 보여준다.

- [x] **Step 5: CSV 행 수 확인**

Run:

```bash
wc -l sample-data/*.csv
```

Expected:

```text
각 주문 CSV는 헤더 포함 41~61줄
product-costs.csv는 헤더 포함 15~19줄
fee-rules.csv는 헤더 포함 3줄
```

### Task 2: Next.js 앱 초기화

**Files:**
- Create: `app/package.json`
- Create: `app/next.config.ts`
- Create: `app/tsconfig.json`
- Create: `app/vitest.config.ts`
- Create: `app/postcss.config.mjs`
- Create: `app/tailwind.config.ts`
- Create: `app/src/app/layout.tsx`
- Create: `app/src/app/page.tsx`
- Create: `app/src/app/globals.css`

- [x] **Step 1: 앱 생성**

Run:

```bash
cd app
npm create next-app@latest . -- --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Expected:

```text
Next.js 프로젝트 파일이 app/ 아래 생성된다.
```

- [x] **Step 2: 필요한 라이브러리 설치**

Run:

```bash
cd app
npm install papaparse recharts exceljs lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/papaparse
```

Expected:

```text
package.json dependencies에 papaparse, recharts, exceljs, lucide-react가 추가된다.
devDependencies에 vitest 관련 패키지가 추가된다.
```

- [x] **Step 3: 테스트 스크립트 추가**

`app/package.json`에 다음 스크립트를 둔다.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run"
  }
}
```

- [x] **Step 4: 초기 실행 확인**

Run:

```bash
cd app
npm run build
```

Expected:

```text
Build completes successfully.
```

### Task 3: 도메인 타입 정의

**Files:**
- Create: `app/src/lib/domain/types.ts`

- [x] **Step 1: 타입 파일 생성**

`types.ts`에 다음 타입을 정의한다.

```ts
export type Platform = "smartstore" | "coupang";

export type OrderStatus = "paid" | "shipping" | "completed" | "canceled" | "returned";

export type ProfitStatus =
  | "healthy"
  | "low_margin"
  | "loss"
  | "missing_cost"
  | "excluded";

export interface RawSmartstoreOrder {
  주문일: string;
  주문번호: string;
  상품명: string;
  옵션명: string;
  수량: string;
  상품금액: string;
  배송비: string;
  할인금액: string;
  결제금액: string;
  주문상태: string;
}

export interface RawCoupangOrder {
  결제일: string;
  주문번호: string;
  노출상품명: string;
  옵션명: string;
  구매수량: string;
  판매가: string;
  배송비: string;
  쿠폰할인: string;
  정산예정금액: string;
  주문상태: string;
}

export interface ProductCost {
  productCode: string;
  productName: string;
  optionName: string;
  unitCost: number;
  defaultShippingCost: number;
  packagingCost: number;
  otherCost: number;
}

export interface FeeRule {
  platform: Platform;
  baseFeeRate: number;
  paymentFeeRate: number;
  fixedFeePerOrder: number;
}

export interface StandardOrder {
  platform: Platform;
  orderDate: string;
  orderMonth: string;
  orderId: string;
  productName: string;
  optionName: string;
  quantity: number;
  grossSales: number;
  discountAmount: number;
  paidAmount: number;
  settlementAmount: number | null;
  shippingFeeCharged: number;
  orderStatus: OrderStatus;
}

export interface CalculatedOrder extends StandardOrder {
  productCode: string | null;
  unitCost: number | null;
  shippingCost: number | null;
  packagingCost: number | null;
  otherCost: number | null;
  salesFee: number;
  paymentFee: number;
  fixedFee: number;
  totalCost: number | null;
  netProfit: number | null;
  marginRate: number | null;
  profitStatus: ProfitStatus;
}
```

- [x] **Step 2: 타입 검사**

Run:

```bash
cd app
npm run build
```

Expected:

```text
TypeScript 타입 오류가 없다.
```

### Task 4: CSV 파싱과 플랫폼별 표준화

**Files:**
- Create: `app/src/lib/csv/parseCsv.ts`
- Create: `app/src/lib/csv/platformMappers.ts`
- Create: `app/src/lib/domain/normalizeOrders.ts`
- Create: `app/src/test/normalizeOrders.test.ts`

- [x] **Step 1: 실패 테스트 작성**

`normalizeOrders.test.ts`에는 스마트스토어와 쿠팡 행이 같은 `StandardOrder` 구조로 변환되는 테스트를 작성한다.

- [x] **Step 2: 테스트 실패 확인**

Run:

```bash
cd app
npm test -- normalizeOrders.test.ts
```

Expected:

```text
normalize 함수가 없어 실패한다.
```

- [x] **Step 3: 매퍼 구현**

`platformMappers.ts`는 다음 책임을 가진다.

```text
mapSmartstoreOrder(row) -> StandardOrder
mapCoupangOrder(row) -> StandardOrder
normalizeOrderStatus(status) -> OrderStatus
```

날짜에서 앞 7자리를 잘라 `orderMonth`를 만든다.

- [x] **Step 4: CSV 파서 구현**

`parseCsv.ts`는 PapaParse를 감싸 다음 형태로 제공한다.

```ts
export function parseCsv<T>(text: string): T[]
```

빈 줄은 무시하고, 헤더 기반 객체 배열을 반환한다.

- [x] **Step 5: 테스트 통과 확인**

Run:

```bash
cd app
npm test -- normalizeOrders.test.ts
```

Expected:

```text
스마트스토어와 쿠팡 표준화 테스트가 통과한다.
```

### Task 5: 마진 계산 엔진 구현

**Files:**
- Create: `app/src/lib/domain/calculateMargins.ts`
- Create: `app/src/test/calculateMargins.test.ts`

- [x] **Step 1: 실패 테스트 작성**

다음 케이스를 테스트한다.

```text
정상 주문은 순이익과 마진율을 계산한다.
쿠팡 주문은 스마트스토어보다 높은 수수료를 적용한다.
취소 주문은 excluded 상태가 된다.
원가표 매칭 실패 주문은 missing_cost 상태가 된다.
순이익이 음수이면 loss 상태가 된다.
마진율이 0 이상 20% 미만이면 low_margin 상태가 된다.
```

- [x] **Step 2: 테스트 실패 확인**

Run:

```bash
cd app
npm test -- calculateMargins.test.ts
```

Expected:

```text
calculateMargins 함수가 없어 실패한다.
```

- [x] **Step 3: 계산 함수 구현**

`calculateMargins.ts`는 다음 함수를 제공한다.

```ts
export function calculateMargins(
  orders: StandardOrder[],
  productCosts: ProductCost[],
  feeRules: FeeRule[]
): CalculatedOrder[]
```

상품 매칭 키는 `${productName}::${optionName}`로 만든다. 수수료는 원 단위 반올림한다.

- [x] **Step 4: 테스트 통과 확인**

Run:

```bash
cd app
npm test -- calculateMargins.test.ts
```

Expected:

```text
모든 마진 계산 테스트가 통과한다.
```

### Task 6: 집계 지표 구현

**Files:**
- Create: `app/src/lib/domain/aggregateMetrics.ts`
- Create: `app/src/test/aggregateMetrics.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

다음 집계를 테스트한다.

```text
전체 KPI: 총매출, 순이익, 평균 마진율, 적자 상품 수
월별 집계: orderMonth 기준 매출과 순이익
플랫폼별 집계: platform 기준 매출과 순이익
상품별 집계: productCode/productName/optionName/platform 기준 판매수량, 매출, 비용, 순이익, 마진율, 상태
```

- [ ] **Step 2: 집계 함수 구현**

`aggregateMetrics.ts`는 다음 함수를 제공한다.

```ts
export function buildDashboardMetrics(orders: CalculatedOrder[]): DashboardMetrics
```

취소/반품과 원가 미등록 주문은 순이익 집계에서 제외하되, 경고 집계에는 포함할 수 있게 원본 `CalculatedOrder`에는 남긴다.

- [ ] **Step 3: 테스트 통과 확인**

Run:

```bash
cd app
npm test -- aggregateMetrics.test.ts
```

Expected:

```text
KPI, 월별, 플랫폼별, 상품별 집계 테스트가 통과한다.
```

### Task 7: 검증 경고 구현

**Files:**
- Create: `app/src/lib/domain/validations.ts`
- Create: `app/src/test/validations.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

다음 경고를 테스트한다.

```text
원가 미등록 상품
배송비 누락 의심 주문
수수료 설정 누락 플랫폼
적자 상품 TOP 10
저마진 상품 TOP 10
계산 제외 주문
```

- [ ] **Step 2: 검증 함수 구현**

`validations.ts`는 다음 함수를 제공한다.

```ts
export function buildValidationReport(orders: CalculatedOrder[]): ValidationReport
```

- [ ] **Step 3: 테스트 통과 확인**

Run:

```bash
cd app
npm test -- validations.test.ts
```

Expected:

```text
검증 경고 테스트가 통과한다.
```

### Task 8: 샘플 데이터 로더 구현

**Files:**
- Create: `app/src/lib/sample-data/loadSampleData.ts`
- Create: `app/scripts/sync-sample-data.mjs`
- Modify: `app/package.json`

- [ ] **Step 1: 샘플 CSV 동기화 스크립트 작성**

루트 `sample-data/`를 원본으로 유지하고, Next.js 앱에서는 `app/public/sample-data/`에서 fetch한다. `app/scripts/sync-sample-data.mjs`는 다음 파일 4개를 복사한다.

```text
../../sample-data/smartstore-orders.csv -> public/sample-data/smartstore-orders.csv
../../sample-data/coupang-orders.csv -> public/sample-data/coupang-orders.csv
../../sample-data/product-costs.csv -> public/sample-data/product-costs.csv
../../sample-data/fee-rules.csv -> public/sample-data/fee-rules.csv
```

`app/package.json`에는 다음 스크립트를 추가한다.

```json
{
  "scripts": {
    "sync:sample-data": "node scripts/sync-sample-data.mjs",
    "predev": "npm run sync:sample-data",
    "prebuild": "npm run sync:sample-data"
  }
}
```

- [ ] **Step 2: 로더 구현**

`loadSampleData.ts`는 `/sample-data/*.csv` 경로에서 fetch하고 다음 함수를 제공한다.

```ts
export async function loadSampleData(): Promise<{
  smartstoreCsv: string;
  coupangCsv: string;
  productCostsCsv: string;
  feeRulesCsv: string;
}>
```

- [ ] **Step 3: 브라우저에서 로딩 확인**

Run:

```bash
cd app
npm run dev
```

Expected:

```text
샘플 데이터로 체험하기 버튼을 누르면 4개 CSV가 로드된다.
```

### Task 9: 대시보드 UI 구현

**Files:**
- Modify: `app/src/app/page.tsx`
- Create: `app/src/components/DashboardShell.tsx`
- Create: `app/src/components/FileUploadPanel.tsx`
- Create: `app/src/components/KpiSummary.tsx`
- Create: `app/src/components/MonthlyTrendChart.tsx`
- Create: `app/src/components/PlatformComparisonChart.tsx`
- Create: `app/src/components/ProductMarginTable.tsx`
- Create: `app/src/components/ValidationPanel.tsx`
- Create: `app/src/components/DownloadPanel.tsx`

- [ ] **Step 1: 화면 레이아웃 구현**

첫 화면은 랜딩 페이지가 아니라 실제 대시보드 화면으로 만든다. 상단에는 업로드/샘플 데이터 패널, 그 아래에 KPI와 차트, 테이블, 경고 패널을 배치한다.

- [ ] **Step 2: 업로드 패널 구현**

4개 파일 입력을 제공한다.

```text
스마트스토어 CSV
쿠팡 CSV
상품 원가표
수수료 설정표
```

샘플 데이터로 체험하기 버튼을 제공한다.

- [ ] **Step 3: KPI 카드 구현**

다음 값을 표시한다.

```text
총매출
순이익
평균 마진율
적자 상품 수
계산 제외 주문 수
원가 미등록 주문 수
```

- [ ] **Step 4: 차트 구현**

Recharts로 다음 차트를 만든다.

```text
월별 매출/순이익 라인 또는 바 차트
플랫폼별 매출/순이익 비교 바 차트
```

- [ ] **Step 5: 상품별 마진 테이블 구현**

테이블 컬럼:

```text
상품명
옵션명
플랫폼
판매수량
매출
원가
수수료
배송비
순이익
마진율
상태
```

정렬은 순이익, 마진율, 판매수량 기준을 우선 구현한다.

- [ ] **Step 6: 경고 패널 구현**

`ValidationReport`를 사용해 원가 미등록, 배송비 누락, 적자 TOP 10, 저마진 TOP 10을 보여준다.

- [ ] **Step 7: 반응형 확인**

Run:

```bash
cd app
npm run dev
```

Expected:

```text
데스크톱에서 대시보드가 한 화면에 업무 도구처럼 보이고, 모바일에서는 세로 스크롤로 겹침 없이 확인된다.
```

### Task 10: 엑셀 다운로드 구현

**Files:**
- Create: `app/src/lib/domain/exportWorkbook.ts`
- Modify: `app/src/components/DownloadPanel.tsx`

- [ ] **Step 1: 워크북 생성 함수 구현**

ExcelJS로 다음 시트를 만든다.

```text
표준 주문 데이터
상품별 마진 분석
월별 요약
플랫폼별 요약
검증 경고
```

- [ ] **Step 2: 다운로드 버튼 연결**

버튼 3개를 제공한다.

```text
전체 리포트 다운로드
상품별 마진 분석 다운로드
월별 요약 다운로드
```

- [ ] **Step 3: 파일명 규칙 적용**

다운로드 파일명:

```text
seller-margin-report-2026-sample.xlsx
product-margin-analysis-2026-sample.xlsx
monthly-profit-summary-2026-sample.xlsx
```

- [ ] **Step 4: 다운로드 수동 검증**

브라우저에서 다운로드 후 엑셀 파일을 열어 시트명과 주요 숫자가 대시보드와 일치하는지 확인한다.

### Task 11: 품질 검증과 포트폴리오 산출

**Files:**
- Create: `outputs/screenshots/`
- Create: `portfolio/README.md`
- Create: `kmong-page/draft.md`

- [ ] **Step 1: 전체 테스트 실행**

Run:

```bash
cd app
npm test
```

Expected:

```text
모든 테스트가 통과한다.
```

- [ ] **Step 2: 빌드 실행**

Run:

```bash
cd app
npm run build
```

Expected:

```text
Next.js production build가 성공한다.
```

- [ ] **Step 3: 화면 캡처 4장 제작**

필수 캡처:

```text
업로드/샘플 데이터 화면
요약 대시보드
상품별 마진 분석 테이블
경고/검증 화면
엑셀 다운로드 영역
```

- [ ] **Step 4: 포트폴리오 README 작성**

`portfolio/README.md`에는 다음을 넣는다.

```text
프로젝트 목적
대상 고객
해결하는 문제
주요 기능
사용 기술
데모 흐름
제외 범위
확장 가능 항목
```

- [ ] **Step 5: 크몽 상세페이지 초안 작성**

`kmong-page/draft.md`에는 다음을 넣는다.

```text
대표 문구
문제 제기
해결 방식
제공 결과물
고객 준비물
패키지 구성
추가 개발 가능 항목
```

## 4. 개발 순서 요약

권장 실행 순서는 다음과 같다.

1. 샘플 CSV 작성
2. Next.js 앱 초기화
3. 도메인 타입 정의
4. CSV 표준화 테스트와 구현
5. 마진 계산 테스트와 구현
6. 집계 테스트와 구현
7. 검증 경고 테스트와 구현
8. 샘플 데이터 로더 구현
9. 대시보드 UI 구현
10. 엑셀 다운로드 구현
11. 테스트, 빌드, 캡처, 포트폴리오 문서 작성

## 5. 최종 완료 기준

1차 구현이 완료되려면 다음을 모두 만족해야 한다.

- `샘플 데이터로 체험하기`만 눌러 전체 대시보드가 채워진다.
- 스마트스토어와 쿠팡 CSV가 하나의 표준 주문 데이터로 합쳐진다.
- 상품별 순이익, 마진율, 상태가 계산된다.
- 정상, 저마진, 적자, 원가 미등록, 계산 제외 케이스가 화면에 모두 보인다.
- 월별 차트와 플랫폼별 차트가 표시된다.
- 상품별 테이블 정렬이 동작한다.
- 엑셀 다운로드 파일에 표준 주문 데이터, 상품별 분석, 월별 요약이 들어간다.
- `npm test`와 `npm run build`가 통과한다.
- 크몽 상세페이지에 사용할 캡처 4장 이상을 만들 수 있다.

## 6. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| 실제 플랫폼 CSV와 샘플 CSV가 다를 수 있음 | 포트폴리오에서는 샘플 형식 기준이라고 명시하고, 고객 파일 맞춤 매핑을 추가 개발 항목으로 둔다 |
| 원가 매칭이 상품명/옵션명에 의존함 | 첫 버전은 단순 매칭으로 구현하고, 향후 상품코드 매핑 기능으로 확장한다 |
| 수수료 계산이 실제 정산과 다를 수 있음 | 세무/정산 확정용이 아니라 마진 분석 자동화 데모임을 명시한다 |
| 대시보드가 마케팅 페이지처럼 보일 수 있음 | 첫 화면을 실제 업무 대시보드로 구성하고 카드/차트/테이블 밀도를 유지한다 |
| 기능 범위가 커질 수 있음 | 1차에서는 API, 로그인, 자사몰, 세무 처리, 알림 기능을 제외한다 |
