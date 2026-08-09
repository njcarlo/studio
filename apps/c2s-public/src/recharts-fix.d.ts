// Fixes recharts JSX type errors caused by @types/react 18.3+ breaking change
// where ReactPortal now requires `children` prop.
// See: https://github.com/recharts/recharts/issues/3615

import 'react';

declare module 'react' {
    interface ReactPortal {
        children?: ReactNode;
    }
}
