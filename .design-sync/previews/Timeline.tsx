import React from "react";
import { Timeline, TimelineItem, Card } from "dough-control";

export const BakeSchedule = () => (
  <Card label="Your plan — backwards from Sat 20:00">
    <Timeline>
      <TimelineItem
        time="Fri 20:00"
        title="Knead"
        desc="Water at 24 °C. Optional 20 min autolyse before the salt."
      />
      <TimelineItem
        time="Fri 20:30"
        dur="10 h"
        title="Warm bulk"
        desc="At 21 °C until visibly domed. 1–2 coil folds in the first hour."
      />
      <TimelineItem
        time="Sat 06:30"
        dur="12 h"
        title="Cold hold"
        desc="Fridge at 4 °C. This is where the flavour develops."
      />
      <TimelineItem
        time="Sat 18:30"
        title="Balling (staglio)"
        desc="4 balls of 255 g. Tight pirlatura, then rest covered."
      />
      <TimelineItem
        bake
        time="Sat 20:00"
        title="🔥 Bake"
        desc="60–90 s per pizza, regular quarter-turns."
      />
    </Timeline>
  </Card>
);

export const ShortDirect = () => (
  <Timeline>
    <TimelineItem time="14:00" title="Knead" desc="Water at 22 °C." />
    <TimelineItem time="14:20" dur="5 h" title="Bulk" desc="At 21 °C until doubled." />
    <TimelineItem bake time="20:00" title="🔥 Bake" desc="60–90 s per pizza." />
  </Timeline>
);
