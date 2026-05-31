export { BaseClient, ClientError } from './base-client'

import { BaseClient } from './base-client'

export class SettingsClient extends BaseClient {
  getRoles = () => this.request('GET', '/settings/roles')
  createRole = (b: any) => this.request('POST', '/settings/roles', b)
  updateRole = (id: string, b: any) => this.request('PUT', `/settings/roles/${id}`, b)
  deleteRole = (id: string) => this.request('DELETE', `/settings/roles/${id}`)
  getRolePermissions = (id: string) => this.request('GET', `/settings/roles/${id}/permissions`)
  setRolePermissions = (id: string, permissionIds: string[]) => this.request('PUT', `/settings/roles/${id}/permissions`, { permissionIds })
  getPermissions = () => this.request('GET', '/settings/permissions')
  getRooms = () => this.request('GET', '/settings/rooms')
  createRoom = (b: any) => this.request('POST', '/settings/rooms', b)
  updateRoom = (id: string, b: any) => this.request('PUT', `/settings/rooms/${id}`, b)
  deleteRoom = (id: string) => this.request('DELETE', `/settings/rooms/${id}`)
  getAreas = () => this.request('GET', '/settings/areas')
  createArea = (b: any) => this.request('POST', '/settings/areas', b)
  updateArea = (id: string, b: any) => this.request('PUT', `/settings/areas/${id}`, b)
  getBranches = () => this.request('GET', '/settings/branches')
  createBranch = (b: any) => this.request('POST', '/settings/branches', b)
  getDepartments = () => this.request('GET', '/settings/departments')
  getVenueElements = () => this.request('GET', '/settings/venue-elements')
  createVenueElement = (b: any) => this.request('POST', '/settings/venue-elements', b)
  updateVenueElement = (id: string, b: any) => this.request('PUT', `/settings/venue-elements/${id}`, b)
  deleteVenueElement = (id: string) => this.request('DELETE', `/settings/venue-elements/${id}`)
}

export class WorkersClient extends BaseClient {
  list = (p?: Record<string, string>) => this.request('GET', `/workers${p ? '?' + new URLSearchParams(p) : ''}`)
  lookup = (p: Record<string, string>) => this.request('GET', `/workers/lookup?${new URLSearchParams(p)}`)
  stats = () => this.request('GET', '/workers/stats')
  getById = (id: string) => this.request('GET', `/workers/${id}`)
  create = (b: any) => this.request('POST', '/workers', b)
  update = (id: string, b: any) => this.request('PUT', `/workers/${id}`, b)
  remove = (id: string) => this.request('DELETE', `/workers/${id}`)
  getRoles = (id: string) => this.request('GET', `/workers/${id}/roles`)
  assignRoles = (id: string, roleIds: string[], assignedBy?: string) => this.request('POST', `/workers/${id}/roles`, { roleIds, assignedBy })
  getPermissions = (id: string) => this.request('GET', `/workers/${id}/permissions`)
  getLogs = (id: string) => this.request('GET', `/workers/${id}/logs`)
}

export class MinistriesClient extends BaseClient {
  list = () => this.request('GET', '/ministries')
  getById = (id: string) => this.request('GET', `/ministries/${id}`)
  create = (b: any) => this.request('POST', '/ministries', b)
  update = (id: string, b: any) => this.request('PUT', `/ministries/${id}`, b)
  remove = (id: string) => this.request('DELETE', `/ministries/${id}`)
  listCategories = (id: string) => this.request('GET', `/ministries/${id}/workload-categories`)
  createCategory = (id: string, b: any) => this.request('POST', `/ministries/${id}/workload-categories`, b)
  updateCategory = (id: string, cid: string, b: any) => this.request('PUT', `/ministries/${id}/workload-categories/${cid}`, b)
  deleteCategory = (id: string, cid: string) => this.request('DELETE', `/ministries/${id}/workload-categories/${cid}`)
}

export class ScheduleClient extends BaseClient {
  listSchedules = (p?: Record<string, string>) => this.request('GET', `/schedule/schedules${p ? '?' + new URLSearchParams(p) : ''}`)
  getSchedule = (id: string) => this.request('GET', `/schedule/schedules/${id}`)
  createSchedule = (b: any) => this.request('POST', '/schedule/schedules', b)
  createFromTemplate = (b: any) => this.request('POST', '/schedule/schedules/from-template', b)
  updateSchedule = (id: string, b: any) => this.request('PUT', `/schedule/schedules/${id}`, b)
  deleteSchedule = (id: string) => this.request('DELETE', `/schedule/schedules/${id}`)
  listTemplates = (p?: Record<string, string>) => this.request('GET', `/schedule/templates${p ? '?' + new URLSearchParams(p) : ''}`)
  getTemplate = (id: string) => this.request('GET', `/schedule/templates/${id}`)
  createTemplate = (b: any) => this.request('POST', '/schedule/templates', b)
  updateTemplate = (id: string, b: any) => this.request('PUT', `/schedule/templates/${id}`, b)
  deleteTemplate = (id: string) => this.request('DELETE', `/schedule/templates/${id}`)
}

