import React from "react";
import { Timeline, TimelineItem } from "dough-control";

export const Standard = () => (
  <Timeline>
    <TimelineItem
      time="Fri 20:00"
      title="Knead"
      desc="Water at 24 °C. Optional 20 min autolyse before the salt."
    />
  </Timeline>
);

export const WithDuration = () => (
  <Timeline>
    <TimelineItem
      time="Sat 06:30"
      dur="12 h"
      title="Cold hold"
      desc="Fridge at 4 °C. This is where the flavour develops."
    />
  </Timeline>
);

export const BakeStep = () => (
  <Timeline>
    <TimelineItem
      bake
      time="Sat 20:00"
      title="🔥 Bake"
      desc="60–90 s per pizza, regular quarter-turns."
    />
  </Timeline>
);

export const Sequence = () => (
  <Timeline>
    <TimelineItem time="18:30" title="Balling (staglio)" desc="4 balls of 255 g." />
    <TimelineItem time="19:00" dur="1 h" title="Final proof" desc="Covered, at room temperature." />
    <TimelineItem bake time="20:00" title="🔥 Bake" desc="60–90 s per pizza." />
  </Timeline>
);
