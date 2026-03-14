import { convert, isValidUnit } from "@/common/utils/unit/converters";

describe("Unit Conversion", () => {
	describe("distance conversions", () => {
		it("converts centimeters to meters", () => {
			expect(convert(100, "centimeter", "meter")).toBeCloseTo(1.0);
		});

		it("converts meters to centimeters", () => {
			expect(convert(1, "meter", "centimeter")).toBeCloseTo(100);
		});

		it("converts inches to meters", () => {
			expect(convert(1, "inch", "meter")).toBeCloseTo(0.0254);
		});

		it("converts feet to meters", () => {
			expect(convert(1, "feet", "meter")).toBeCloseTo(0.3048);
		});

		it("converts yards to meters", () => {
			expect(convert(1, "yard", "meter")).toBeCloseTo(0.9144);
		});

		it("converts between non-base units (feet to inch)", () => {
			expect(convert(1, "feet", "inch")).toBeCloseTo(12);
		});

		it("returns same value when units are identical", () => {
			expect(convert(42, "meter", "meter")).toBe(42);
		});
	});

	describe("temperature conversions", () => {
		it("converts Celsius to Fahrenheit", () => {
			expect(convert(0, "C", "F")).toBeCloseTo(32);
			expect(convert(100, "C", "F")).toBeCloseTo(212);
		});

		it("converts Fahrenheit to Celsius", () => {
			expect(convert(32, "F", "C")).toBeCloseTo(0);
			expect(convert(212, "F", "C")).toBeCloseTo(100);
		});

		it("converts Celsius to Kelvin", () => {
			expect(convert(0, "C", "K")).toBeCloseTo(273.15);
		});

		it("converts Kelvin to Celsius", () => {
			expect(convert(273.15, "K", "C")).toBeCloseTo(0);
		});

		it("converts Fahrenheit to Kelvin", () => {
			expect(convert(32, "F", "K")).toBeCloseTo(273.15);
		});
	});

	describe("isValidUnit", () => {
		it("validates distance units", () => {
			expect(isValidUnit("distance", "meter")).toBe(true);
			expect(isValidUnit("distance", "centimeter")).toBe(true);
			expect(isValidUnit("distance", "C")).toBe(false);
		});

		it("validates temperature units", () => {
			expect(isValidUnit("temperature", "C")).toBe(true);
			expect(isValidUnit("temperature", "F")).toBe(true);
			expect(isValidUnit("temperature", "meter")).toBe(false);
		});
	});
});
