/**
 * Bug Condition Exploration Tests
 *
 * These tests are written BEFORE implementing fixes.
 * They MUST FAIL on unfixed code — failure confirms the bugs exist.
 * DO NOT fix the code when they fail.
 *
 * **Property 1: Bug Condition** — Add Worker Sheet Renders Form Content
 * **Property 3: Bug Condition** — Room Reservation Shows Spinner While Loading
 *
 * **Validates: Requirements 1.1, 1.2 (Bug 1); 1.1, 1.2, 1.3 (Bug 2)**
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

// Mock @studio/store
vi.mock('@studio/store', () => ({
    useAuthStore: () => ({ user: { email: 'test@example.com', id: 'user-1' } }),
}));

// Mock @studio/database
vi.mock('@studio/database', () => ({
    supabase: { auth: { resetPasswordForEmail: vi.fn() } },
}));

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
    useQuery: () => ({ data: undefined, isLoading: false }),
    QueryClient: class {},
    QueryClientProvider: ({ children }: any) => children,
}));

// Mock all @/actions/db calls
vi.mock('@/actions/db', () => ({
    getRooms: vi.fn(),
    getBranches: vi.fn(),
    getAreas: vi.fn(),
    getMinistries: vi.fn(),
    getVenueElements: vi.fn(),
    getBookingsForRoomOnDate: vi.fn(),
    createBooking: vi.fn(),
    createApproval: vi.fn(),
    updateWorker: vi.fn(),
    createWorker: vi.fn(),
    updateWorkersMinistries: vi.fn(),
    createMealStub: vi.fn(),
    deleteWorker: vi.fn(),
    deleteWorkers: vi.fn(),
}));

// Mock @/hooks/use-toast
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

// Mock @/hooks/use-audit-log
vi.mock('@/hooks/use-audit-log', () => ({
    useAuditLog: () => ({ logAction: vi.fn() }),
}));

// Mock @/hooks/use-impersonation
vi.mock('@/hooks/use-impersonation', () => ({
    useImpersonation: () => ({ startImpersonation: vi.fn() }),
}));

// Mock @/hooks/use-approvals
vi.mock('@/hooks/use-approvals', () => ({
    useApprovals: () => ({ createApproval: vi.fn() }),
}));

// Mock @/hooks/use-meal-stubs
vi.mock('@/hooks/use-meal-stubs', () => ({
    useMealStubs: () => ({ mealStubs: [] }),
}));

// Mock @/hooks/use-attendance
vi.mock('@/hooks/use-attendance', () => ({
    useAttendance: () => ({ attendance: [] }),
}));

// Mock @/hooks/use-roles
vi.mock('@/hooks/use-roles', () => ({
    useRoles: () => ({ roles: [], isLoading: false }),
}));

// Mock @/hooks/use-ministries
vi.mock('@/hooks/use-ministries', () => ({
    useMinistries: () => ({ ministries: [], isLoading: false }),
}));

// Mock @/hooks/use-departments
vi.mock('@/hooks/use-departments', () => ({
    useDepartments: () => ({ departments: [], isLoading: false }),
}));

// Mock @/hooks/use-workers
vi.mock('@/hooks/use-workers', () => ({
    useWorkers: () => ({
        workers: [],
        pagination: { total: 0, totalPages: 1 },
        isLoading: false,
        updateWorker: vi.fn(),
        createWorker: vi.fn(),
        deleteWorker: vi.fn(),
        deleteWorkers: vi.fn(),
        error: null,
    }),
    useWorkerStats: () => ({ data: { total: 0, active: 0, inactive: 0, secondary: 0, ministryStats: [] } }),
}));

// Mock @/components/layout/app-layout
vi.mock('@/components/layout/app-layout', () => ({
    AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div>,
}));

// Mock worker sub-components
vi.mock('@/components/workers/import-sheet', () => ({
    ImportSheet: () => <div data-testid="import-sheet">ImportSheet</div>,
}));
vi.mock('@/components/workers/batch-ministry-sheet', () => ({
    BatchMinistrySheet: () => <div data-testid="batch-ministry-sheet">BatchMinistrySheet</div>,
}));
vi.mock('@/components/workers/batch-meal-stub-sheet', () => ({
    BatchMealStubSheet: () => <div data-testid="batch-meal-stub-sheet">BatchMealStubSheet</div>,
}));

// Mock papaparse
vi.mock('papaparse', () => ({
    default: { parse: vi.fn() },
}));

// Mock @studio/ui — pass through Sheet/SheetContent as real divs so we can inspect children
vi.mock('@studio/ui', async () => {
    const actual = await vi.importActual<any>('@studio/ui');
    return {
        ...actual,
        // Render Sheet only when open=true
        Sheet: ({ open, children, onOpenChange }: any) =>
            open ? <div data-testid="sheet-root">{children}</div> : null,
        SheetContent: ({ children }: any) => (
            <div data-testid="sheet-content">{children}</div>
        ),
        SheetHeader: ({ children }: any) => <div data-testid="sheet-header">{children}</div>,
        SheetTitle: ({ children }: any) => <h2>{children}</h2>,
        // Keep other UI primitives as simple pass-throughs
        Button: ({ children, onClick, disabled, variant, size, ...rest }: any) => (
            <button onClick={onClick} disabled={disabled} {...rest}>{children}</button>
        ),
        Input: (props: any) => <input {...props} />,
        Label: ({ children, ...rest }: any) => <label {...rest}>{children}</label>,
        Checkbox: (props: any) => <input type="checkbox" {...props} />,
        Textarea: (props: any) => <textarea {...props} />,
        Select: ({ children, value, onValueChange }: any) => <div>{children}</div>,
        SelectTrigger: ({ children }: any) => <div>{children}</div>,
        SelectContent: ({ children }: any) => <div>{children}</div>,
        SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
        SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
        SelectGroup: ({ children }: any) => <div>{children}</div>,
        SelectLabel: ({ children }: any) => <div>{children}</div>,
        Card: ({ children, className }: any) => <div className={className}>{children}</div>,
        CardContent: ({ children }: any) => <div>{children}</div>,
        CardHeader: ({ children }: any) => <div>{children}</div>,
        CardTitle: ({ children }: any) => <div>{children}</div>,
        CardDescription: ({ children }: any) => <div>{children}</div>,
        CardFooter: ({ children }: any) => <div>{children}</div>,
        Table: ({ children }: any) => <table>{children}</table>,
        TableHeader: ({ children }: any) => <thead>{children}</thead>,
        TableRow: ({ children }: any) => <tr>{children}</tr>,
        TableHead: ({ children }: any) => <th>{children}</th>,
        TableBody: ({ children }: any) => <tbody>{children}</tbody>,
        TableCell: ({ children }: any) => <td>{children}</td>,
        Badge: ({ children }: any) => <span>{children}</span>,
        Avatar: ({ children }: any) => <div>{children}</div>,
        AvatarFallback: ({ children }: any) => <div>{children}</div>,
        AvatarImage: (props: any) => <img {...props} />,
        DropdownMenu: ({ children }: any) => <div>{children}</div>,
        DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
        DropdownMenuItem: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
        DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
        AlertDialog: ({ open, children }: any) => open ? <div>{children}</div> : null,
        AlertDialogContent: ({ children }: any) => <div>{children}</div>,
        AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
        AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
        AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
        AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
        AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
        AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
        Tabs: ({ children }: any) => <div>{children}</div>,
        TabsList: ({ children }: any) => <div>{children}</div>,
        TabsTrigger: ({ children }: any) => <div>{children}</div>,
        TabsContent: ({ children }: any) => <div>{children}</div>,
        Popover: ({ children }: any) => <div>{children}</div>,
        PopoverTrigger: ({ children }: any) => <div>{children}</div>,
        PopoverContent: ({ children }: any) => <div>{children}</div>,
        Calendar: () => <div data-testid="calendar" />,
        getWeeklyWeekdayCount: () => 0,
        getSundayCount: () => 0,
    };
});

// ---------------------------------------------------------------------------
// Bug 1: useUserRole mock factory — injectable
// ---------------------------------------------------------------------------
const mockUseUserRole = vi.fn();
vi.mock('@/hooks/use-user-role', () => ({
    useUserRole: (...args: any[]) => mockUseUserRole(...args),
}));

// ---------------------------------------------------------------------------
// Bug 1 Tests — Add Worker Sheet Empty
// ---------------------------------------------------------------------------

describe('Bug 1 — Add Worker Sheet Empty (bug condition exploration)', () => {
    beforeEach(() => {
        // Set up: canManageWorkers = true, loading done
        mockUseUserRole.mockReturnValue({
            workerProfile: { id: 'wp-1', firstName: 'Admin', lastName: 'User', majorMinistryId: null, minorMinistryId: null, roleId: 'admin' },
            canManageWorkers: true,
            isSuperAdmin: true,
            allRoles: [],
            isLoading: false,
            isMealStubAssigner: false,
            canManageAllMealStubs: false,
        });
    });

    /**
     * Property 1: Bug Condition — Add Worker Sheet Renders Form Content
     *
     * When canManageWorkers = true and "Add Worker" is clicked,
     * SheetContent MUST contain at least one input/form field.
     *
     * Expected counterexample on unfixed code:
     *   SheetContent renders with zero child elements when isSheetOpen = true
     *
     * **Validates: Requirements 1.1, 1.2 (Bug 1)**
     */
    it('Property 1: SheetContent contains at least one input field after clicking Add Worker', async () => {
        const { default: WorkersPage } = await import('@/app/workers/page');
        const { container } = render(<WorkersPage />);

        // Find and click the "Add Worker" button
        const addWorkerBtn = screen.getByText(/add worker/i);
        fireEvent.click(addWorkerBtn);

        // The Sheet should now be open — find SheetContent
        const sheetContent = screen.getByTestId('sheet-content');
        expect(sheetContent).toBeTruthy();

        // Assert: SheetContent must contain at least one input or form field
        // On unfixed code this FAILS because SheetContent is empty
        const inputs = sheetContent.querySelectorAll('input, textarea, select, [role="combobox"]');
        expect(inputs.length).toBeGreaterThan(0);
    });

    it('Property 1 (PBT): for any canManageWorkers=true state, SheetContent has form fields after Add Worker click', async () => {
        /**
         * Property-based variant: generate different worker profile shapes,
         * all with canManageWorkers=true. In every case, clicking Add Worker
         * must produce a SheetContent with at least one input.
         *
         * Expected counterexample: SheetContent has 0 inputs (empty sheet).
         */
        const workerProfileArb = fc.record({
            id: fc.uuid(),
            firstName: fc.string({ minLength: 1, maxLength: 20 }),
            lastName: fc.string({ minLength: 1, maxLength: 20 }),
            majorMinistryId: fc.option(fc.uuid(), { nil: null }),
            minorMinistryId: fc.option(fc.uuid(), { nil: null }),
            roleId: fc.constantFrom('admin', 'manager', 'viewer'),
        });

        await fc.assert(
            fc.asyncProperty(workerProfileArb, async (profile) => {
                cleanup(); // ensure clean DOM between runs
                mockUseUserRole.mockReturnValue({
                    workerProfile: profile,
                    canManageWorkers: true,
                    isSuperAdmin: false,
                    allRoles: [],
                    isLoading: false,
                    isMealStubAssigner: false,
                    canManageAllMealStubs: false,
                });

                const { default: WorkersPage } = await import('@/app/workers/page');
                const { unmount } = render(<WorkersPage />);

                const addWorkerBtns = screen.getAllByText(/add worker/i);
                fireEvent.click(addWorkerBtns[0]);

                const sheetContent = screen.queryByTestId('sheet-content');
                const inputs = sheetContent
                    ? sheetContent.querySelectorAll('input, textarea, select, [role="combobox"]')
                    : [];

                unmount();

                // This assertion FAILS on unfixed code (SheetContent is empty / not rendered)
                return inputs.length > 0;
            }),
            { numRuns: 5 },
        );
    });
});

