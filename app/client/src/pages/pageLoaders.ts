import type { AdminPage } from "@client/pages/AdminPage";
import type { ManagePage } from "@client/pages/ManagePage";
import type { ResultDetailPage } from "@client/pages/ResultDetailPage";

interface Module<T> {
    default: T;
}

let resultDetailPagePromise: Promise<Module<typeof ResultDetailPage>> | null = null;
export const preloadResultDetailPage = () => {
    if (!resultDetailPagePromise) {
        resultDetailPagePromise = import("@client/pages/ResultDetailPage").then(m => ({
            default: m.ResultDetailPage,
        }));
    }
    return resultDetailPagePromise;
};

let managePagePromise: Promise<Module<typeof ManagePage>> | null = null;
export const preloadManagePage = () => {
    if (!managePagePromise) {
        managePagePromise = import("@client/pages/ManagePage").then(m => ({
            default: m.ManagePage,
        }));
    }
    return managePagePromise;
};

let adminPagePromise: Promise<Module<typeof AdminPage>> | null = null;
export const preloadAdminPage = () => {
    if (!adminPagePromise) {
        adminPagePromise = import("@client/pages/AdminPage").then(m => ({
            default: m.AdminPage,
        }));
    }
    return adminPagePromise;
};
