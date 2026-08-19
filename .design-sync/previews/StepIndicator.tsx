import React from "react";
import { StepIndicator } from "dough-control";

const STEPS = ["Profile", "Dough", "Tools", "Ingredients", "Schedule", "Recipe"];

export const MidWizard = () => {
  const [i, setI] = React.useState(2);
  return <StepIndicator steps={STEPS} current={i} onStep={setI} />;
};

export const FirstStep = () => <StepIndicator steps={STEPS} current={0} />;

export const LastStep = () => <StepIndicator steps={STEPS} current={5} />;

export const ShortWizard = () => (
  <StepIndicator steps={["Profile", "Dough", "Recipe"]} current={1} />
);
