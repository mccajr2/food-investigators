import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { FoodsClient, SessionsClient } from "@/api";
import type {
  FoodResponse,
  SessionResponse,
  SessionSuggestionResponse,
} from "@/api/types";
import {
  applyPlanSlotChange,
  isEarlyRunNeeded,
  isStretchFamiliarity,
  isSuggestDraftUntouched,
  isTodayOccupied,
  localTodayIsoDate,
  mergeOccupiedDates,
  PlanPage,
  SAFE_STRETCH_PLAN_HINT,
  safeStretchCoachingCopy,
  sameFoodVariantError,
} from "@/components/plan/PlanPage";

const TODAY = "2026-07-15";

const foods: FoodResponse[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
    name: "Apples",
    iconKey: "apple",
    householdId: null,
    system: true,
    sessionEligible: true,
    exposures: [],
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
    name: "Strawberries",
    iconKey: "strawberry",
    householdId: null,
    system: true,
    sessionEligible: true,
    exposures: [],
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13",
    name: "Blueberries",
    iconKey: "blueberry",
    householdId: null,
    system: true,
    sessionEligible: true,
    exposures: [],
  },
];

const sampleSession: SessionResponse = {
  id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  scheduledOn: "2026-07-20",
  status: "planned",
  foods: [
    {
      foodId: foods[0].id,
      name: "Apples",
      iconKey: "apple",
      familiarity: "safe",
      variantNote: "Honeycrisp",
      position: 1,
    },
    {
      foodId: foods[1].id,
      name: "Strawberries",
      iconKey: "strawberry",
      familiarity: "truly_new",
      variantNote: null,
      position: 2,
    },
  ],
  createdAt: "2026-07-15T00:00:00Z",
  updatedAt: "2026-07-15T00:00:00Z",
};

const sampleSuggestion: SessionSuggestionResponse = {
  scheduledOn: "2026-07-16",
  foods: [
    {
      foodId: foods[0].id,
      name: "Apples",
      iconKey: "apple",
      familiarity: "safe",
    },
    {
      foodId: foods[1].id,
      name: "Strawberries",
      iconKey: "strawberry",
      familiarity: "familiar_but_new",
    },
  ],
  rationale: "A calm next night from foods that often work for you.",
  source: "heuristic",
  pacingNote:
    "Keep a calm, balanced night — foods that often work, without rushing.",
  citations: [
    {
      title: "Calm tasting rhythm",
      source: "Family mealtime and exposure guidance for picky eating",
    },
  ],
};

function mockSessionsClient(
  overrides: Partial<SessionsClient> = {},
): SessionsClient {
  return {
    listUpcoming: vi.fn().mockResolvedValue([]),
    listHistory: vi.fn().mockResolvedValue([]),
    suggestNext: vi.fn(),
    downloadHistoryPdf: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    complete: vi.fn(),
    updateParentNote: vi.fn(),
    ...overrides,
  } as SessionsClient;
}

function mockFoodsClient(overrides: Partial<FoodsClient> = {}): FoodsClient {
  return {
    list: vi.fn().mockResolvedValue(foods),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    upsertExposure: vi.fn(),
    clearExposure: vi.fn(),
    ...overrides,
  } as FoodsClient;
}

function renderPlan(
  sessionsClient: SessionsClient,
  foodsClient: FoodsClient = mockFoodsClient(),
  childDisplayName: string | null = null,
) {
  return render(
    <PlanPage
      sessionsClient={sessionsClient}
      foodsClient={foodsClient}
      childDisplayName={childDisplayName}
      todayIso={TODAY}
    />,
  );
}

async function pickCalendarDay(
  user: ReturnType<typeof userEvent.setup>,
  form: HTMLElement,
  dayLabel: RegExp,
) {
  await user.click(within(form).getByRole("button", { name: dayLabel }));
}

async function pickFood(
  user: ReturnType<typeof userEvent.setup>,
  form: HTMLElement,
  slotLabel: string,
  foodName: string,
) {
  await user.click(
    within(form).getByRole("combobox", { name: `${slotLabel} picker` }),
  );
  const list = screen.getByRole("listbox");
  await user.click(within(list).getByText(foodName));
}

