import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlayerOverviewCard } from "../PlayerOverviewCard";

const emptyModel = {
  season: undefined,
  biome: undefined,
  weather: undefined,
  moons: []
};

describe("PlayerOverviewCard", () => {
  it("n’affiche pas les fallbacks des blocs désactivés", () => {
    const html = renderToStaticMarkup(createElement(PlayerOverviewCard, {
      locale: "fr",
      model: emptyModel,
      visibleBlocks: { season: false, weather: false, biome: false, moons: false }
    }));

    expect(html).toBe("");
    expect(html).not.toContain("Aucune saison");
    expect(html).not.toContain("Aucune météo");
    expect(html).not.toContain("Aucune lune");
  });

  it("affiche les fallbacks quand les blocs sont autorisés mais sans donnée", () => {
    const html = renderToStaticMarkup(createElement(PlayerOverviewCard, {
      locale: "fr",
      model: emptyModel,
      visibleBlocks: { season: true, weather: true, biome: false, moons: true }
    }));

    expect(html).toContain("Saison");
    expect(html).toContain("Météo");
    expect(html).toContain("Aucune");
    expect(html).toContain("Aucune lune")
    expect(html).not.toContain("Biome actuel");
  });
});