export class VenueClient extends BaseClient {
  listBookings = (p?: Record<string, string>) => this.request('GET', `/venue/bookings${p ? '?' + new URLSearchParams(p) : ''}`)
  createBooking = (b: any) => this.request('POST', '/venue/bookings', b)
  updateBooking = (id: string, b: any) => this.request('PUT', `/venue/bookings/${id}`, b)
  deleteBooking = (id: string) => this.request('DELETE', `/venue/bookings/${id}`)
  listVenueBookings = (p?: Record<string, string>) => this.request('GET', `/venue/venue-bookings${p ? '?' + new URLSearchParams(p) : ''}`)
  createVenueBooking = (b: any) => this.request('POST', '/venue/venue-bookings', b)
  updateVenueBooking = (id: string, b: any) => this.request('PUT', `/venue/venue-bookings/${id}`, b)
  listAssistanceRequests = (p?: Record<string, string>) => this.request('GET', `/venue/assistance-requests${p ? '?' + new URLSearchParams(p) : ''}`)
  updateAssistanceRequest = (id: string, b: any) => this.request('PUT', `/venue/assistance-requests/${id}`, b)
  listRecurringBookings = () => this.request('GET', '/venue/recurring-bookings')
  createRecurringBooking = (b: any) => this.request('POST', '/venue/recurring-bookings', b)
}

export class ApprovalsClient extends BaseClient {
  list = (p?: Record<string, string>) => this.request('GET', `/approvals/approvals${p ? '?' + new URLSearchParams(p) : ''}`)
  getById = (id: string) => this.request('GET', `/approvals/approvals/${id}`)
  create = (b: any) => this.request('POST', '/approvals/approvals', b)
  update = (id: string, b: any) => this.request('PUT', `/approvals/approvals/${id}`, b)
}

export class MealsClient extends BaseClient {
  list = (p?: Record<string, string>) => this.request('GET', `/meals/meal-stubs${p ? '?' + new URLSearchParams(p) : ''}`)
  getById = (id: string) => this.request('GET', `/meals/meal-stubs/${id}`)
  create = (b: any) => this.request('POST', '/meals/meal-stubs', b)
  bulkCreate = (stubs: any[]) => this.request('POST', '/meals/meal-stubs/bulk', { stubs })
  update = (id: string, b: any) => this.request('PUT', `/meals/meal-stubs/${id}`, b)
  remove = (id: string) => this.request('DELETE', `/meals/meal-stubs/${id}`)
  claim = (id: string) => this.request('POST', `/meals/meal-stubs/${id}/claim`)
}

export class AttendanceClient extends BaseClient {
  list = (p?: Record<string, string>) => this.request('GET', `/attendance/attendance${p ? '?' + new URLSearchParams(p) : ''}`)
  create = (b: any) => this.request('POST', '/attendance/attendance', b)
  stats = (p?: Record<string, string>) => this.request('GET', `/attendance/attendance/stats${p ? '?' + new URLSearchParams(p) : ''}`)
  listScanLogs = (limit?: number) => this.request('GET', `/attendance/scan-logs${limit ? '?limit=' + limit : ''}`)
  createScanLog = (b: any) => this.request('POST', '/attendance/scan-logs', b)
}

export class InventoryClient extends BaseClient {
  listItems = (p?: Record<string, string>) => this.request('GET', `/inventory/items${p ? '?' + new URLSearchParams(p) : ''}`)
  getItem = (id: string) => this.request('GET', `/inventory/items/${id}`)
  createItem = (b: any) => this.request('POST', '/inventory/items', b)
  updateItem = (id: string, b: any) => this.request('PUT', `/inventory/items/${id}`, b)
  deleteItem = (id: string) => this.request('DELETE', `/inventory/items/${id}`)
  listCategories = () => this.request('GET', '/inventory/categories')
  createCategory = (b: any) => this.request('POST', '/inventory/categories', b)
  updateCategory = (id: string, b: any) => this.request('PUT', `/inventory/categories/${id}`, b)
  listLogs = (p?: Record<string, string>) => this.request('GET', `/inventory/logs${p ? '?' + new URLSearchParams(p) : ''}`)
  recordAdjustment = (b: { itemId: string; delta: number; type: string; notes?: string }) => this.request('POST', '/inventory/adjustments', b)
  listBorrowings = (p?: Record<string, string>) => this.request('GET', `/inventory/borrowings${p ? '?' + new URLSearchParams(p) : ''}`)
  createBorrowing = (b: any) => this.request('POST', '/inventory/borrowings', b)
  processReturn = (id: string, b: any) => this.request('PUT', `/inventory/borrowings/${id}/return`, b)
}

export class C2SClient extends BaseClient {
  listGroups = () => this.request('GET', '/c2s/groups')
  getGroup = (id: string) => this.request('GET', `/c2s/groups/${id}`)
  createGroup = (b: any) => this.request('POST', '/c2s/groups', b)
  updateGroup = (id: string, b: any) => this.request('PUT', `/c2s/groups/${id}`, b)
  deleteGroup = (id: string) => this.request('DELETE', `/c2s/groups/${id}`)
  listMentees = (groupId?: string) => this.request('GET', `/c2s/mentees${groupId ? '?groupId=' + groupId : ''}`)
  createMentee = (b: any) => this.request('POST', '/c2s/mentees', b)
  updateMentee = (id: string, b: any) => this.request('PUT', `/c2s/mentees/${id}`, b)
  deleteMentee = (id: string) => this.request('DELETE', `/c2s/mentees/${id}`)
}
