export interface WeightEntry {
  id: string
  /** Weight in kilograms */
  weight: number
  /** ISO date string: YYYY-MM-DD */
  date: string
  note?: string
  createdAt?: string
}
