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
  localTodayIsoDate,
  PlanPage,
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
};

function mockSessionsClient(
  overrides: Partial<SessionsClient> = {},
): SessionsClient {
  return {
    listUpcoming: vi.fn().mockResolvedValue([]),
    listHistory: vi.fn(),
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

  it("requires distinct variants when both slots share a food", () => {
    expect(
      sameFoodVariantError(
        { foodId: foods[0].id, familiarity: "safe", variantNote: "A" },
        { foodId: foods[0].id, familiarity: "safe", variantNote: "B" },
      ),
    ).toBeNull();
    expect(
      sameFoodVariantError(
        { foodId: foods[0].id, familiarity: "safe", variantNote: "" },
        { foodId: foods[0].id, familiarity: "safe", variantNote: "B" },
      ),
    ).toMatch(/brand\/variety/);
    expect(
      sameFoodVariantError(
        { foodId: foods[0].id, familiarity: "safe", variantNote: "Iggy's" },
        { foodId: foods[0].id, familiarity: "safe", variantNote: "iggy's" },
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
    };
    expect(
      applyPlanSlotChange(
        empty,
        { foodId: catalog[0].id, familiarity: "truly_new", variantNote: "" },
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
        },
        catalog,
      ).familiarity,
    ).toBe("safe");
    expect(
      applyPlanSlotChange(
        empty,
        { foodId: catalog[1].id, familiarity: "safe", variantNote: "" },
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
        },
        {
          foodId: catalog[0].id,
          familiarity: "retrying",
          variantNote: "Bagelsaurus",
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
});
