import React, { useState } from "react";
import { Input } from "./input";
import { Label } from "./label";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

const ColorPicker = ({ color, onChange, label }: ColorPickerProps) => {
  const [inputColor, setInputColor] = useState(color.startsWith('#') ? color : `#${color}`);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputColor(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputColor(value);
    onChange(value);
  };

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const rgb = hexToRgb(inputColor);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div>
        <input
          type="color"
          value={inputColor}
          onChange={handleColorPickerChange}
          className="h-10 w-full cursor-pointer"
        />
      </div>
    </div>
  );
};

export { ColorPicker };