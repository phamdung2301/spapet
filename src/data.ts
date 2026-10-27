export type PetType = "dog" | "cat";
export type Size = "S" | "M" | "L" | "XL";
export type Coat = "short" | "long" | "curly";
export type StepId = "wash" | "dry" | "cut" | "perfume";
export type AddonId = "teeth" | "nails" | "flea" | "perfume";

export interface Step {
  id: StepId;
  index: string;
  label: string;
  title: string;
  detail: string;
  tool: string;
  minutes: number;
  stageNote: string;
}

export const STEPS: Step[] = [
  {
    id: "wash",
    index: "01",
    label: "Wash",
    title: "Warm wash in the round tub",
    detail:
      "A warm soak with a gentle, pet-safe shampoo. The shower arm runs, bubbles rise in the tub, and the pet moves into the tub on the 3D stage.",
    tool: "Round tub + shower arm",
    minutes: 25,
    stageNote: "Bubbles appear, shower droplets fall, pet sits in the tub.",
  },
  {
    id: "dry",
    index: "02",
    label: "Dry",
    title: "Low-heat drying on the table",
    detail:
      "Towel first, then a low-heat dryer held at a safe distance. Air particles stream from the dryer nozzle on the stage while the coat settles.",
    tool: "Low-heat dryer",
    minutes: 20,
    stageNote: "Dryer air particles stream, pet moves to the grooming table.",
  },
  {
    id: "cut",
    index: "03",
    label: "Cut",
    title: "Coat shaping, face and paws",
    detail:
      "Scissors and comb work around the face, paws and coat outline. Small clippings drift down on the stage and the coat shape visibly tightens.",
    tool: "Scissors + comb",
    minutes: 30,
    stageNote: "Scissors appear by the table, clippings fall, coat tightens.",
  },
  {
    id: "perfume",
    index: "04",
    label: "Perfume",
    title: "Finishing mist and bow",
    detail:
      "A light finishing mist, a final brush-through and a bow. Perfume sparkles change colour on the stage when the perfume add-on is selected.",
    tool: "Finishing mist",
    minutes: 10,
    stageNote: "Perfume sparkles glow around the pet on the table.",
  },
];

export interface Addon {
  id: AddonId;
  label: string;
  priceK: number;
  minutes: number;
  note: string;
}

export const ADDONS: Addon[] = [
  { id: "teeth", label: "Teeth cleaning", priceK: 80, minutes: 10, note: "Gentle finger-brush clean" },
  { id: "nails", label: "Nail trim + file", priceK: 60, minutes: 10, note: "Trim, file, paw check" },
  { id: "flea", label: "Flea bath", priceK: 120, minutes: 20, note: "Medicated soak, extra rinse" },
  { id: "perfume", label: "Signature perfume", priceK: 50, minutes: 5, note: "Light mist, changes stage sparkles" },
];

export const SIZE_MULT: Record<Size, number> = { S: 1, M: 1.2, L: 1.45, XL: 1.7 };
export const SIZE_MINUTES: Record<Size, number> = { S: 0, M: 10, L: 20, XL: 30 };
export const COAT_EXTRA_K: Record<Coat, number> = { short: 0, long: 90, curly: 60 };
export const COAT_MINUTES: Record<Coat, number> = { short: 0, long: 15, curly: 10 };

export function calcPrice(
  pet: PetType,
  size: Size,
  coat: Coat,
  addons: AddonId[],
): { priceK: number; minutes: number; code: string } {
  const base = pet === "dog" ? 340 : 300;
  const addonList = ADDONS.filter((a) => addons.includes(a.id));
  const priceK = Math.round(base * SIZE_MULT[size]) + COAT_EXTRA_K[coat] + addonList.reduce((s, a) => s + a.priceK, 0);
  const minutes =
    55 + SIZE_MINUTES[size] + COAT_MINUTES[coat] + addonList.reduce((s, a) => s + a.minutes, 0);
  const code = `SPA-${pet === "dog" ? "D" : "C"}-${size}-${coat.toUpperCase()}-${String(addons.length).padStart(2, "0")}`;
  return { priceK, minutes, code };
}

export function formatK(priceK: number): string {
  return `${priceK.toLocaleString("en-US")}k VND`;
}

export interface Groomer {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  years: number;
  note: string;
  unavailable: string[];
}

