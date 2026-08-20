/**
 * BMI — Body Mass Index
 * Formula: weight(kg) / height(m)²
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1))
}

export type BMICategory =
  | 'Underweight'
  | 'Normal weight'
  | 'Overweight'
  | 'Obese'

export function getBMICategory(bmi: number): BMICategory {
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal weight'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

export function getBMICategoryColor(bmi: number): string {
  if (bmi < 18.5) return 'text-blue-500'
  if (bmi < 25) return 'text-green-500'
  if (bmi < 30) return 'text-yellow-500'
  return 'text-red-500'
}
