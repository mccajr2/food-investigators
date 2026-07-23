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
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12",
    name: "Banana",
    iconKey: "banana",
    householdId: null,
    system: true,
    sessionEligible: true,
  },
];

function mockFoodsClient(overrides: Partial<FoodsClient> = {}): FoodsClient {
  return {
    list: vi.fn().mockResolvedValue(starters),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
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
    });
    expect(await screen.findByText("Cucumber")).toBeInTheDocument();
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
    });
    expect(await screen.findByText("Vanilla cup")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Archive" }));
    expect(archive).toHaveBeenCalledWith(mine.id);
    await waitFor(() => {
      expect(screen.queryByText("Vanilla cup")).not.toBeInTheDocument();
    });
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
});
