import React from "react";
import { Callout, Card } from "dough-control";

export const Troubleshooter = () => (
  <Card label="Help!">
    <Callout
      title="My dough tears when I open it"
      quick="Let the balls rest 30 more minutes at room temperature, then open them again."
      forever="Under-developed gluten or too little bulk — add a coil fold and give the bulk its full window."
    />
    <Callout
      title="The base is pale and doesn't leopard"
      quick="Preheat 5 minutes longer and launch onto a fully saturated stone."
      forever="Your oven never reaches launch temperature — measure the stone with an IR gun before every bake."
    />
  </Card>
);

export const SingleIssue = () => (
  <Callout
    title="The dough over-proofed in the fridge"
    quick="Reball now and bake within the hour."
    forever="Cut the yeast dose — at 4 °C a 48 h hold needs roughly half of a 24 h dose."
  />
);

export const QuickOnly = () => (
  <Callout
    title="The balls stuck together in the box"
    quick="Flour the scraper generously and cut them apart in one motion."
  />
);
