import type { AdventureContextCondition, AdventureContextConditionTarget, AdventureContextDefinition, AdventureContextState, CalendarProject, LocaleCode } from "../domain/types";

const ctx = (
  id: string,
  category: AdventureContextDefinition["category"],
  icon: string,
  fr: string,
  en: string,
  descriptionFr: string,
  descriptionEn: string
): AdventureContextDefinition => ({
  id,
  label: { fr, en },
  description: { fr: descriptionFr, en: descriptionEn },
  icon,
  category,
  enabled: true
});

export const DEFAULT_ADVENTURE_CONTEXTS: AdventureContextDefinition[] = [
  ctx("road", "location", "🛣️", "Route", "Road", "Les PJ se déplacent ou se trouvent sur une route, une piste ou un chemin entretenu.", "The party is travelling on or standing on a road, trail, or maintained path."),
  ctx("bridge", "location", "🌉", "Pont", "Bridge", "Les PJ sont sur un pont, une passerelle ou un passage étroit au-dessus d’un obstacle.", "The party is on a bridge, walkway, or narrow crossing above an obstacle."),
  ctx("mountain-pass", "location", "🏔️", "Col de montagne", "Mountain Pass", "Les PJ traversent un col, une crête, une passe ou une zone haute exposée.", "The party is crossing a pass, ridge, mountain route, or exposed high ground."),
  ctx("tall-grass", "location", "🌾", "Hautes herbes", "Tall Grass", "Les PJ sont dans des herbes hautes, broussailles, steppes ou zones où la végétation cache le sol.", "The party is in tall grass, brush, steppe, or vegetation that hides the ground."),
  ctx("woods", "location", "🌲", "Bois / forêt", "Woods / Forest", "Les PJ sont dans un bois, une forêt, une lisière ou une zone arborée.", "The party is in woods, forest, forest edge, or a wooded area."),
  ctx("meadow", "location", "🌼", "Prairie", "Meadow", "Les PJ sont dans une prairie, une clairière, des pâturages ou une zone herbeuse ouverte.", "The party is in a meadow, clearing, pasture, or open grassy area."),
  ctx("river-ford", "location", "🏞️", "Rivière / gué", "River / Ford", "Les PJ sont près d’une rivière, d’un gué, d’une berge, d’un ruisseau ou d’un passage d’eau.", "The party is near a river, ford, bank, stream, or water crossing."),
  ctx("on-water", "location", "🛶", "Sur l’eau", "On the Water", "Les PJ voyagent ou agissent sur l’eau : barque, radeau, bateau, lac ou rivière.", "The party is travelling or acting on water: boat, raft, vessel, lake, or river."),
  ctx("marsh", "location", "🪷", "Marais", "Marsh", "Les PJ sont dans un marais, une tourbière, une zone humide ou un terrain détrempé.", "The party is in a marsh, bog, wetland, or soaked ground."),
  ctx("outdoor-ruins", "location", "🏚️", "Ruines extérieures", "Outdoor Ruins", "Les PJ explorent des ruines à ciel ouvert, vieux murs, tours effondrées ou vestiges exposés.", "The party is exploring outdoor ruins, old walls, collapsed towers, or exposed remains."),
  ctx("dungeon-interior", "location", "🏰", "Donjon / intérieur", "Dungeon / Interior", "Les PJ sont dans un donjon, bâtiment, ruine intérieure, fort, cave aménagée ou espace clos.", "The party is inside a dungeon, building, interior ruin, fort, worked cellar, or enclosed space."),
  ctx("cave-underground", "location", "🕳️", "Grotte / souterrain", "Cave / Underground", "Les PJ sont dans une grotte, caverne, tunnel naturel, mine ou souterrain humide.", "The party is in a cave, cavern, natural tunnel, mine, or damp underground area."),
  ctx("city", "location", "🏙️", "Ville", "City", "Les PJ sont dans une ville, un quartier urbain, un marché important ou une cité fortifiée.", "The party is in a city, urban district, major market, or fortified settlement."),
  ctx("village", "location", "🏘️", "Village", "Village", "Les PJ sont dans un village, hameau, avant-poste habité ou petit regroupement rural.", "The party is in a village, hamlet, inhabited outpost, or small rural settlement."),
  ctx("camp", "location", "⛺", "Campement", "Camp", "Les PJ sont dans leur campement, installent le camp, montent la garde ou se reposent dehors.", "The party is in camp, setting up camp, keeping watch, or resting outdoors."),
  ctx("farm-fields", "location", "🌽", "Ferme / champs", "Farm / Fields", "Les PJ sont dans une ferme, des cultures, des champs, des pâturages ou près d’un élevage.", "The party is in a farm, crops, fields, pastureland, or near livestock."),
  ctx("kingdom-road-worksite", "location", "🛠️", "Route de royaume / chantier", "Kingdom Road / Worksite", "Les PJ sont près d’une route de royaume, d’un chantier, d’un pont en construction ou de travaux d’infrastructure.", "The party is near a kingdom road, worksite, bridge construction, or infrastructure project."),
  ctx("travel", "activity", "🧭", "Voyage", "Travel", "Les PJ sont en déplacement sur une longue distance.", "The party is travelling over a long distance."),
  ctx("exploration", "activity", "🔎", "Exploration", "Exploration", "Les PJ explorent activement une zone, un hexagone, un lieu inconnu ou un terrain dangereux.", "The party is actively exploring an area, hex, unknown place, or dangerous terrain."),
  ctx("hunting", "activity", "🏹", "Chasse", "Hunting", "Les PJ cherchent, traquent ou chassent du gibier.", "The party is searching for, stalking, or hunting game."),
  ctx("tracking", "activity", "🐾", "Pistage", "Tracking", "Les PJ suivent une piste, recherchent des traces ou tentent de retrouver une créature.", "The party is following a trail, searching for tracks, or trying to find a creature."),
  ctx("camping-activity", "activity", "🔥", "Activité de campement", "Camping Activity", "Les PJ montent le camp, entretiennent le feu, cuisinent, réparent ou organisent le repos.", "The party is setting camp, maintaining fire, cooking, repairing, or organizing rest."),
  ctx("combat", "activity", "⚔️", "Combat", "Combat", "Les PJ sont en combat ou dans une scène tactique active.", "The party is in combat or an active tactical scene."),
  ctx("chase", "activity", "🏃", "Fuite / poursuite", "Escape / Chase", "Les PJ fuient, poursuivent une cible ou sont poursuivis.", "The party is fleeing, chasing a target, or being chased."),
  ctx("crossing", "activity", "🌁", "Traversée", "Crossing", "Les PJ traversent un obstacle : gué, pont, ravin, rivière, col ou passage dangereux.", "The party is crossing an obstacle: ford, bridge, ravine, river, pass, or dangerous passage."),
  ctx("rest", "activity", "💤", "Repos", "Rest", "Les PJ se reposent, dorment, récupèrent ou passent une période calme.", "The party is resting, sleeping, recovering, or spending a quiet period."),
  ctx("convoy-travel", "activity", "🛞", "Voyage en convoi", "Convoy Travel", "Les PJ voyagent avec chariot, montures, caravane, ressources ou groupe à protéger.", "The party travels with carts, mounts, caravan, supplies, or a group to protect."),
  ctx("navigation", "activity", "⛵", "Navigation", "Navigation", "Les PJ naviguent, manœuvrent une embarcation ou suivent un cours d’eau.", "The party is navigating, handling a vessel, or following a waterway."),
  ctx("stealth-infiltration", "activity", "🥷", "Infiltration / discrétion", "Infiltration / Stealth", "Les PJ se déplacent discrètement, infiltrent un lieu ou cherchent à éviter d’être repérés.", "The party is moving stealthily, infiltrating a place, or trying to avoid detection."),
  ctx("hexploration", "kingmaker", "🗺️", "Hexploration", "Hexploration", "Les PJ explorent un hexagone, cartographient, découvrent un lieu ou parcourent les Terres Volées.", "The party is exploring a hex, mapping, discovering a location, or crossing the Stolen Lands."),
  ctx("kingdom-management", "kingmaker", "👑", "Gestion de royaume", "Kingdom Management", "La scène concerne le royaume, ses routes, ses ressources, ses habitants ou ses problèmes administratifs.", "The scene concerns the kingdom, its roads, resources, people, or administrative issues."),
  ctx("outpost", "kingmaker", "🏕️", "Avant-poste", "Outpost", "Les PJ sont dans ou près d’un avant-poste, relais, camp fortifié ou position avancée.", "The party is in or near an outpost, waystation, fortified camp, or forward position."),
  ctx("controlled-territory", "kingmaker", "🛡️", "Territoire contrôlé", "Controlled Territory", "Les PJ se trouvent dans une zone contrôlée, sécurisée ou administrée par leur royaume.", "The party is in an area controlled, secured, or administered by their kingdom."),
  ctx("wild-territory", "kingmaker", "🐺", "Territoire sauvage", "Wild Territory", "Les PJ se trouvent dans une zone sauvage, peu connue, non pacifiée ou dangereuse.", "The party is in a wild, little-known, unsettled, or dangerous area."),
  ctx("fey-zone", "kingmaker", "🧚", "Zone féerique", "Fey Zone", "Les PJ sont dans une zone influencée par les fées, le Premier Monde ou une magie étrange.", "The party is in an area influenced by fey, the First World, or strange magic."),
  ctx("cursed-zone", "kingmaker", "☠️", "Zone maudite", "Cursed Zone", "Les PJ sont dans une zone maudite, anormale, hantée ou marquée par une influence hostile.", "The party is in a cursed, abnormal, haunted, or hostile-influenced area."),
  ctx("frontier-unknown-lands", "kingmaker", "🧭", "Frontière / terres inconnues", "Frontier / Unknown Lands", "Les PJ sont aux limites du territoire connu, en terres inconnues ou dans une zone mal cartographiée.", "The party is on the edge of known territory, in unknown lands, or in a poorly mapped area.")
];

