import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { FoodsClient, SessionsClient } from "@/api";
import type { FoodResponse, SessionResponse } from "@/api/types";
import {
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
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
    name: "Strawberries",
    iconKey: "strawberry",
    householdId: null,
    system: true,
    sessionEligible: true,
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa13",
    name: "Blueberries",
    iconKey: "blueberry",
    householdId: null,
    system: true,
    sessionEligible: true,
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
      familiarity: "likes",
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

function mockSessionsClient(
  overrides: Partial<SessionsClient> = {},
): SessionsClient {
  return {
    listUpcoming: vi.fn().mockResolvedValue([]),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
    complete: vi.fn(),
    ...overrides,
  } as SessionsClient;
}

function mockFoodsClient(overrides: Partial<FoodsClient> = {}): FoodsClient {
  return {
    list: vi.fn().mockResolvedValue(foods),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    ...overrides,
  } as FoodsClient;
}

function renderPlan(
  sessionsClient: SessionsClient,
  foodsClient: FoodsClient = mockFoodsClient(),
) {
  return render(
    <PlanPage
      sessionsClient={sessionsClient}
      foodsClient={foodsClient}
      todayIso={TODAY}
    />,
  );
}

describe("PlanPage helpers", () => {
  it("formats local today for date min", () => {
    expect(localTodayIsoDate(new Date("2026-07-22T15:00:00"))).toBe(
      "2026-07-22",
    );
  });

  it("requires distinct variants when both slots share a food", () => {
    expect(
      sameFoodVariantError(
        { foodId: foods[0].id, familiarity: "likes", variantNote: "A" },
        { foodId: foods[0].id, familiarity: "likes", variantNote: "B" },
      ),
    ).toBeNull();
    expect(
      sameFoodVariantError(
        { foodId: foods[0].id, familiarity: "likes", variantNote: "" },
        { foodId: foods[0].id, familiarity: "likes", variantNote: "B" },
      ),
    ).toMatch(/brand\/variety/);
    expect(
      sameFoodVariantError(
        { foodId: foods[0].id, familiarity: "likes", variantNote: "Iggy's" },
        { foodId: foods[0].id, familiarity: "likes", variantNote: "iggy's" },
      ),
    ).toMatch(/brand\/variety/);
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

  it("sets the date picker min to today", async () => {
    renderPlan(mockSessionsClient());
    await screen.findByRole("heading", { name: "Plan" });
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Plan a night" }));

    expect(screen.getByLabelText("Date")).toHaveAttribute("min", TODAY);
  });

  it("creates a planned night with two foods", async () => {
    const user = userEvent.setup();
    const create = vi.fn().mockResolvedValue(sampleSession);
    renderPlan(mockSessionsClient({ create }));

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    await user.type(within(form).getByLabelText("Date"), "2026-07-20");
    await user.selectOptions(
      within(form).getByLabelText("Food 1 picker"),
      foods[0].id,
    );
    await user.selectOptions(
      within(form).getByLabelText("Food 1 familiarity"),
      "likes",
    );
    await user.type(
      within(form).getByLabelText("Food 1 variant note"),
      "Honeycrisp",
    );
    await user.selectOptions(
      within(form).getByLabelText("Food 2 picker"),
      foods[1].id,
    );
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
          familiarity: "likes",
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

  it("blocks same food without distinct variants before calling the API", async () => {
    const user = userEvent.setup();
    const create = vi.fn();
    renderPlan(mockSessionsClient({ create }));

    await screen.findByRole("heading", { name: "Plan" });
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    await user.type(within(form).getByLabelText("Date"), "2026-07-20");
    await user.selectOptions(
      within(form).getByLabelText("Food 1 picker"),
      foods[0].id,
    );
    await user.selectOptions(
      within(form).getByLabelText("Food 2 picker"),
      foods[0].id,
    );

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

  it("blocks creating on a date that already has a planned night", async () => {
    const user = userEvent.setup();
    const create = vi.fn();
    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([sampleSession]),
        create,
      }),
    );

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Plan a night" }));

    const form = screen.getByRole("form", { name: "Plan a night" });
    await user.type(within(form).getByLabelText("Date"), "2026-07-20");
    await user.selectOptions(
      within(form).getByLabelText("Food 1 picker"),
      foods[0].id,
    );
    await user.selectOptions(
      within(form).getByLabelText("Food 2 picker"),
      foods[1].id,
    );
    await user.click(within(form).getByRole("button", { name: "Save night" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A session already exists on that date",
    );
    expect(create).not.toHaveBeenCalled();
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
    await user.type(within(form).getByLabelText("Date"), "2026-07-20");
    await user.selectOptions(
      within(form).getByLabelText("Food 1 picker"),
      foods[0].id,
    );
    await user.selectOptions(
      within(form).getByLabelText("Food 2 picker"),
      foods[1].id,
    );
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
          familiarity: "likes",
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
    const date = within(form).getByLabelText("Date");
    await user.clear(date);
    await user.type(date, "2026-07-22");
    await user.selectOptions(
      within(form).getByLabelText("Food 1 picker"),
      foods[1].id,
    );
    await user.selectOptions(
      within(form).getByLabelText("Food 1 familiarity"),
      "familiar_but_new",
    );
    const note = within(form).getByLabelText("Food 1 variant note");
    await user.clear(note);
    await user.type(note, "TJ's");
    await user.selectOptions(
      within(form).getByLabelText("Food 2 picker"),
      foods[2].id,
    );
    await user.selectOptions(
      within(form).getByLabelText("Food 2 familiarity"),
      "likes",
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
          familiarity: "likes",
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

  it("opens the runner from upcoming", async () => {
    const user = userEvent.setup();

    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockResolvedValue([sampleSession]),
      }),
    );

    expect(await screen.findByText(/Honeycrisp/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Run" }));
    expect(
      screen.getByRole("dialog", { name: "Run tasting session" }),
    ).toBeInTheDocument();
  });

  it("surfaces load errors", async () => {
    renderPlan(
      mockSessionsClient({
        listUpcoming: vi.fn().mockRejectedValue(new Error("Not signed in")),
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Not signed in");
  });
});