export const GROOMERS: Groomer[] = [
  {
    id: "mia",
    name: "Mia Tran",
    specialty: "Long coats & poodles",
    rating: 4.9,
    years: 6,
    note: "Slow, patient hand-drying for nervous pets.",
    unavailable: ["17:00"],
  },
  {
    id: "khoa",
    name: "Khoa Le",
    specialty: "Cats & short coats",
    rating: 4.8,
    years: 5,
    note: "Quiet handling, cat-first routine, no rushed drying.",
    unavailable: ["09:00"],
  },
  {
    id: "an",
    name: "An Pham",
    specialty: "Curly coats & de-shedding",
    rating: 4.9,
    years: 8,
    note: "Curly-coat shaping and undercoat removal specialist.",
    unavailable: ["12:00"],
  },
];

export const TIME_SLOTS = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

export interface DayOption {
  iso: string;
  label: string;
}

export function next7Days(): DayOption[] {
  const out: DayOption[] = [];
  const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({ iso: d.toISOString().slice(0, 10), label: i === 0 ? `Today · ${fmt.format(d)}` : fmt.format(d) });
  }
  return out;
}

/** Deterministic demo "full" slots so the picker is never all-free or all-full. */
export function isSlotFull(dayIndex: number, timeIndex: number): boolean {
  return (dayIndex * 2 + timeIndex) % 5 === 0;
}

export interface Booking {
  id: string;
  petName: string;
  code: string;
  groomerName: string;
  dateLabel: string;
  time: string;
  priceK: number;
  minutes: number;
}

export interface Review {
  id: string;
  pet: string;
  owner: string;
  service: string;
  text: string;
  rating: number;
}

export const REVIEWS: Review[] = [
  {
    id: "r1",
    pet: "Banh Mi, Shiba",
    owner: "Linh N.",
    service: "Long-coat wash + cut",
    text: "Banh Mi usually shakes through the whole dryer. Here he came home asleep on the ride back, coat even, no wet ears.",
    rating: 5,
  },
  {
    id: "r2",
    pet: "Miu, British Shorthair",
    owner: "Tuan D.",
    service: "Cat wash, quiet room",
    text: "First salon that did not rush Miu. They booked the quiet room, took 20 minutes longer, and told us exactly what they skipped.",
    rating: 5,
  },
  {
    id: "r3",
    pet: "Coco, Poodle",
    owner: "Hanh P.",
    service: "Curly-coat shaping",
    text: "The curls kept their shape for three weeks. The booking code matched the price at checkout — no surprise add-ons.",
    rating: 5,
  },
  {
    id: "r4",
    pet: "Boba, Golden",
    owner: "Quoc V.",
    service: "De-shed + flea bath",
    text: "Two bags of undercoat out, and the house finally stopped looking like it snowed. Boba asked to go back. Literally pulled toward the door.",
    rating: 4,
  },
  {
    id: "r5",
    pet: "Xiu, Mixed",
    owner: "Mai T.",
    service: "Nail trim + teeth",
    text: "Xiu hates nail day. They split it across the wash and the cut so she never had one long scary block. Small thing, huge difference.",
    rating: 5,
  },
];

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "shedding",
    prompt: "How much does your pet shed at home?",
    options: [
      { id: "low", label: "Barely any" },
      { id: "medium", label: "Noticeable on clothes" },
      { id: "high", label: "Everywhere, every day" },
    ],
  },
  {
    id: "skin",
    prompt: "How sensitive is their skin?",
    options: [
      { id: "normal", label: "Normal, no issues" },
      { id: "sensitive", label: "Itchy or easily irritated" },
    ],
  },
  {
    id: "activity",
    prompt: "How active are they outdoors?",
    options: [
      { id: "calm", label: "Mostly indoors, calm" },
      { id: "active", label: "Daily walks, some mud" },
      { id: "very", label: "Park, beach, mud — all of it" },
    ],
  },
];

export interface QuizResult {
  routine: string;
  addon: AddonId;
  reason: string;
}

export function recommendQuiz(answers: Record<string, string>): QuizResult {
  if (answers.skin === "sensitive") {
    return {
      routine: "Gentle oat wash, low-heat dry, no perfume on skin",
      addon: "teeth",
      reason: "Sensitive skin comes first, so the wash stays gentle and the extra care goes to teeth instead of scent.",
    };
  }
  if (answers.shedding === "high") {
    return {
      routine: "De-shed wash, long dry, twice-weekly brushing at home",
      addon: "flea",
      reason: "Heavy shedding usually hides undercoat — a medicated soak clears it and makes the de-shed last longer.",
    };
  }
  if (answers.activity === "very") {
    return {
      routine: "Full wash after outdoor days, paw wash between visits",
      addon: "nails",
      reason: "Very active pets wear nails unevenly, so a trim + file keeps the wash from being the only thing they get.",
    };
  }
  return {
    routine: "Standard wash, brush-through, finishing mist",
    addon: "perfume",
    reason: "A calm, low-shed coat does not need treatment — a light finishing mist is the right finishing touch.",
  };
}
