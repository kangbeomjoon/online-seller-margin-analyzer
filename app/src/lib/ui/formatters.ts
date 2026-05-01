export function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatCount(value: number): string {
  return value.toLocaleString("ko-KR");
}

export function translatePlatform(platform: string): string {
  switch (platform) {
    case "smartstore":
      return "스마트스토어";
    case "coupang":
      return "쿠팡";
    default:
      return platform;
  }
}

export function translateProfitStatus(status: string): string {
  switch (status) {
    case "healthy":
      return "정상";
    case "low_margin":
      return "저마진";
    case "loss":
      return "적자";
    case "missing_cost":
      return "원가 미등록";
    case "excluded":
      return "계산 제외";
    default:
      return status;
  }
}