// ---------------------------------------------------------------------------
// Bug 2 Tests — Room Reservation Always Shows "Profile Not Found"
// ---------------------------------------------------------------------------

describe('Bug 2 — Room Reservation Always Shows Profile Not Found (bug condition exploration)', () => {
    /**
     * Property 3: Bug Condition — Room Reservation Shows Spinner While Loading
     *
     * When roleLoading = true and workerProfile = undefined,
     * the page MUST show the loading spinner and MUST NOT show
     * "Worker Profile Not Found".
     *
     * Expected counterexample on unfixed code:
     *   "Worker Profile Not Found" renders when roleLoading = true
     *
     * **Validates: Requirements 1.1, 1.2, 1.3 (Bug 2)**
     */
    it('Property 3: loading spinner is shown and "Worker Profile Not Found" is NOT present when roleLoading=true', async () => {
        mockUseUserRole.mockReturnValue({
            workerProfile: undefined,
            isSuperAdmin: false,
            isLoading: true,  // roleLoading = true
            allRoles: [],
        });

        const { default: NewReservationPage } = await import('@/app/reservations/new/page');
        render(<NewReservationPage />);

        // "Worker Profile Not Found" must NOT be present while loading
        // On unfixed code this FAILS because the profile check runs before the loading check
        expect(screen.queryByText(/worker profile not found/i)).toBeNull();
    });

    it('Property 3: loading spinner element is rendered when roleLoading=true', async () => {
        mockUseUserRole.mockReturnValue({
            workerProfile: undefined,
            isSuperAdmin: false,
            isLoading: true,
            allRoles: [],
        });

        const { default: NewReservationPage } = await import('@/app/reservations/new/page');
        const { container } = render(<NewReservationPage />);

        // The spinner uses animate-spin class
        // On unfixed code this FAILS because the error screen is shown instead
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).not.toBeNull();
    });

    it('Property 3 (PBT): for any roleLoading=true state, error screen is never shown', async () => {
        /**
         * Property-based variant: generate different isSuperAdmin values.
         * When roleLoading=true, regardless of isSuperAdmin, the error screen
         * must never appear.
         *
         * Expected counterexample: "Worker Profile Not Found" text is present.
         */
        const isSuperAdminArb = fc.boolean();

        await fc.assert(
            fc.asyncProperty(isSuperAdminArb, async (isSuperAdmin) => {
                cleanup(); // ensure clean DOM between runs
                mockUseUserRole.mockReturnValue({
                    workerProfile: undefined,
                    isSuperAdmin,
                    isLoading: true,  // roleLoading = true
                    allRoles: [],
                });

                const { default: NewReservationPage } = await import('@/app/reservations/new/page');
                const { unmount } = render(<NewReservationPage />);

                const errorText = screen.queryByText(/worker profile not found/i);
                unmount();

                // This assertion FAILS on unfixed code when isSuperAdmin=false
                // because the profile check fires before the loading check
                return errorText === null;
            }),
            { numRuns: 10 },
        );
    });
});
