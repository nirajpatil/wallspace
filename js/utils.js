/**
 * utils.js - Conversion utilities for Wallspace
 *
 * Dependencies: None (but uses wallScale from state.js at runtime)
 *
 * This file provides unit conversion functions for converting between:
 * - Inches and centimeters
 * - Physical units (inches/cm) and screen pixels
 *
 * Key functions:
 * - inchesToCm(inches) - Convert inches to centimeters
 * - cmToInches(cm) - Convert centimeters to inches
 * - unitsToPixels(value, units) - Convert physical units to screen pixels
 * - pixelsToUnits(pixels, units) - Convert screen pixels to physical units
 */

// Convert inches to centimeters
function inchesToCm(inches) {
    return inches * 2.54;
}

// Convert centimeters to inches
function cmToInches(cm) {
    return cm / 2.54;
}

// Convert inches to millimeters
function inchesToMm(inches) {
    return inches * 25.4;
}

// Convert millimeters to inches
function mmToInches(mm) {
    return mm / 25.4;
}

// Convert physical units (inches, cm, or mm) to screen pixels
// Uses wallScale from state.js (pixels per inch)
function unitsToPixels(value, units) {
    // Convert to inches first if needed
    let inches;
    if (units === 'cm') {
        inches = cmToInches(value);
    } else if (units === 'mm') {
        inches = mmToInches(value);
    } else {
        inches = value;
    }
    // Scale based on current wall scale (pixels per inch)
    return inches * wallScale;
}

// Convert screen pixels to physical units (inches, cm, or mm)
// Uses wallScale from state.js (pixels per inch)
function pixelsToUnits(pixels, units) {
    // Convert to inches first
    const inches = pixels / wallScale;
    // Convert to target units
    if (units === 'cm') {
        return inchesToCm(inches);
    } else if (units === 'mm') {
        return inchesToMm(inches);
    } else {
        return inches;
    }
}