describe("PlanPage helpers", () => {
  it("formats local today for date min", () => {
    expect(localTodayIsoDate(new Date("2026-07-22T15:00:00"))).toBe(
      "2026-07-22",
    );
  });

  it("flags future nights as early-run", () => {
    expect(isEarlyRunNeeded("2026-07-20", "2026-07-15")).toBe(true);
    expect(isEarlyRunNeeded("2026-07-15", "2026-07-15")).toBe(false);
    expect(isEarlyRunNeeded("2026-07-14", "2026-07-15")).toBe(false);
  });

  it("merges planned and completed dates for occupancy", () => {
    expect(
      mergeOccupiedDates([{ scheduledOn: "2026-07-20" }], ["2026-07-15"]),
    ).toEqual(expect.arrayContaining(["2026-07-20", "2026-07-15"]));
    expect(isTodayOccupied("2026-07-15", ["2026-07-15", "2026-07-20"])).toBe(
      true,
    );
    expect(isTodayOccupied("2026-07-15", ["2026-07-20"])).toBe(false);
  });

  it("classifies stretch familiarities and coaches safe+stretch mixes", () => {
    expect(isStretchFamiliarity("safe")).toBe(false);
    expect(isStretchFamiliarity("familiar_but_new")).toBe(true);
    expect(isStretchFamiliarity("truly_new")).toBe(true);
    expect(isStretchFamiliarity("retrying")).toBe(true);
    expect(safeStretchCoachingCopy("safe", "familiar_but_new")).toMatch(
      /one safe food and one stretch/i,
    );
    expect(safeStretchCoachingCopy("truly_new", "retrying")).toMatch(
      /Both foods are stretches/i,
    );
    expect(safeStretchCoachingCopy("safe", "safe")).toMatch(/Two safe foods/i);
  });

  it("treats Suggest drafts as untouched only when date and slots match the snapshot", () => {
    const snapshot = {
      scheduledOn: "2026-07-16",
      slot1: {
        foodId: foods[0].id,
        familiarity: "safe" as const,
        variantNote: "",
        inventName: null,
      },
      slot2: {
        foodId: foods[1].id,
        familiarity: "familiar_but_new" as const,
        variantNote: "chips",
        inventName: null,
      },
    };
    expect(isSuggestDraftUntouched(snapshot, snapshot)).toBe(true);
    expect(
      isSuggestDraftUntouched(
        { ...snapshot, scheduledOn: "2026-07-17" },
        snapshot,
      ),
    ).toBe(false);
    expect(
      isSuggestDraftUntouched(
        {
          ...snapshot,
          slot2: { ...snapshot.slot2, variantNote: "rings" },
        },
        snapshot,
      ),
    ).toBe(false);
  });

  it("requires distinct variants when both slots share a food", () => {
    expect(
      sameFoodVariantError(
        {
          foodId: foods[0].id,
          familiarity: "safe",
          variantNote: "A",
          inventName: null,
        },
        {
          foodId: foods[0].id,
          familiarity: "safe",
          variantNote: "B",
          inventName: null,
        },
      ),
    ).toBeNull();
    expect(
      sameFoodVariantError(
        {
          foodId: foods[0].id,
          familiarity: "safe",
          variantNote: "",
          inventName: null,
        },
        {
          foodId: foods[0].id,
          familiarity: "safe",
          variantNote: "B",
          inventName: null,
        },
      ),
    ).toMatch(/brand\/variety/);
    expect(
      sameFoodVariantError(
        {
          foodId: foods[0].id,
          familiarity: "safe",
          variantNote: "Iggy's",
          inventName: null,
        },
        {
          foodId: foods[0].id,
          familiarity: "safe",
          variantNote: "iggy's",
          inventName: null,
        },
      ),
    ).toMatch(/brand\/variety/);
  });

  it("autofills familiarity from household exposures when food or variant changes", () => {
    const catalog: FoodResponse[] = [
      {
        ...foods[0],
        exposures: [
          {
            foodId: foods[0].id,
            variantKey: "bagelsaurus",
            familiarity: "safe",
            source: "manual",
          },
        ],
      },
      foods[1],
    ];
    const empty = {
      foodId: "",
      familiarity: "truly_new" as const,
      variantNote: "",
      inventName: null,
    };
    expect(
      applyPlanSlotChange(
        empty,
        {
          foodId: catalog[0].id,
          familiarity: "truly_new",
          variantNote: "",
          inventName: null,
        },
        catalog,
      ).familiarity,
    ).toBe("familiar_but_new");
    expect(
      applyPlanSlotChange(
        empty,
        {
          foodId: catalog[0].id,
          familiarity: "truly_new",
          variantNote: "Bagelsaurus",
          inventName: null,
        },
        catalog,
      ).familiarity,
    ).toBe("safe");
    expect(
      applyPlanSlotChange(
        empty,
        {
          foodId: catalog[1].id,
          familiarity: "safe",
          variantNote: "",
          inventName: null,
        },
        catalog,
      ).familiarity,
    ).toBe("truly_new");
    // Familiarity-only override is preserved when food/variant unchanged.
    expect(
      applyPlanSlotChange(
        {
          foodId: catalog[0].id,
          familiarity: "safe",
          variantNote: "Bagelsaurus",
          inventName: null,
        },
        {
          foodId: catalog[0].id,
          familiarity: "retrying",
          variantNote: "Bagelsaurus",
          inventName: null,
        },
        catalog,
      ).familiarity,
    ).toBe("retrying");
  });
});

