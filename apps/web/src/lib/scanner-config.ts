export interface ScannerSettings {
    lockPassword: string;
    requirePasswordToLock: boolean;
    requirePasswordToUnlock: boolean;
    autoResetSeconds: number;
    allowFallbackPasswords?: boolean;
}

export const DEFAULT_SCANNER_SETTINGS: ScannerSettings = {
    lockPassword: "CogMain123",
    requirePasswordToLock: true,
    requirePasswordToUnlock: true,
    autoResetSeconds: 5,
    allowFallbackPasswords: true,
};

export const FALLBACK_SCANNER_PASSWORDS = ['CogMain123', '2026', '1234'];
