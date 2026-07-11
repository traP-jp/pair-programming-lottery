import { preloadedLazy } from "@client/utils/lazy";

export const ResultDetailPage = preloadedLazy(() =>
    import("@client/pages/ResultDetailPage").then(m => ({ default: m.ResultDetailPage }))
);
export const ManagePage = preloadedLazy(() =>
    import("@client/pages/ManagePage").then(m => ({ default: m.ManagePage }))
);
export const AdminPage = preloadedLazy(() =>
    import("@client/pages/AdminPage").then(m => ({ default: m.AdminPage }))
);
