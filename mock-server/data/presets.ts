export type DataPreset = 'default' | 'empty'

export interface PresetConfig {
  name: string
  description: string
  balance: number
  portfolioStocks: number
  minQuantity: number
  maxQuantity: number
}

export const PRESETS: Record<DataPreset, PresetConfig> = {
  default: {
    name: 'default',
    description: 'Main development preset with random portfolio',
    balance: 50000,
    portfolioStocks: 10,
    minQuantity: 10,
    maxQuantity: 100,
  },
  empty: {
    name: 'empty',
    description: 'Empty portfolio for testing first purchase',
    balance: 50000,
    portfolioStocks: 0,
    minQuantity: 0,
    maxQuantity: 0,
  },
}

export function getPreset(): DataPreset {
  const preset = process.env.DATA_PRESET as DataPreset
  return preset && PRESETS[preset] ? preset : 'default'
}