const clone = <T>(value: T): T => structuredClone(value);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const categories: AdventureContextDefinition["category"][] = ["location", "activity", "kingmaker"];

const sanitizeDefinition = (value: unknown): AdventureContextDefinition | undefined => {
  if (!isRecord(value) || typeof value.id !== "string" || value.id.trim() === "") return undefined;
  const label = isRecord(value.label) ? value.label : {};
  const description = isRecord(value.description) ? value.description : undefined;
  const category = categories.includes(value.category as AdventureContextDefinition["category"]) ? value.category as AdventureContextDefinition["category"] : "location";
  return {
    id: value.id.trim(),
    label: {
      fr: typeof label.fr === "string" && label.fr.trim() ? label.fr : value.id.trim(),
      en: typeof label.en === "string" && label.en.trim() ? label.en : value.id.trim()
    },
    ...(description ? { description: {
      fr: typeof description.fr === "string" ? description.fr : "",
      en: typeof description.en === "string" ? description.en : ""
    } } : {}),
    icon: typeof value.icon === "string" && value.icon.trim() ? value.icon : "🏷️",
    category,
    enabled: typeof value.enabled === "boolean" ? value.enabled : true
  };
};

const mergeDefaultDefinition = (existing: AdventureContextDefinition, fallback: AdventureContextDefinition): AdventureContextDefinition => ({
  ...existing,
  label: {
    fr: existing.label?.fr || fallback.label.fr,
    en: existing.label?.en || fallback.label.en
  },
  description: {
    fr: existing.description?.fr || fallback.description?.fr || "",
    en: existing.description?.en || fallback.description?.en || ""
  },
  icon: existing.icon || fallback.icon,
  category: existing.category || fallback.category,
  enabled: typeof existing.enabled === "boolean" ? existing.enabled : fallback.enabled
});

