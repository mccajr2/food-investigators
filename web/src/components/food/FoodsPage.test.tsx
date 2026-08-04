import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { FoodsClient } from "@/api";
import type { FoodResponse } from "@/api/types";
import { FoodsPage } from "@/components/food/FoodsPage";

const starters: FoodResponse[] = [
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
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12",
    name: "Banana",
    iconKey: "banana",
    householdId: null,
    system: true,
    sessionEligible: true,
    exposures: [],
  },
];

function mockFoodsClient(overrides: Partial<FoodsClient> = {}): FoodsClient {
  return {
    list: vi.fn().mockResolvedValue(starters),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    upsertExposure: vi.fn(),
    clearExposure: vi.fn(),
    listStretchTargets: vi.fn().mockResolvedValue([]),
    addStretchTarget: vi.fn(),
    removeStretchTarget: vi.fn(),
    bootstrapSafes: vi.fn(),
    ...overrides,
  } as FoodsClient;
}

describe("FoodsPage", () => {
  it("lists starter foods with large icons and no edit actions", async () => {
    render(<FoodsPage client={mockFoodsClient()} />);

    expect(
      await screen.findByRole("heading", { name: "Foods" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Starter foods" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Apples")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Set familiarity" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Archive" }),
    ).not.toBeInTheDocument();
  });

  it("creates a household food with a generated icon from the name", async () => {
    const user = userEvent.setup();
    const created: FoodResponse = {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Cucumber",
      iconKey: "custom_cucumber",
      householdId: "22222222-2222-2222-2222-222222222222",
      system: false,
      sessionEligible: true,
      exposures: [],
    };
    const create = vi.fn().mockResolvedValue(created);
    render(<FoodsPage client={mockFoodsClient({ create })} />);

    await screen.findByText("Apples");
    await user.click(screen.getByRole("button", { name: "Add food" }));

    const form = screen.getByRole("form", { name: "Add food" });
    expect(
      within(form).getByRole("option", { name: "Generate from name" }),
    ).toHaveAttribute("aria-selected", "true");
    await user.type(within(form).getByLabelText("Food name"), "Cucumber");
    await user.click(within(form).getByRole("button", { name: "Save food" }));

    expect(create).toHaveBeenCalledWith({
      name: "Cucumber",
      iconKey: "custom_cucumber",
      sessionEligible: true,
      liked: null,
      texture: null,
      tasteNote: null,
    });
    expect(await screen.findByText("Cucumber")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tasting foods" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("can still reuse a starter icon when adding a food", async () => {
    const user = userEvent.setup();
    const created: FoodResponse = {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Extra mash",
      iconKey: "sweet_potato",
      householdId: "22222222-2222-2222-2222-222222222222",
      system: false,
      sessionEligible: true,
      exposures: [],
    };
    const create = vi.fn().mockResolvedValue(created);
    render(<FoodsPage client={mockFoodsClient({ create })} />);

    await screen.findByText("Apples");
    await user.click(screen.getByRole("button", { name: "Add food" }));

    const form = screen.getByRole("form", { name: "Add food" });
    await user.type(within(form).getByLabelText("Food name"), "Extra mash");
    await user.click(
      within(form).getByRole("option", { name: "Sweet potato" }),
    );
    await user.click(within(form).getByRole("button", { name: "Save food" }));

    expect(create).toHaveBeenCalledWith({
      name: "Extra mash",
      iconKey: "sweet_potato",
      sessionEligible: true,
      liked: null,
      texture: null,
      tasteNote: null,
    });
  });

  it("offers the new hero starters as selectable icons", async () => {
    const user = userEvent.setup();
    const created: FoodResponse = {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Friday pizza",
      iconKey: "cheese_pizza",
      householdId: "22222222-2222-2222-2222-222222222222",
      system: false,
      sessionEligible: true,
      exposures: [],
    };
    const create = vi.fn().mockResolvedValue(created);
    render(<FoodsPage client={mockFoodsClient({ create })} />);

    await screen.findByText("Apples");
    await user.click(screen.getByRole("button", { name: "Add food" }));

    const form = screen.getByRole("form", { name: "Add food" });
    expect(
      within(form).getByRole("option", { name: "Cheese pizza" }),
    ).toBeInTheDocument();
    expect(
      within(form).getByRole("option", { name: "Soft pretzels" }),
    ).toBeInTheDocument();
    expect(
      within(form).getByRole("option", { name: "Raspberries" }),
    ).toBeInTheDocument();

    await user.type(within(form).getByLabelText("Food name"), "Friday pizza");
    await user.click(
      within(form).getByRole("option", { name: "Cheese pizza" }),
    );
    await user.click(within(form).getByRole("button", { name: "Save food" }));

    expect(create).toHaveBeenCalledWith({
      name: "Friday pizza",
      iconKey: "cheese_pizza",
      sessionEligible: true,
      liked: null,
      texture: null,
      tasteNote: null,
    });
  });

  it("edits and archives a household food", async () => {
    const user = userEvent.setup();
    const mine: FoodResponse = {
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      name: "My yogurt",
      iconKey: "yogurt_plain",
      householdId: "22222222-2222-2222-2222-222222222222",
      system: false,
      sessionEligible: true,
      exposures: [],
    };
    const updated = { ...mine, name: "Vanilla cup", iconKey: "yogurt_vanilla" };
    const update = vi.fn().mockResolvedValue(updated);
    const archive = vi.fn().mockResolvedValue({
      ...updated,
      archivedAt: "2026-07-14T00:00:00Z",
    });

    render(
      <FoodsPage
        client={mockFoodsClient({
          list: vi.fn().mockResolvedValue([...starters, mine]),
          update,
          archive,
        })}
      />,
    );

    await screen.findByText("My yogurt");
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const form = screen.getByRole("form", { name: "Edit food" });
    const nameInput = within(form).getByLabelText("Food name");
    await user.clear(nameInput);
    await user.type(nameInput, "Vanilla cup");
    await user.click(
      within(form).getByRole("option", { name: "Vanilla yogurt" }),
    );
    await user.click(
      within(form).getByRole("button", { name: "Save changes" }),
    );

    expect(update).toHaveBeenCalledWith(mine.id, {
      name: "Vanilla cup",
      iconKey: "yogurt_vanilla",
      sessionEligible: true,
      liked: null,
      texture: null,
      tasteNote: null,
    });
    expect(await screen.findByText("Vanilla cup")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(archive).toHaveBeenCalledWith(mine.id);
    await waitFor(() => {
      expect(screen.queryByText("Vanilla cup")).not.toBeInTheDocument();
    });
  });

  it("creates a snack with liked, texture, and taste note under Snacks", async () => {
    const user = userEvent.setup();
    const created: FoodResponse = {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
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
    const create = vi.fn().mockResolvedValue(created);
    render(<FoodsPage client={mockFoodsClient({ create })} />);

    await screen.findByText("Apples");
    await user.click(screen.getByRole("button", { name: "Add food" }));

    const form = screen.getByRole("form", { name: "Add food" });
    await user.type(within(form).getByLabelText("Food name"), "Salt chips");
    await user.click(
      within(form).getByLabelText("Snack (not for tasting)"),
    );
    await user.selectOptions(within(form).getByLabelText("Liked"), "like");
    await user.selectOptions(
      within(form).getByLabelText("Texture"),
      "crunchy",
    );
    await user.type(
      within(form).getByLabelText("Taste note"),
      "salt & vinegar",
    );
    await user.click(within(form).getByRole("button", { name: "Save food" }));

    expect(create).toHaveBeenCalledWith({
      name: "Salt chips",
      iconKey: "custom_salt_chips",
      sessionEligible: false,
      liked: "like",
      texture: "crunchy",
      tasteNote: "salt & vinegar",
    });

    const snacks = screen.getByRole("heading", { name: "Snacks" }).closest(
      "section",
    );
    expect(snacks).not.toBeNull();
    expect(within(snacks!).getByText("Salt chips")).toBeInTheDocument();
    expect(within(snacks!).getByText("Snack")).toBeInTheDocument();
    expect(
      within(snacks!).getByText("Like · Crunchy · salt & vinegar"),
    ).toBeInTheDocument();
  });

  it("surfaces create errors including duplicate names", async () => {
    const user = userEvent.setup();
    const create = vi
      .fn()
      .mockRejectedValue(new Error("A food with that name already exists"));
    render(<FoodsPage client={mockFoodsClient({ create })} />);

    await screen.findByText("Apples");
    await user.click(screen.getByRole("button", { name: "Add food" }));
    const form = screen.getByRole("form", { name: "Add food" });
    await user.type(within(form).getByLabelText("Food name"), "Watermelon");
    await user.click(within(form).getByRole("button", { name: "Save food" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A food with that name already exists",
    );
  });

  it("surfaces list errors", async () => {
    render(
      <FoodsPage
        client={mockFoodsClient({
          list: vi.fn().mockRejectedValue(new Error("Not signed in")),
        })}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Not signed in");
  });

  it("lists known safes and clears an exposure", async () => {
    const user = userEvent.setup();
    const withSafe: FoodResponse[] = [
      {
        ...starters[0]!,
        exposures: [
          {
            foodId: starters[0]!.id,
            variantKey: "bagelsaurus",
            familiarity: "safe",
            source: "manual",
          },
        ],
      },
      starters[1]!,
    ];
    const clearExposure = vi.fn().mockResolvedValue(undefined);
    render(
      <FoodsPage
        client={mockFoodsClient({
          list: vi.fn().mockResolvedValue(withSafe),
          clearExposure,
        })}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Known safes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("bagelsaurus")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Clear safe Apples bagelsaurus",
      }),
    );

    expect(clearExposure).toHaveBeenCalledWith(
      starters[0]!.id,
      "bagelsaurus",
    );
    await waitFor(() => {
      expect(screen.queryByText("bagelsaurus")).not.toBeInTheDocument();
    });
  });

  it("adds an exposure overlay on a starter food", async () => {
    const user = userEvent.setup();
    const upsertExposure = vi.fn().mockResolvedValue({
      foodId: starters[0]!.id,
      variantKey: "bagelsaurus",
      familiarity: "safe",
      source: "manual",
    });
    render(
      <FoodsPage
        client={mockFoodsClient({ upsertExposure })}
      />,
    );

    await screen.findByText("Apples");
    const startersSection = screen
      .getByRole("heading", { name: "Starter foods" })
      .closest("section");
    expect(startersSection).not.toBeNull();
    await user.click(
      within(startersSection!).getAllByRole("button", {
        name: "Set familiarity",
      })[0]!,
    );

    const form = screen.getByRole("form", { name: "Add or edit exposure" });
    expect(within(form).getByLabelText("Exposure food")).toHaveValue(
      starters[0]!.id,
    );
    await user.type(
      within(form).getByLabelText("Brand / prep note"),
      "Bagelsaurus",
    );
    await user.click(
      within(form).getByRole("button", { name: "Save exposure" }),
    );

    expect(upsertExposure).toHaveBeenCalledWith(starters[0]!.id, {
      variantKey: "Bagelsaurus",
      familiarity: "safe",
    });
    expect(
      await screen.findByRole("heading", { name: "Known safes" }),
    ).toBeInTheDocument();
    expect(screen.getByText("bagelsaurus")).toBeInTheDocument();
  });

  it("lists stretch targets and can remove one", async () => {
    const user = userEvent.setup();
    const removeStretchTarget = vi.fn().mockResolvedValue(undefined);
    const listStretchTargets = vi.fn().mockResolvedValue([
      {
        id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        foodId: starters[0]!.id,
        foodName: "Apples",
        variantKey: "honeycrisp",
        createdAt: "2026-08-03T18:00:00Z",
      },
    ]);
    render(
      <FoodsPage
        client={mockFoodsClient({ listStretchTargets, removeStretchTarget })}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Stretch targets" }),
    ).toBeInTheDocument();
    expect(screen.getByText("honeycrisp")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Remove stretch Apples honeycrisp",
      }),
    );
    expect(removeStretchTarget).toHaveBeenCalledWith(
      starters[0]!.id,
      "honeycrisp",
    );
    await waitFor(() => {
      expect(screen.queryByText("honeycrisp")).not.toBeInTheDocument();
    });
  });

  it("adds a stretch target by inventing a name", async () => {
    const user = userEvent.setup();
    const created = {
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      foodId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      foodName: "Ground beef",
      variantKey: "taco night",
      createdAt: "2026-08-03T18:00:00Z",
    };
    const addStretchTarget = vi.fn().mockResolvedValue(created);
    const inventedFood: FoodResponse = {
      id: created.foodId,
      name: "Ground beef",
      iconKey: "custom_ground_beef",
      householdId: "22222222-2222-2222-2222-222222222222",
      system: false,
      sessionEligible: true,
      exposures: [],
    };
    const list = vi.fn().mockImplementation(async () => {
      if (addStretchTarget.mock.calls.length > 0) {
        return [...starters, inventedFood];
      }
      return starters;
    });
    render(
      <FoodsPage
        client={mockFoodsClient({ list, addStretchTarget })}
      />,
    );

    await screen.findByText("Apples");
    await user.click(
      screen.getByRole("button", { name: "Add stretch target" }),
    );
    const form = screen.getByRole("form", { name: "Add stretch target" });
    await user.click(within(form).getByRole("radio", { name: "Invent a new food name" }));
    await user.type(
      within(form).getByLabelText("Stretch target name"),
      "Ground beef",
    );
    await user.type(
      within(form).getByLabelText("Stretch brand / prep note"),
      "taco night",
    );
    await user.click(
      within(form).getByRole("button", { name: "Save stretch target" }),
    );

    expect(addStretchTarget).toHaveBeenCalledWith({
      name: "Ground beef",
      variantKey: "taco night",
    });
    expect(
      await screen.findByRole("button", {
        name: "Remove stretch Ground beef taco night",
      }),
    ).toBeInTheDocument();
  });
});

describe("exposure helpers", () => {
  it("normalizes variant keys and merges/clears exposures", async () => {
    const { normalizeVariantKey } = await import("@/lib/foodExposures");
    const {
      mergeExposureIntoFoods,
      removeExposureFromFoods,
    } = await import("@/components/food/FoodsPage");
    expect(normalizeVariantKey("  Bagelsaurus  ")).toBe("bagelsaurus");

    const food: FoodResponse = {
      ...starters[0]!,
      exposures: [],
    };
    const merged = mergeExposureIntoFoods(
      [food],
      {
        foodId: food.id,
        variantKey: "bagelsaurus",
        familiarity: "safe",
        source: "manual",
      },
    );
    expect(merged[0]?.exposures).toHaveLength(1);
    const cleared = removeExposureFromFoods(
      merged,
      food.id,
      "Bagelsaurus",
    );
    expect(cleared[0]?.exposures).toEqual([]);
  });
});
