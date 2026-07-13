/**
 * @studio/inventory — inventory domain (categories, items, stock, borrowings).
 * UI stays in apps/web `/inventory`. See docs/CORE_ENGINE_C2S_PLAN.md.
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
  listItemsForPicker,
} from './src/service';