export const createDefaultAdventureContext = (): AdventureContextState => ({
  primaryContextId: null,
  secondaryContextIds: [],
  availableContexts: clone(DEFAULT_ADVENTURE_CONTEXTS)
});

export const normalizeAdventureContext = (input: unknown): AdventureContextState => {
  const source = isRecord(input) ? input : {};
  const definitions = Array.isArray(source.availableContexts) ? source.availableContexts.map(sanitizeDefinition).filter((item): item is AdventureContextDefinition => Boolean(item)) : [];
  const byId = new Map<string, AdventureContextDefinition>();
  for (const definition of definitions) byId.set(definition.id, definition);
  for (const definition of DEFAULT_ADVENTURE_CONTEXTS) {
    const existing = byId.get(definition.id);
    byId.set(definition.id, existing ? mergeDefaultDefinition(existing, definition) : clone(definition));
  }
  const availableContexts = Array.from(byId.values());
  const validIds = new Set(availableContexts.map((definition) => definition.id));
  const primaryContextId = typeof source.primaryContextId === "string" && validIds.has(source.primaryContextId) ? source.primaryContextId : null;
  const secondaryContextIds = Array.isArray(source.secondaryContextIds)
    ? Array.from(new Set(source.secondaryContextIds.filter((id): id is string => typeof id === "string" && validIds.has(id) && id !== primaryContextId)))
    : [];
  return { primaryContextId, secondaryContextIds, availableContexts };
};

