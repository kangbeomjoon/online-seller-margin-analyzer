import { mapCoupangOrder, mapSmartstoreOrder } from "../csv/platformMappers";
import type {
  RawCoupangOrder,
  RawSmartstoreOrder,
  StandardOrder,
} from "./types";

interface NormalizeOrdersInput {
  smartstoreRows: RawSmartstoreOrder[];
  coupangRows: RawCoupangOrder[];
}

export function normalizeOrders({
  smartstoreRows,
  coupangRows,
}: NormalizeOrdersInput): StandardOrder[] {
  return [
    ...smartstoreRows.map(mapSmartstoreOrder),
    ...coupangRows.map(mapCoupangOrder),
  ];
}
