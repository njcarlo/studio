/**
 * Thin re-export of inventory server actions for existing client imports.
 * Prefer importing from `@/actions/inventory` in new code.
 */
export {
    getCategories,
    createCategory,
    updateCategory,
    getItems,
    getItem,
    createItem,
    updateItem,
    deleteItem,
    adjustStock,
    getLogs,
    getBorrowings,
    getBorrowing,
    getActiveBorrowingForItem,
    createBorrowing,
    returnBorrowing,
    getDashboardStats,
    lookupItemByQR,
    getLocations,
    bulkUpdateItems,
    bulkDeleteItems,
    bulkImportItems,
    importInventoryRows,
    getMinistrySummary,
    searchWorkersForInventory,
    toggleInventoryWorkerPerm,
    getReportsData,
} from '@/actions/inventory';
