/**
 * Unit tests for AssistanceResponseDialog item status toggling.
 * Task 14.1 — Requirements: 5.3, 5.5
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@studio/ui", () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    Button: ({ children, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
    Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
    Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
    Input: ({ id, value, onChange, placeholder, type, min }: any) => (
        <input id={id} value={value} onChange={onChange} placeholder={placeholder} type={type} min={min} />
    ),
    Textarea: ({ id, value, onChange, placeholder, rows }: any) => (
        <textarea id={id} value={value} onChange={onChange} placeholder={placeholder} rows={rows} />
    ),
    Switch: ({ id, checked, onCheckedChange }: any) => (
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            data-testid="bulk-switch"
        />
    ),
    Separator: () => <hr />,
}));

vi.mock("lucide-react", () => ({
    CheckCircle2: () => <svg data-testid="icon-check" />,
    XCircle: () => <svg data-testid="icon-xcircle" />,
    LoaderCircle: () => <svg data-testid="icon-loader" />,
}));

vi.mock("@/hooks/use-toast", () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@tanstack/react-query", () => ({
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("@/actions/venue-assistance", () => ({
    respondToAssistanceRequest: vi.fn().mockResolvedValue({}),
    bulkRespondToRecurringRequests: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/hooks/use-assistance-requests", () => ({
    assistanceRequestKeys: { forBooking: (id: string) => ["assistanceRequests", "booking", id] },
}));

vi.mock("@/hooks/use-venue-bookings", () => ({
    venueBookingKeys: { detail: (id: string) => ["venueBookings", "detail", id] },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { AssistanceResponseDialog } from "@/components/venue-assistance/assistance-response-dialog";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRequest(overrides: Partial<any> = {}) {
    return {
        id: "req-1",
        ministryId: "ministry-tech",
        status: "Pending",
        explanation: null,
        items: [
            {
                id: "item-1",
                name: "Projector",
                description: "HDMI projector",
                quantity: 1,
                isRequired: true,
                status: "Pending",
                adjustedQty: null,
                adjustedDesc: null,
            },
            {
                id: "item-2",
                name: "Microphone",
                description: null,
                quantity: 2,
                isRequired: false,
                status: "Pending",
                adjustedQty: null,
                adjustedDesc: null,
            },
        ],
        ...overrides,
    };
}

const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    responderId: "worker-1",
    bookingId: "booking-1",
    recurringBookingId: null,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AssistanceResponseDialog — item status toggling", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders all items with Approved status by default", () => {
        const request = makeRequest();
        render(<AssistanceResponseDialog {...defaultProps} request={request} />);

        // Both items should show "Approved" initially
        const approvedLabels = screen.getAllByText("Approved");
        expect(approvedLabels.length).toBeGreaterThanOrEqual(2);
    });

    it("shows 'Approved' preview badge when all items are Approved", () => {
        const request = makeRequest();
        render(<AssistanceResponseDialog {...defaultProps} request={request} />);

        // The preview badge should show "Approved"
        const badges = screen.getAllByTestId("badge");
        const previewBadge = badges[badges.length - 1];
        expect(previewBadge.textContent).toBe("Approved");
    });

    it("toggles an item to Declined when its toggle button is clicked", () => {
        const request = makeRequest();
        render(<AssistanceResponseDialog {...defaultProps} request={request} />);

        // Click the first item's toggle button (shows "Approved" → "Declined")
        const toggleButtons = screen.getAllByRole("button", { name: /Toggle/i });
        fireEvent.click(toggleButtons[0]);

        // First item should now show "Declined"
        expect(screen.getByText("Declined")).toBeInTheDocument();
    });

    it("shows 'Partial' preview badge when items have mixed statuses", () => {
        const request = makeRequest();
        render(<AssistanceResponseDialog {...defaultProps} request={request} />);

        // Toggle first item to Declined, leave second as Approved → mixed = Partial
        const toggleButtons = screen.getAllByRole("button", { name: /Toggle/i });
        fireEvent.click(toggleButtons[0]);

        const badges = screen.getAllByTestId("badge");
        const previewBadge = badges[badges.length - 1];
        expect(previewBadge.textContent).toBe("Partial");
    });

    it("shows 'Declined' preview badge when all items are Declined", () => {
        const request = makeRequest();
        render(<AssistanceResponseDialog {...defaultProps} request={request} />);

        // Toggle both items to Declined
        const toggleButtons = screen.getAllByRole("button", { name: /Toggle/i });
        fireEvent.click(toggleButtons[0]);
        fireEvent.click(toggleButtons[1]);

        const badges = screen.getAllByTestId("badge");
        const previewBadge = badges[badges.length - 1];
        expect(previewBadge.textContent).toBe("Declined");
    });

    it("re-toggles an item back to Approved when clicked again", () => {
        const request = makeRequest();
        render(<AssistanceResponseDialog {...defaultProps} request={request} />);

        const toggleButtons = screen.getAllByRole("button", { name: /Toggle/i });
        // Toggle to Declined
        fireEvent.click(toggleButtons[0]);
        expect(screen.getByText("Declined")).toBeInTheDocument();

        // Toggle back to Approved
        fireEvent.click(toggleButtons[0]);
        expect(screen.queryByText("Declined")).not.toBeInTheDocument();
    });

    it("submit button is enabled when items are present", () => {
        const request = makeRequest();
        render(<AssistanceResponseDialog {...defaultProps} request={request} />);

        const submitBtn = screen.getByRole("button", { name: /Submit Response/i });
        expect(submitBtn).not.toBeDisabled();
    });

    it("submit button is disabled when there are no items", () => {
        const request = makeRequest({ items: [] });
        render(<AssistanceResponseDialog {...defaultProps} request={request} />);

        const submitBtn = screen.getByRole("button", { name: /Submit Response/i });
        expect(submitBtn).toBeDisabled();
    });

    it("does not render bulk-apply toggle when recurringBookingId is null", () => {
        const request = makeRequest();
        render(
            <AssistanceResponseDialog
                {...defaultProps}
                request={request}
                recurringBookingId={null}
            />,
        );

        expect(screen.queryByTestId("bulk-switch")).not.toBeInTheDocument();
    });

    it("renders bulk-apply toggle when recurringBookingId is provided", () => {
        const request = makeRequest();
        render(
            <AssistanceResponseDialog
                {...defaultProps}
                request={request}
                recurringBookingId="recurring-1"
            />,
        );

        expect(screen.getByTestId("bulk-switch")).toBeInTheDocument();
        expect(screen.getByText("Apply to all occurrences")).toBeInTheDocument();
    });

    it("calls onOpenChange(false) when Cancel is clicked", () => {
        const onOpenChange = vi.fn();
        const request = makeRequest();
        render(
            <AssistanceResponseDialog
                {...defaultProps}
                onOpenChange={onOpenChange}
                request={request}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
