import React from "react";
import { Slider } from "dough-control";

/* The ★ marks the recommended value. These stories deliberately sit the
   handle AWAY from the star so both are visible — when they coincide the
   knob covers the marker. */
export const Hydration = () => {
  const [v, setV] = React.useState(68);
  return (
    <Slider
      label="Hydration"
      value={v}
      onChange={setV}
      min={55}
      max={75}
      unit=" %"
      star={62}
      starTitle="Recommended for Tipo 00 at 24 h"
    />
  );
};

export const KitchenTemperature = () => {
  const [v, setV] = React.useState(26);
  return (
    <Slider
      label="Kitchen temperature"
      value={v}
      onChange={setV}
      min={14}
      max={30}
      unit=" °C"
      star={21}
    />
  );
};

export const BallWeight = () => {
  const [v, setV] = React.useState(200);
  return (
    <Slider
      label="Ball weight"
      value={v}
      onChange={setV}
      min={180}
      max={320}
      step={5}
      display={`${v} g`}
      star={255}
      starTitle="Classic 30 cm Neapolitan"
    />
  );
};

export const NoRecommendation = () => {
  const [v, setV] = React.useState(2.8);
  return (
    <Slider
      label="Salt"
      value={v}
      onChange={setV}
      min={1.5}
      max={3.5}
      step={0.1}
      display={`${v.toFixed(1)} %`}
    />
  );
};
