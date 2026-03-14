export const MetricTypes = ["distance", "temperature"] as const;
export type MetricType = (typeof MetricTypes)[number];

export const DistanceUnits = ["meter", "centimeter", "inch", "feet", "yard"] as const;
export const TemperatureUnits = ["C", "F", "K"] as const;

export type DistanceUnit = (typeof DistanceUnits)[number];
export type TemperatureUnit = (typeof TemperatureUnits)[number];
export type MetricUnit = DistanceUnit | TemperatureUnit;

export interface UnitConverter {
	toBase: (v: number) => number;
	fromBase: (v: number) => number;
}

export const unitsByType: Record<MetricType, readonly string[]> = {
	distance: DistanceUnits,
	temperature: TemperatureUnits,
};

export const baseUnits: Record<MetricType, string> = {
	distance: "meter",
	temperature: "C",
};