describe("PlanPage", () => {
  it("lists upcoming sessions and empty state", async () => {
    renderPlan(mockSessionsClient());

    expect(
      await screen.findByRole("heading", { name: "Plan" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No planned nights yet/)).toBeInTheDocument();
  });

  it("personalizes empty hint when childDisplayName is set", async () => {
    renderPlan(mockSessionsClient(), mockFoodsClient(), "Alex");

    expect(
      await screen.findByText(
        "No planned nights for Alex yet. Plan one to get started.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Schedule Alex's tasting nights/),
    ).toBeInTheDocument();
  });

  it("disables days before today on the calendar", async () => {
    const user = userEvent.setup();
    renderPlan(mockSessionsClient());
    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    expect(form.querySelector('input[type="date"]')).toBeNull();
    expect(within(form).getByRole("grid")).toBeInTheDocument();

    const pastDay = within(form).getByRole("button", { name: /July 14/i });
    expect(pastDay).toBeDisabled();
    await user.click(pastDay);
    expect(within(form).getByTestId("Date summary")).toHaveTextContent(
      /Pick a night/,
    );
    expect(
      within(form).getByRole("button", { name: /July 15/i }),
    ).not.toBeDisabled();
  });

  it("excludes snacks from food pickers", async () => {
    const user = userEvent.setup();
    const snack: FoodResponse = {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "Salt chips",
      iconKey: "custom_salt_chips",
      householdId: "22222222-2222-2222-2222-222222222222",
      system: false,
      sessionEligible: false,
      exposures: [],
      liked: "like",
      texture: "crunchy",
      tasteNote: "salt & vinegar",
    };
    renderPlan(
      mockSessionsClient(),
      mockFoodsClient({
        list: vi.fn().mockResolvedValue([...foods, snack]),
      }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    await user.click(
      within(form).getByRole("combobox", { name: "Food 1 picker" }),
    );
    const list = screen.getByRole("listbox");
    expect(within(list).getByText("Apples")).toBeInTheDocument();
    expect(within(list).queryByText("Salt chips")).not.toBeInTheDocument();
  });

  it("filters food picker options by typed name", async () => {
    const user = userEvent.setup();
    renderPlan(mockSessionsClient());

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    await user.click(
      within(form).getByRole("combobox", { name: "Food 1 picker" }),
    );
    await user.type(screen.getByLabelText("Food 1 search"), "blue");
    const list = screen.getByRole("listbox");
    expect(within(list).getByText("Blueberries")).toBeInTheDocument();
    expect(within(list).queryByText("Apples")).not.toBeInTheDocument();
    expect(within(list).queryByText("Strawberries")).not.toBeInTheDocument();

    await user.click(within(list).getByText("Blueberries"));
    expect(
      within(form).getByRole("combobox", { name: "Food 1 picker" }),
    ).toHaveTextContent("Blueberries");
  });

  it("creates a planned night with two foods", async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue(sampleSession);
    renderPlan(mockSessionsClient({ create }));

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    const familiarity = within(form).getByLabelText("Food 1 familiarity");
    expect(within(familiarity).getByRole("option", { name: "Safe" })).toHaveValue(
      "safe",
    );
    expect(
      within(familiarity).getByRole("option", { name: "Familiar but new" }),
    ).toHaveValue("familiar_but_new");
    expect(
      within(familiarity).getByRole("option", { name: "Truly new" }),
    ).toHaveValue("truly_new");
    expect(
      within(familiarity).getByRole("option", { name: "Retrying" }),
    ).toHaveValue("retrying");
    expect(within(familiarity).queryByRole("option", { name: "Likes" })).toBeNull();
    expect(familiarity).toHaveValue("truly_new");

    await pickCalendarDay(user, form, /July 20/i);
    await pickFood(user, form, "Food 1", "Apples");
    expect(within(form).getByLabelText("Food 1 familiarity")).toHaveValue(
      "truly_new",
    );
    await user.type(
      within(form).getByLabelText("Food 1 variant note"),
      "Honeycrisp",
    );
    await user.selectOptions(
      within(form).getByLabelText("Food 1 familiarity"),
      "safe",
    );
    await pickFood(user, form, "Food 2", "Strawberries");
    await user.selectOptions(
      within(form).getByLabelText("Food 2 familiarity"),
      "truly_new",
    );
    await user.click(within(form).getByRole("button", { name: "Save night" }));

    expect(create).toHaveBeenCalledWith({
      scheduledOn: "2026-07-20",
      foods: [
        {
          foodId: foods[0].id,
          familiarity: "safe",
          variantNote: "Honeycrisp",
        },
        {
          foodId: foods[1].id,
          familiarity: "truly_new",
          variantNote: null,
        },
      ],
    });
    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument();
  });

  it("autofills safe when picking a known exposure presentation", async () => {
    const user = userEvent.setup();
    const withExposure: FoodResponse[] = [
      {
        ...foods[0],
        exposures: [
          {
            foodId: foods[0].id,
            variantKey: "honeycrisp",
            familiarity: "safe",
            source: "manual",
          },
        ],
      },
      foods[1],
      foods[2],
    ];
    renderPlan(
      mockSessionsClient(),
      mockFoodsClient({ list: vi.fn().mockResolvedValue(withExposure) }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));
    const form = screen.getByRole("form", { name: "Plan a night" });

    await pickFood(user, form, "Food 1", "Apples");
    expect(within(form).getByLabelText("Food 1 familiarity")).toHaveValue(
      "familiar_but_new",
    );
    await user.clear(within(form).getByLabelText("Food 1 variant note"));
    await user.type(
      within(form).getByLabelText("Food 1 variant note"),
      "Honeycrisp",
    );
    expect(within(form).getByLabelText("Food 1 familiarity")).toHaveValue(
      "safe",
    );
  });

  it("nudges optional brand/prep when Retrying is selected", async () => {
    const user = userEvent.setup();
    renderPlan(mockSessionsClient());

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    expect(screen.queryByTestId("Food 1 retrying hint")).not.toBeInTheDocument();

    await user.selectOptions(
      within(form).getByLabelText("Food 1 familiarity"),
      "retrying",
    );

    expect(screen.getByTestId("Food 1 retrying hint")).toHaveTextContent(
      /brand or prep/i,
    );
    expect(within(form).getByLabelText("Food 1 variant note")).not.toBeRequired();
    expect(within(form).getByLabelText("Food 1 variant note")).toHaveAttribute(
      "placeholder",
      expect.stringMatching(/retrying/i),
    );
  });

  it("creates a planned night with safe and retrying familiarity", async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue({
      ...sampleSession,
      foods: [
        {
          ...sampleSession.foods[0],
          familiarity: "safe" as const,
          variantNote: null,
        },
        {
          ...sampleSession.foods[1],
          familiarity: "retrying" as const,
          variantNote: "new brand",
        },
      ],
    });
    renderPlan(mockSessionsClient({ create }));

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    await pickCalendarDay(user, form, /July 20/i);
    await pickFood(user, form, "Food 1", "Apples");
    await user.selectOptions(
      within(form).getByLabelText("Food 1 familiarity"),
      "safe",
    );
    await pickFood(user, form, "Food 2", "Strawberries");
    await user.type(
      within(form).getByLabelText("Food 2 variant note"),
      "new brand",
    );
    await user.selectOptions(
      within(form).getByLabelText("Food 2 familiarity"),
      "retrying",
    );
    await user.click(within(form).getByRole("button", { name: "Save night" }));

    expect(create).toHaveBeenCalledWith({
      scheduledOn: "2026-07-20",
      foods: [
        {
          foodId: foods[0].id,
          familiarity: "safe",
          variantNote: null,
        },
        {
          foodId: foods[1].id,
          familiarity: "retrying",
          variantNote: "new brand",
        },
      ],
    });
    expect(await screen.findByText(/Retrying/)).toBeInTheDocument();
  });

  it("blocks same food without distinct variants before calling the API", async () => {
    const user = userEvent.setup();
    const create = vi.fn();
    renderPlan(mockSessionsClient({ create }));

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    await pickCalendarDay(user, form, /July 20/i);
    await pickFood(user, form, "Food 1", "Apples");
    await pickFood(user, form, "Food 2", "Apples");

    expect(within(form).getByLabelText("Food 1 variant note")).toBeRequired();
    expect(within(form).getByLabelText("Food 2 variant note")).toBeRequired();

    await user.type(
      within(form).getByLabelText("Food 1 variant note"),
      "Iggy's",
    );
    await user.type(
      within(form).getByLabelText("Food 2 variant note"),
      "iggy's",
    );
    await user.click(within(form).getByRole("button", { name: "Save night" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Same food needs two different brand/variety notes",
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("greys out a date that already has a planned night", async () => {
    const user = userEvent.setup();
    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([sampleSession]),
      }),
    );

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    const occupied = within(form).getByRole("button", { name: /July 20/i });
    expect(occupied).toBeDisabled();
    await user.click(occupied);
    expect(within(form).getByTestId("Date summary")).toHaveTextContent(
      /Pick a night/,
    );
  });

  it("greys out today when History has a completed night today", async () => {
    const user = userEvent.setup();
    const completedToday: SessionResponse = {
      ...sampleSession,
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      scheduledOn: TODAY,
      status: "completed",
    };
    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([]),
        listHistory: vi.fn().mockResolvedValue([completedToday]),
      }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    const todayCell = within(form).getByRole("button", { name: /July 15/i });
    expect(todayCell).toBeDisabled();
  });

  it("blocks early-run when today already has a completed night", async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    const completedToday: SessionResponse = {
      ...sampleSession,
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      scheduledOn: TODAY,
      status: "completed",
    };

    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([sampleSession]),
        listHistory: vi.fn().mockResolvedValue([completedToday]),
        update,
      }),
    );

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Run" }));

    expect(
      screen.queryByRole("dialog", { name: "Run this night early?" }),
    ).not.toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Today already has a tasting night/i,
    );
    expect(update).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: "Run tasting session" }),
    ).not.toBeInTheDocument();
  });

  it("blocks early-run when today already has a planned night", async () => {
    const user = userEvent.setup();
    const update = vi.fn();
    const tonight: SessionResponse = {
      ...sampleSession,
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      scheduledOn: TODAY,
      foods: sampleSession.foods.map((food) =>
        food.position === 1
          ? { ...food, variantNote: "Tonight apple" }
          : food,
      ),
    };

    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([tonight, sampleSession]),
        update,
      }),
    );

    expect(await screen.findByText(/Tonight apple/)).toBeInTheDocument();
    expect(screen.getByText(/Honeycrisp/)).toBeInTheDocument();
    const runButtons = screen.getAllByRole("button", { name: "Run" });
    expect(runButtons).toHaveLength(2);
    await user.click(runButtons[1]!);

    expect(
      screen.queryByRole("dialog", { name: "Run this night early?" }),
    ).not.toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Today already has a tasting night/i,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("keeps the edited night's own date selectable", async () => {
    const user = userEvent.setup();
    const otherNight: SessionResponse = {
      ...sampleSession,
      id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      scheduledOn: "2026-07-22",
      foods: [
        {
          ...sampleSession.foods[0],
          name: "Blueberries",
          foodId: foods[2].id,
          iconKey: "blueberry",
          variantNote: null,
        },
        sampleSession.foods[1],
      ],
    };
    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([sampleSession, otherNight]),
      }),
    );

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]!);

    const form = screen.getByRole("form", { name: "Edit night" });
    expect(
      within(form).getByRole("button", { name: /July 20.*selected/i }),
    ).not.toBeDisabled();
    expect(within(form).getByRole("button", { name: /July 22/i })).toBeDisabled();
    expect(within(form).getByTestId("Date summary")).toHaveTextContent(/Jul/);
  });

  it("surfaces API save errors", async () => {
    const user = userEvent.setup();
    const create = vi
      .fn()
      .mockRejectedValue(new Error("Scheduled date can't be in the past"));
    renderPlan(mockSessionsClient({ create }));

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    await pickCalendarDay(user, form, /July 20/i);
    await pickFood(user, form, "Food 1", "Apples");
    await pickFood(user, form, "Food 2", "Strawberries");
    await user.click(within(form).getByRole("button", { name: "Save night" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Scheduled date can't be in the past",
    );
  });

  it("edits and cancels an upcoming night", async () => {
    const user = userEvent.setup();
    const updated: SessionResponse = {
      ...sampleSession,
      scheduledOn: "2026-07-22",
      foods: [
        {
          foodId: foods[1].id,
          name: "Strawberries",
          iconKey: "strawberry",
          familiarity: "familiar_but_new",
          variantNote: "TJ's",
          position: 1,
        },
        {
          foodId: foods[2].id,
          name: "Blueberries",
          iconKey: "blueberry",
          familiarity: "safe",
          variantNote: null,
          position: 2,
        },
      ],
    };
    const update = vi.fn().mockResolvedValue(updated);
    const cancel = vi.fn().mockResolvedValue({
      ...updated,
      status: "cancelled",
    });

    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([sampleSession]),
        update,
        cancel,
      }),
    );

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const form = screen.getByRole("form", { name: "Edit night" });
    await pickCalendarDay(user, form, /July 22/i);
    await pickFood(user, form, "Food 1", "Strawberries");
    const note = within(form).getByLabelText("Food 1 variant note");
    await user.clear(note);
    await user.type(note, "TJ's");
    await user.selectOptions(
      within(form).getByLabelText("Food 1 familiarity"),
      "familiar_but_new",
    );
    await pickFood(user, form, "Food 2", "Blueberries");
    await user.selectOptions(
      within(form).getByLabelText("Food 2 familiarity"),
      "safe",
    );
    await user.click(
      within(form).getByRole("button", { name: "Save changes" }),
    );

    expect(update).toHaveBeenCalledWith(sampleSession.id, {
      scheduledOn: "2026-07-22",
      foods: [
        {
          foodId: foods[1].id,
          familiarity: "familiar_but_new",
          variantNote: "TJ's",
        },
        {
          foodId: foods[2].id,
          familiarity: "safe",
          variantNote: null,
        },
      ],
    });
    expect(await screen.findByText(/TJ's/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel night" }));
    expect(cancel).toHaveBeenCalledWith(sampleSession.id);
    await waitFor(() => {
      expect(screen.queryByText(/TJ's/)).not.toBeInTheDocument();
    });
  });

  it("opens the runner from upcoming when scheduled for today", async () => {
    const user = userEvent.setup();
    const tonight: SessionResponse = {
      ...sampleSession,
      scheduledOn: TODAY,
    };

    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([tonight]),
      }),
    );

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Run" }));
    expect(
      screen.queryByRole("dialog", { name: "Run this night early?" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Run tasting session" }),
    ).toBeInTheDocument();
  });

  it("confirms early run, snaps to today, then opens the runner", async () => {
    const user = userEvent.setup();
    const snapped: SessionResponse = {
      ...sampleSession,
      scheduledOn: TODAY,
    };
    const update = vi.fn().mockResolvedValue(snapped);

    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([sampleSession]),
        update,
      }),
    );

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Run" }));

    const confirm = screen.getByRole("dialog", {
      name: "Run this night early?",
    });
    expect(confirm).toHaveTextContent(/planned for/);
    expect(
      screen.queryByRole("dialog", { name: "Run tasting session" }),
    ).not.toBeInTheDocument();

    await user.click(
      within(confirm).getByRole("button", {
        name: "Record as today and run",
      }),
    );

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(sampleSession.id, {
        scheduledOn: TODAY,
        foods: [
          {
            foodId: sampleSession.foods[0].foodId,
            familiarity: sampleSession.foods[0].familiarity,
            variantNote: sampleSession.foods[0].variantNote,
          },
          {
            foodId: sampleSession.foods[1].foodId,
            familiarity: sampleSession.foods[1].familiarity,
            variantNote: sampleSession.foods[1].variantNote,
          },
        ],
      });
    });
    expect(
      await screen.findByRole("dialog", { name: "Run tasting session" }),
    ).toBeInTheDocument();
    // Snapped night is dated today; the former future date is no longer in Upcoming.
    expect(screen.queryByText(/Mon, Jul 20/)).not.toBeInTheDocument();
  });

  it("dismisses early-run confirm without updating or opening the runner", async () => {
    const user = userEvent.setup();
    const update = vi.fn();

    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([sampleSession]),
        update,
      }),
    );

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Run" }));
    await user.click(screen.getByRole("button", { name: "Not now" }));

    expect(update).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: "Run this night early?" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Run tasting session" }),
    ).not.toBeInTheDocument();
  });

  it("surfaces occupied-today errors and does not open the runner", async () => {
    const user = userEvent.setup();
    const update = vi
      .fn()
      .mockRejectedValue(new Error("A session already exists on that date"));

    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([sampleSession]),
        update,
      }),
    );

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Run" }));
    await user.click(
      screen.getByRole("button", { name: "Record as today and run" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A session already exists on that date",
    );
    expect(
      screen.queryByRole("dialog", { name: "Run tasting session" }),
    ).not.toBeInTheDocument();
  });

  it("surfaces load errors", async () => {
    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockRejectedValue(new Error("Not signed in")),
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Not signed in");
  });

  it("shows safe+stretch plan hint and draft coaching after Suggest", async () => {
    const user = userEvent.setup();
    renderPlan(
      mockSessionsClient({
        suggestNext: vi.fn().mockResolvedValue(sampleSuggestion),
      }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    expect(screen.getByTestId("safe-stretch plan hint")).toHaveTextContent(
      SAFE_STRETCH_PLAN_HINT,
    );
    expect(
      screen.queryByTestId("safe-stretch draft coaching"),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Suggest next night" }),
    );

    const coaching = await screen.findByTestId("safe-stretch draft coaching");
    expect(coaching).toHaveTextContent(/one safe food and one stretch/i);
  });

  it("updates draft coaching when both slots are stretches", async () => {
    const user = userEvent.setup();
    const twoStretch: SessionSuggestionResponse = {
      ...sampleSuggestion,
      foods: [
        {
          foodId: foods[0].id,
          name: "Apples",
          iconKey: "apple",
          familiarity: "truly_new",
        },
        {
          foodId: foods[1].id,
          name: "Strawberries",
          iconKey: "strawberry",
          familiarity: "familiar_but_new",
        },
      ],
    };
    renderPlan(
      mockSessionsClient({
        suggestNext: vi.fn().mockResolvedValue(twoStretch),
      }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(
      screen.getByRole("button", { name: "Suggest next night" }),
    );

    expect(
      await screen.findByTestId("safe-stretch draft coaching"),
    ).toHaveTextContent(/Both foods are stretches/i);
  });

  it("maps Suggest catalog variantNote into the draft slot", async () => {
    const user = userEvent.setup();
    const suggestNext = vi.fn().mockResolvedValue({
      ...sampleSuggestion,
      foods: [
        {
          foodId: foods[0].id,
          name: "Apples",
          iconKey: "apple",
          familiarity: "safe" as const,
          variantNote: "chips",
        },
        {
          foodId: foods[1].id,
          name: "Strawberries",
          iconKey: "strawberry",
          familiarity: "familiar_but_new" as const,
        },
      ],
    });
    renderPlan(mockSessionsClient({ suggestNext }));

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(
      screen.getByRole("button", { name: "Suggest next night" }),
    );

    const form = await screen.findByRole("form", {
      name: "Suggested next night",
    });
    expect(within(form).getByTestId("suggest draft summary")).toHaveTextContent(
      /Apples \(chips\) — Safe/,
    );
    await user.click(
      within(form).getByRole("button", { name: "Edit suggestion" }),
    );
    expect(within(form).getByLabelText("Food 1 familiarity")).toHaveValue(
      "safe",
    );
    expect(within(form).getByLabelText("Food 1 variant note")).toHaveValue(
      "chips",
    );
  });

  it("runs Suggest once when autoSuggestKey bumps after load", async () => {
    const suggestNext = vi.fn().mockResolvedValue(sampleSuggestion)
    const onAutoSuggestConsumed = vi.fn()
    render(
      <PlanPage
        sessionsClient={mockSessionsClient({ suggestNext })}
        foodsClient={mockFoodsClient()}
        todayIso={TODAY}
        autoSuggestKey={1}
        onAutoSuggestConsumed={onAutoSuggestConsumed}
      />,
    )

    await screen.findByRole("heading", { name: "Plan" })
    await waitFor(() => {
      expect(suggestNext).toHaveBeenCalledTimes(1)
    })
    expect(onAutoSuggestConsumed).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByRole("form", { name: "Suggested next night" }),
    ).toBeInTheDocument()
  })

  it("approves an untouched Suggest draft with one primary Approve", async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue({
      ...sampleSession,
      scheduledOn: "2026-07-16",
      foods: [
        {
          foodId: foods[0].id,
          name: "Apples",
          iconKey: "apple",
          familiarity: "safe",
          variantNote: null,
          position: 1,
        },
        {
          foodId: foods[1].id,
          name: "Strawberries",
          iconKey: "strawberry",
          familiarity: "familiar_but_new",
          variantNote: null,
          position: 2,
        },
      ],
    });
    renderPlan(
      mockSessionsClient({
        suggestNext: vi.fn().mockResolvedValue(sampleSuggestion),
        create,
      }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(
      screen.getByRole("button", { name: "Suggest next night" }),
    );

    const form = await screen.findByRole("form", {
      name: "Suggested next night",
    });
    const summary = within(form).getByTestId("suggest draft summary");
    expect(summary).toHaveTextContent(/Apples — Safe/);
    expect(summary).toHaveTextContent(/Strawberries — Familiar but new/);
    expect(within(form).queryByLabelText("Food 1 familiarity")).toBeNull();
    expect(within(form).queryByRole("grid")).toBeNull();
    expect(
      within(form).getByRole("button", { name: "Edit suggestion" }),
    ).toBeInTheDocument();

    await user.click(within(form).getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith({
        scheduledOn: "2026-07-16",
        foods: [
          {
            foodId: foods[0].id,
            familiarity: "safe",
            variantNote: null,
          },
          {
            foodId: foods[1].id,
            familiarity: "familiar_but_new",
            variantNote: null,
          },
        ],
      });
    });
    expect(
      screen.queryByRole("form", { name: "Suggested next night" }),
    ).toBeNull();
  });

  it("suggests a night, allows swap, and approves via create", async () => {
    const user = userEvent.setup();
    const suggestNext = vi.fn().mockResolvedValue(sampleSuggestion);
    const create = vi.fn().mockResolvedValue({
      ...sampleSession,
      scheduledOn: "2026-07-22",
      foods: [
        {
          foodId: foods[2].id,
          name: "Blueberries",
          iconKey: "blueberry",
          familiarity: "safe",
          variantNote: null,
          position: 1,
        },
        {
          foodId: foods[1].id,
          name: "Strawberries",
          iconKey: "strawberry",
          familiarity: "familiar_but_new",
          variantNote: null,
          position: 2,
        },
      ],
    });
    renderPlan(mockSessionsClient({ suggestNext, create }));

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(
      screen.getByRole("button", { name: "Suggest next night" }),
    );

    const form = await screen.findByRole("form", {
      name: "Suggested next night",
    });
    expect(
      within(form).getByText(
        /A calm next night from foods that often work for you/,
      ),
    ).toBeInTheDocument();
    const pacing = within(form).getByTestId("suggest pacing evidence");
    expect(pacing).toHaveTextContent(/Why this pace/);
    expect(pacing).toHaveTextContent(
      /Keep a calm, balanced night — foods that often work, without rushing/,
    );
    expect(pacing).toHaveTextContent(/Calm tasting rhythm/);
    expect(pacing).toHaveTextContent(
      /Family mealtime and exposure guidance for picky eating/,
    );

    await user.click(
      within(form).getByRole("button", { name: "Edit suggestion" }),
    );
    expect(within(form).queryByTestId("suggest draft summary")).toBeNull();
    expect(form.querySelector('input[type="date"]')).toBeNull();
    expect(within(form).getByRole("grid")).toBeInTheDocument();
    expect(
      within(form).getByTestId("Suggested date summary"),
    ).toHaveTextContent(/Jul/);
    expect(
      within(form).getByRole("button", { name: /July 16.*selected/i }),
    ).toBeInTheDocument();

    await pickCalendarDay(user, form, /July 22/i);
    await pickFood(user, form, "Food 1", "Blueberries");
    await user.selectOptions(
      within(form).getByLabelText("Food 1 familiarity"),
      "safe",
    );
    await user.click(within(form).getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(create).toHaveBeenCalledWith({
        scheduledOn: "2026-07-22",
        foods: [
          {
            foodId: foods[2].id,
            familiarity: "safe",
            variantNote: null,
          },
          {
            foodId: foods[1].id,
            familiarity: "familiar_but_new",
            variantNote: null,
          },
        ],
      });
    });
    expect(screen.queryByRole("form", { name: "Suggested next night" })).toBeNull();
    expect(await screen.findByText(/Blueberries/)).toBeInTheDocument();
  });

  it("dismisses a suggestion without creating", async () => {
    const user = userEvent.setup();
    const create = vi.fn();
    renderPlan(
      mockSessionsClient({
        suggestNext: vi.fn().mockResolvedValue(sampleSuggestion),
        create,
      }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(
      screen.getByRole("button", { name: "Suggest next night" }),
    );
    const form = await screen.findByRole("form", {
      name: "Suggested next night",
    });
    await user.click(within(form).getByRole("button", { name: "Dismiss" }));

    expect(screen.queryByRole("form", { name: "Suggested next night" })).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it("shows pacing note distinctly from rationale and hides citations when empty", async () => {
    const user = userEvent.setup();
    renderPlan(
      mockSessionsClient({
        suggestNext: vi.fn().mockResolvedValue({
          ...sampleSuggestion,
          pacingNote: "Ease off brand-new foods for a bit.",
          citations: [],
        }),
      }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(
      screen.getByRole("button", { name: "Suggest next night" }),
    );
    const form = await screen.findByRole("form", {
      name: "Suggested next night",
    });
    expect(
      within(form).getByText(
        /A calm next night from foods that often work for you/,
      ),
    ).toBeInTheDocument();
    const pacing = within(form).getByTestId("suggest pacing evidence");
    expect(pacing).toHaveTextContent(/Ease off brand-new foods for a bit/);
    expect(within(pacing).queryByRole("list")).toBeNull();
  });

  it("shows invent slot, swaps to catalog, and dismisses without invent writes", async () => {
    const user = userEvent.setup();
    const inventSuggestion: SessionSuggestionResponse = {
      scheduledOn: "2026-07-16",
      foods: [
        {
          foodId: foods[0].id,
          name: "Apples",
          iconKey: "apple",
          familiarity: "safe",
        },
        {
          foodId: null,
          name: "Pickles",
          iconKey: "custom_pickles",
          familiarity: "truly_new",
          proposedName: "Pickles",
          proposedVariantNote: "spears",
        },
      ],
      rationale: "Salty stretch from chips territory.",
      source: "ai",
    };
    const create = vi.fn();
    const foodsCreate = vi.fn();
    const upsertExposure = vi.fn();
    renderPlan(
      mockSessionsClient({
        suggestNext: vi.fn().mockResolvedValue(inventSuggestion),
        create,
      }),
      mockFoodsClient({ create: foodsCreate, upsertExposure }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(
      screen.getByRole("button", { name: "Suggest next night" }),
    );
    const form = await screen.findByRole("form", {
      name: "Suggested next night",
    });
    await user.click(
      within(form).getByRole("button", { name: "Edit suggestion" }),
    );
    expect(within(form).getByTestId("Food 2 invent")).toHaveTextContent(
      /Pickles/,
    );
    expect(
      within(form).getByLabelText("Food 2 variant note"),
    ).toHaveValue("spears");
    expect(
      within(form).queryByRole("combobox", { name: "Food 2 picker" }),
    ).toBeNull();

    await user.click(
      within(form).getByRole("button", {
        name: "Choose from catalog instead",
      }),
    );
    expect(within(form).queryByTestId("Food 2 invent")).toBeNull();
    await pickFood(user, form, "Food 2", "Blueberries");
    await user.click(within(form).getByRole("button", { name: "Dismiss" }));

    expect(create).not.toHaveBeenCalled();
    expect(foodsCreate).not.toHaveBeenCalled();
    expect(upsertExposure).not.toHaveBeenCalled();
  });

  it("approves invent by creating food, upserting exposure, then session", async () => {
    const user = userEvent.setup();
    const inventSuggestion: SessionSuggestionResponse = {
      scheduledOn: "2026-07-16",
      foods: [
        {
          foodId: foods[0].id,
          name: "Apples",
          iconKey: "apple",
          familiarity: "safe",
        },
        {
          foodId: null,
          name: "Pickles",
          iconKey: "custom_pickles",
          familiarity: "truly_new",
          proposedName: "Pickles",
          proposedVariantNote: "spears",
        },
      ],
      rationale: "Salty stretch.",
      source: "ai",
    };
    const createdFood: FoodResponse = {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Pickles",
      iconKey: "custom_pickles",
      householdId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      system: false,
      sessionEligible: true,
      exposures: [],
    };
    const foodsCreate = vi.fn().mockResolvedValue(createdFood);
    const upsertExposure = vi.fn().mockResolvedValue({
      foodId: createdFood.id,
      variantKey: "spears",
      familiarity: "truly_new",
      source: "manual",
    });
    const create = vi.fn().mockResolvedValue({
      ...sampleSession,
      scheduledOn: "2026-07-16",
      foods: [
        {
          foodId: foods[0].id,
          name: "Apples",
          iconKey: "apple",
          familiarity: "safe",
          variantNote: null,
          position: 1,
        },
        {
          foodId: createdFood.id,
          name: "Pickles",
          iconKey: "custom_pickles",
          familiarity: "truly_new",
          variantNote: "spears",
          position: 2,
        },
      ],
    });
    renderPlan(
      mockSessionsClient({
        suggestNext: vi.fn().mockResolvedValue(inventSuggestion),
        create,
      }),
      mockFoodsClient({ create: foodsCreate, upsertExposure }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(
      screen.getByRole("button", { name: "Suggest next night" }),
    );
    const form = await screen.findByRole("form", {
      name: "Suggested next night",
    });
    await user.click(within(form).getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(foodsCreate).toHaveBeenCalledWith({
        name: "Pickles",
        iconKey: "custom_pickles",
        sessionEligible: true,
      });
    });
    expect(upsertExposure).toHaveBeenCalledWith(createdFood.id, {
      variantKey: "spears",
      familiarity: "truly_new",
    });
    expect(create).toHaveBeenCalledWith({
      scheduledOn: "2026-07-16",
      foods: [
        {
          foodId: foods[0].id,
          familiarity: "safe",
          variantNote: null,
        },
        {
          foodId: createdFood.id,
          familiarity: "truly_new",
          variantNote: "spears",
        },
      ],
    });
    expect(
      screen.queryByRole("form", { name: "Suggested next night" }),
    ).toBeNull();
    expect(await screen.findByText(/Pickles/)).toBeInTheDocument();
  });

  it("approves invent by matching an existing tasting food name", async () => {
    const user = userEvent.setup();
    const inventSuggestion: SessionSuggestionResponse = {
      scheduledOn: "2026-07-16",
      foods: [
        {
          foodId: foods[0].id,
          name: "Apples",
          iconKey: "apple",
          familiarity: "safe",
        },
        {
          foodId: null,
          name: "Blueberries",
          iconKey: "custom_blueberries",
          familiarity: "familiar_but_new",
          proposedName: "Blueberries",
        },
      ],
      source: "ai",
    };
    const foodsCreate = vi.fn();
    const upsertExposure = vi.fn().mockResolvedValue({
      foodId: foods[2].id,
      variantKey: "",
      familiarity: "familiar_but_new",
      source: "manual",
    });
    const create = vi.fn().mockResolvedValue({
      ...sampleSession,
      scheduledOn: "2026-07-16",
      foods: [
        sampleSession.foods[0],
        {
          foodId: foods[2].id,
          name: "Blueberries",
          iconKey: "blueberry",
          familiarity: "familiar_but_new",
          variantNote: null,
          position: 2,
        },
      ],
    });
    renderPlan(
      mockSessionsClient({
        suggestNext: vi.fn().mockResolvedValue(inventSuggestion),
        create,
      }),
      mockFoodsClient({ create: foodsCreate, upsertExposure }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(
      screen.getByRole("button", { name: "Suggest next night" }),
    );
    const form = await screen.findByRole("form", {
      name: "Suggested next night",
    });
    await user.click(within(form).getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(create).toHaveBeenCalled();
    });
    expect(foodsCreate).not.toHaveBeenCalled();
    expect(upsertExposure).toHaveBeenCalledWith(foods[2].id, {
      variantKey: "",
      familiarity: "familiar_but_new",
    });
    expect(create).toHaveBeenCalledWith({
      scheduledOn: "2026-07-16",
      foods: [
        {
          foodId: foods[0].id,
          familiarity: "safe",
          variantNote: null,
        },
        {
          foodId: foods[2].id,
          familiarity: "familiar_but_new",
          variantNote: null,
        },
      ],
    });
  });

  it("surfaces invent create failure without creating a session", async () => {
    const user = userEvent.setup();
    const inventSuggestion: SessionSuggestionResponse = {
      scheduledOn: "2026-07-16",
      foods: [
        {
          foodId: foods[0].id,
          name: "Apples",
          iconKey: "apple",
          familiarity: "safe",
        },
        {
          foodId: null,
          name: "Pickles",
          iconKey: "custom_pickles",
          familiarity: "truly_new",
          proposedName: "Pickles",
        },
      ],
      source: "ai",
    };
    const create = vi.fn();
    renderPlan(
      mockSessionsClient({
        suggestNext: vi.fn().mockResolvedValue(inventSuggestion),
        create,
      }),
      mockFoodsClient({
        create: vi.fn().mockRejectedValue(new Error("Could not create food")),
      }),
    );

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(
      screen.getByRole("button", { name: "Suggest next night" }),
    );
    const form = await screen.findByRole("form", {
      name: "Suggested next night",
    });
    await user.click(within(form).getByRole("button", { name: "Approve" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not create food",
    );
    expect(create).not.toHaveBeenCalled();
  });
});
