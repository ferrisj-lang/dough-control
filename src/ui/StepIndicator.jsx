import React from "react";

/**
 * StepIndicator — the wizard's numbered dots joined by lines. Past steps
 * render basil `done`, the current step ember `on`, future steps faint.
 * Steps at index > current are `off` (not yet reachable).
 *
 * Props: steps (array of labels, tooltips only), current (index),
 *        onStep(index), className.
 */
export default function StepIndicator({ steps, current, onStep, className = "" }) {
  return (
    <div className={`stepper ${className}`.trim()}>
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "on" : "off";
        const reachable = i <= current;
        return (
          <React.Fragment key={i}>
            {i > 0 && <div className="sline" />}
            <button
              className={`sdot ${state}`}
              onClick={reachable && onStep ? () => onStep(i) : undefined}
              disabled={!reachable}
              title={typeof label === "string" ? label : undefined}
              aria-current={i === current ? "step" : undefined}
            >
              {i < current ? "✓" : i + 1}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