export const ensureAdventureContext = (project: CalendarProject): CalendarProject => ({
  ...project,
  adventureContext: normalizeAdventureContext(project.adventureContext)
});

export const getAdventureContextLabel = (definition: AdventureContextDefinition, locale: LocaleCode): string => definition.label[locale] || definition.label.fr || definition.label.en || definition.id;

export const getAdventureContextById = (project: CalendarProject, id: string): AdventureContextDefinition | undefined =>
  normalizeAdventureContext(project.adventureContext).availableContexts.find((definition) => definition.id === id);

export const getAdventureContextConditionTarget = (condition: Pick<AdventureContextCondition, "target" | "includePrimary" | "includeSecondary">): AdventureContextConditionTarget => {
  if (condition.target === "allContexts" || condition.target === "primaryOnly" || condition.target === "secondaryOnly" || condition.target === "primaryAndAnySecondary") return condition.target;
  if (condition.includePrimary === true && condition.includeSecondary === false) return "primaryOnly";
  if (condition.includePrimary === false && condition.includeSecondary === true) return "secondaryOnly";
  return "allContexts";
};

export const getActiveAdventureContextIds = (
  project: Pick<CalendarProject, "adventureContext">,
  includePrimary = true,
  includeSecondary = true
): string[] => {
  const state = normalizeAdventureContext(project.adventureContext);
  const ids: string[] = [];
  if (includePrimary && state.primaryContextId) ids.push(state.primaryContextId);
  if (includeSecondary) ids.push(...state.secondaryContextIds);
  return Array.from(new Set(ids));
};

const evaluateMode = (mode: AdventureContextCondition["mode"], activeIds: string[], requiredIds: string[]): boolean => {
  const active = new Set(activeIds);
  const required = Array.from(new Set(requiredIds));
  if (required.length === 0) return mode === "none";
  if (mode === "all") return required.every((id) => active.has(id));
  if (mode === "none") return required.every((id) => !active.has(id));
  return required.some((id) => active.has(id));
};

export const getAdventureContextConditionDetails = (project: Pick<CalendarProject, "adventureContext">, condition: AdventureContextCondition) => {
  const state = normalizeAdventureContext(project.adventureContext);
  const target = getAdventureContextConditionTarget(condition);
  const required = Array.from(new Set(condition.contextIds ?? []));
  const primaryMatches = Boolean(state.primaryContextId && required.includes(state.primaryContextId));
  const secondaryMatches = state.secondaryContextIds.some((id) => required.includes(id));
  const activeIds = target === "primaryOnly"
    ? (state.primaryContextId ? [state.primaryContextId] : [])
    : target === "secondaryOnly"
      ? state.secondaryContextIds
      : getActiveAdventureContextIds({ adventureContext: state }, true, true);
  const result = target === "primaryAndAnySecondary"
    ? primaryMatches && secondaryMatches
    : evaluateMode(condition.mode, activeIds, required);
  return {
    target,
    mode: target === "primaryAndAnySecondary" ? "any" as const : condition.mode,
    primaryContextId: state.primaryContextId,
    secondaryContextIds: state.secondaryContextIds,
    contextIds: required,
    primaryMatches,
    secondaryMatches,
    result
  };
};

export const isAdventureContextConditionMet = (project: Pick<CalendarProject, "adventureContext">, condition: AdventureContextCondition): boolean =>
  getAdventureContextConditionDetails(project, condition).result;

export const setPrimaryAdventureContext = (project: CalendarProject, contextId: string | null): CalendarProject => {
  const state = normalizeAdventureContext(project.adventureContext);
  const validIds = new Set(state.availableContexts.map((definition) => definition.id));
  const primaryContextId = contextId && validIds.has(contextId) ? contextId : null;
  return { ...project, adventureContext: { ...state, primaryContextId, secondaryContextIds: state.secondaryContextIds.filter((id) => id !== primaryContextId) } };
};

export const setSecondaryAdventureContexts = (project: CalendarProject, contextIds: string[]): CalendarProject => {
  const state = normalizeAdventureContext(project.adventureContext);
  const validIds = new Set(state.availableContexts.map((definition) => definition.id));
  return { ...project, adventureContext: { ...state, secondaryContextIds: Array.from(new Set(contextIds.filter((id) => validIds.has(id) && id !== state.primaryContextId))) } };
};
