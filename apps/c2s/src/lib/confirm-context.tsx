'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import ConfirmModal, { type ConfirmVariant } from '@/components/ConfirmModal';

export interface ConfirmOptions {
    title?: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    onConfirm?: () => void | Promise<void>;
}

interface ActiveConfirmState {
    title: string;
    description: ReactNode;
    confirmLabel: string;
    cancelLabel: string;
    variant: ConfirmVariant;
    loading: boolean;
    onConfirmAction: () => void | Promise<void>;
    onCancelAction?: () => void;
}

interface ConfirmContextType {
    confirm: (options?: ConfirmOptions) => Promise<boolean>;
    confirmAction: (options: ConfirmOptions & { onConfirm: () => void | Promise<void> }) => void;
}

const ConfirmContext = createContext<ConfirmContextType>({
    confirm: async () => false,
    confirmAction: () => {},
});

const DESTRUCTIVE_PATTERN = /\b(delete|remove|destroy|revoke|reject|deactivate|discard|erase|clear)\b/i;
const SAVE_PATTERN = /\b(save|update|apply|change)\b/i;
const LOGIN_PATTERN = /\b(login|log in|sign in|authenticate)\b/i;

function inferFormMetadata(form: HTMLFormElement, submitter: HTMLElement | null) {
    const buttonText =
        (submitter instanceof HTMLInputElement ? submitter.value : submitter?.textContent)?.trim() || '';

    const dataVariant = submitter?.dataset.confirmVariant || form.dataset.confirmVariant;
    const isDestructiveClass = Boolean(
        submitter?.className && /\b(bg-red-|bg-\[#dc2626\]|bg-\[#e6184d\])\b/.test(submitter.className)
    );
    const variant: ConfirmVariant =
        dataVariant === 'danger'
            ? 'danger'
            : dataVariant === 'default'
              ? 'default'
              : DESTRUCTIVE_PATTERN.test(buttonText) || isDestructiveClass
                ? 'danger'
                : 'default';

    const explicitTitle = submitter?.dataset.confirmTitle || form.dataset.confirmTitle;
    const explicitDesc =
        submitter?.dataset.confirmDescription ||
        submitter?.dataset.confirmMessage ||
        form.dataset.confirmDescription ||
        form.dataset.confirmMessage;
    const explicitLabel = submitter?.dataset.confirmLabel || form.dataset.confirmLabel;

    let title = explicitTitle;
    let description: string | undefined = explicitDesc;
    let confirmLabel = explicitLabel;

    if (!title) {
        if (variant === 'danger') {
            title = 'Confirm Deletion?';
        } else if (LOGIN_PATTERN.test(buttonText)) {
            title = 'Confirm Sign In?';
        } else if (SAVE_PATTERN.test(buttonText)) {
            title = 'Save Changes?';
        } else {
            title = 'Confirm Submission?';
        }
    }

    if (!description) {
        if (variant === 'danger') {
            description = 'Are you sure you want to proceed with this destructive action? This change cannot be undone.';
        } else if (LOGIN_PATTERN.test(buttonText)) {
            description = 'Confirm that you want to sign in with the entered Worker ID and password.';
        } else if (SAVE_PATTERN.test(buttonText)) {
            description = 'Are you sure you want to save and apply these updated changes?';
        } else {
            description = 'Please confirm that you want to submit this form and process your details.';
        }
    }

    if (!confirmLabel) {
        confirmLabel = variant === 'danger' ? 'Delete' : SAVE_PATTERN.test(buttonText) ? 'Save Changes' : 'Confirm';
    }

    return { variant, title, description, confirmLabel };
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [active, setActive] = useState<ActiveConfirmState | null>(null);
    const confirmedFormsRef = useRef<WeakSet<HTMLFormElement>>(new WeakSet());
    const activeRef = useRef<ActiveConfirmState | null>(null);
    activeRef.current = active;

    useEffect(() => {
        if (active) {
            document.documentElement.dataset.confirmOpen = 'true';
        } else {
            delete document.documentElement.dataset.confirmOpen;
        }
        return () => {
            delete document.documentElement.dataset.confirmOpen;
        };
    }, [active]);

    useEffect(() => {
        function handleCaptureSubmit(event: SubmitEvent) {
            const target = event.target;
            if (!(target instanceof HTMLFormElement)) return;

            const submitter = event.submitter instanceof HTMLElement ? event.submitter : null;
            const submitterText =
                (submitter instanceof HTMLInputElement ? submitter.value : submitter?.textContent)?.trim() || '';

            // Skip opted-out forms, login forms, or forms rendered inside ConfirmModal itself
            if (
                target.hasAttribute('data-no-confirm') ||
                target.closest('[data-confirm-modal="true"]') ||
                LOGIN_PATTERN.test(submitterText)
            ) {
                return;
            }

            // Allow pass-through once confirmed by the user
            if (confirmedFormsRef.current.has(target)) {
                confirmedFormsRef.current.delete(target);
                return;
            }

            // Prevent immediate submission while modal asks for confirmation
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            // Guard against queuing duplicate confirmation dialogs while one is active
            if (activeRef.current) return;

            const meta = inferFormMetadata(target, submitter);

            setActive({
                title: meta.title,
                description: meta.description,
                confirmLabel: meta.confirmLabel,
                cancelLabel: 'Cancel',
                variant: meta.variant,
                loading: false,
                onConfirmAction: async () => {
                    confirmedFormsRef.current.add(target);

                    // Keep inline spinner visible briefly while React/async handler processes
                    await new Promise((resolve) => setTimeout(resolve, 220));

                    if (target.isConnected) {
                        const validSubmitter =
                            submitter &&
                            target.contains(submitter) &&
                            !(submitter as HTMLButtonElement).disabled
                                ? submitter
                                : undefined;
                        try {
                            target.requestSubmit(validSubmitter);
                        } catch {
                            try {
                                target.requestSubmit();
                            } catch {
                                target.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                            }
                        }
                    } else {
                        confirmedFormsRef.current.delete(target);
                    }
                },
            });
        }

        window.addEventListener('submit', handleCaptureSubmit, true);
        return () => window.removeEventListener('submit', handleCaptureSubmit, true);
    }, []);

    const confirm = useCallback((options?: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setActive({
                title: options?.title ?? 'Confirm Submission?',
                description:
                    options?.description ??
                    'Please confirm that you want to proceed with this action.',
                confirmLabel:
                    options?.confirmLabel ??
                    (options?.variant === 'danger' ? 'Delete' : 'Confirm'),
                cancelLabel: options?.cancelLabel ?? 'Cancel',
                variant: options?.variant ?? 'default',
                loading: false,
                onConfirmAction: async () => {
                    if (options?.onConfirm) {
                        await options.onConfirm();
                    }
                    resolve(true);
                },
                onCancelAction: () => resolve(false),
            });
        });
    }, []);

    const confirmAction = useCallback(
        (options: ConfirmOptions & { onConfirm: () => void | Promise<void> }) => {
            setActive({
                title: options.title ?? 'Confirm Submission?',
                description:
                    options.description ??
                    'Please confirm that you want to proceed with this action.',
                confirmLabel:
                    options.confirmLabel ??
                    (options.variant === 'danger' ? 'Delete' : 'Confirm'),
                cancelLabel: options.cancelLabel ?? 'Cancel',
                variant: options.variant ?? 'default',
                loading: false,
                onConfirmAction: options.onConfirm,
            });
        },
        []
    );

    const handleCancel = useCallback(() => {
        setActive((curr) => {
            if (!curr || curr.loading) return curr;
            curr.onCancelAction?.();
            return null;
        });
    }, []);

    const handleConfirm = useCallback(async () => {
        const curr = activeRef.current;
        if (!curr || curr.loading) return;

        setActive((prev) => (prev ? { ...prev, loading: true } : prev));
        try {
            await curr.onConfirmAction();
        } finally {
            setActive(null);
        }
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm, confirmAction }}>
            {children}
            <ConfirmModal
                open={Boolean(active)}
                variant={active?.variant}
                title={active?.title ?? 'Confirm Submission?'}
                description={active?.description ?? ''}
                confirmLabel={active?.confirmLabel}
                cancelLabel={active?.cancelLabel}
                loading={active?.loading}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    return useContext(ConfirmContext);
}
