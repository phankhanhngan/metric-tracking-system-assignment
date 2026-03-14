import { baseUnits, unitsByType, type DistanceUnit, type MetricType, type TemperatureUnit, type UnitConverter } from "./types";

export const distanceConverters: Record<DistanceUnit, UnitConverter> = {
	meter: { toBase: (v) => v, fromBase: (v) => v },
	centimeter: { toBase: (v) => v / 100, fromBase: (v) => v * 100 },
	inch: { toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
	feet: { toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
	yard: { toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
};

export const temperatureConverters: Record<TemperatureUnit, UnitConverter> = {
	C: { toBase: (v) => v, fromBase: (v) => v },
	F: { toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
	K: { toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
};

export const allConverters: Record<string, UnitConverter> = {
	...distanceConverters,
	...temperatureConverters,
};

export function convert(value: number, fromUnit: string, toUnit: string): number {
	if (fromUnit === toUnit) return value;
	const from = allConverters[fromUnit];
	const to = allConverters[toUnit];
	const base = from.toBase(value);
	return to.fromBase(base);
}

export function toBase(value: number, unit: string): number {
	return allConverters[unit].toBase(value);
}

export function fromBase(value: number, unit: string): number {
	return allConverters[unit].fromBase(value);
}

export function isValidUnit(type: MetricType, unit: string): boolean {
	return unitsByType[type].includes(unit);
}

export function getBaseUnit(type: MetricType): string {
	return baseUnits[type];
}
