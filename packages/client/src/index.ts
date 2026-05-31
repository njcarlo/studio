export { BaseClient, ClientError } from './base-client'

// Settings
export class SettingsClient extends (await import('./base-client')).BaseClient {
  getRoles = () => this.get('/settings/roles')
  createRole = (b: any) => this.post('/settings/roles', b)
  updateRole = (id: string, b: any) => this.put(`/settings/roles/${id}`, b)
  deleteRole = (id: string) => this.del(`/settings/roles/${id}`)
  getRolePermissions = (id: string) => this.get(`/settings/roles/${id}/permissions`)
  setRolePermissions = (id: string, permissionIds: string[]) => this.put(`/settings/roles/${id}/permissions`, { permissionIds })
  getPermissions = () => this.get('/settings/permissions')
  getRooms = () => this.get('/settings/rooms')
  createRoom = (b: any) => this.post('/settings/rooms', b)
  updateRoom = (id: string, b: any) => this.put(`/settings/rooms/${id}`, b)
  deleteRoom = (id: string) => this.del(`/settings/rooms/${id}`)
  getAreas = () => this.get('/settings/areas')
  createArea = (b: any) => this.post('/settings/areas', b)
  getBranches = () => this.get('/settings/branches')
  createBranch = (b: any) => this.post('/settings/branches', b)
  getDepartments = () => this.get('/settings/departments')
  getVenueElements = () => this.get('/settings/venue-elements')
  createVenueElement = (b: any) => this.post('/settings/venue-elements', b)
  updateVenueElement = (id: string, b: any) => this.put(`/settings/venue-elements/${id}`, b)
  deleteVenueElement = (id: string) => this.del(`/settings/venue-elements/${id}`)
}

// Workers
export class WorkersClient extends (await import('./base-client')).BaseClient {
  list = (params?: Record<string,string>) => this.get(`/workers${params?'?'+new URLSearchParams(params):''}`)
  lookup = (params: Record<string,string>) => this.get(`/workers/lookup?${new URLSearchParams(params)}`)
  stats = () => this.get('/workers/stats')
  get = (id: string) => this.request('GET', `/workers/${id}`)
  create = (b: any) => this.post('/workers', b)
  update = (id: string, b: any) => this.put(`/workers/${id}`, b)
  delete = (id: string) => this.del(`/workers/${id}`)
  getRoles = (id: string) => this.request('GET', `/workers/${id}/roles`)
  assignRoles = (id: string, roleIds: string[], assignedBy?: string) => this.post(`/workers/${id}/roles`, { roleIds, assignedBy })
  getPermissions = (id: string) => this.request('GET', `/workers/${id}/permissions`)
  getLogs = (id: string) => this.request('GET', `/workers/${id}/logs`)
}

// Ministries
export class MinistriesClient extends (await import('./base-client')).BaseClient {
  list = () => this.get('/ministries')
  get = (id: string) => this.request('GET', `/ministries/${id}`)
  create = (b: any) => this.post('/ministries', b)
  update = (id: string, b: any) => this.put(`/ministries/${id}`, b)
  delete = (id: string) => this.del(`/ministries/${id}`)
  listCategories = (id: string) => this.get(`/ministries/${id}/workload-categories`)
  createCategory = (id: string, b: any) => this.post(`/ministries/${id}/workload-categories`, b)
  updateCategory = (id: string, cid: string, b: any) => this.put(`/ministries/${id}/workload-categories/${cid}`, b)
  deleteCategory = (id: string, cid: string) => this.del(`/ministries/${id}/workload-categories/${cid}`)
}

// Schedule
export class ScheduleClient extends (await import('./base-client')).BaseClient {
  listSchedules = (p?: Record<string,string>) => this.get(`/schedule/schedules${p?'?'+new URLSearchParams(p):''}`)
  getSchedule = (id: string) => this.request('GET', `/schedule/schedules/${id}`)
  createSchedule = (b: any) => this.post('/schedule/schedules', b)
  createFromTemplate = (b: any) => this.post('/schedule/schedules/from-template', b)
  updateSchedule = (id: string, b: any) => this.put(`/schedule/schedules/${id}`, b)
  deleteSchedule = (id: string) => this.del(`/schedule/schedules/${id}`)
  listAssignments = (id: string) => this.get(`/schedule/schedules/${id}/assignments`)
  upsertAssignment = (id: string, b: any) => this.post(`/schedule/schedules/${id}/assignments`, b)
  deleteAssignment = (id: string, aid: string) => this.del(`/schedule/schedules/${id}/assignments/${aid}`)
  listTemplates = (p?: Record<string,string>) => this.get(`/schedule/templates${p?'?'+new URLSearchParams(p):''}`)
  getTemplate = (id: string) => this.request('GET', `/schedule/templates/${id}`)
  createTemplate = (b: any) => this.post('/schedule/templates', b)
  updateTemplate = (id: string, b: any) => this.put(`/schedule/templates/${id}`, b)
  deleteTemplate = (id: string) => this.del(`/schedule/templates/${id}`)
}

// Venue
export class VenueClient extends (await import('./base-client')).BaseClient {
  listBookings = (p?: Record<string,string>) => this.get(`/venue/bookings${p?'?'+new URLSearchParams(p):''}`)
  createBooking = (b: any) => this.post('/venue/bookings', b)
  updateBooking = (id: string, b: any) => this.put(`/venue/bookings/${id}`, b)
  deleteBooking = (id: string) => this.del(`/venue/bookings/${id}`)
  listVenueBookings = (p?: Record<string,string>) => this.get(`/venue/venue-bookings${p?'?'+new URLSearchParams(p):''}`)
  createVenueBooking = (b: any) => this.post('/venue/venue-bookings', b)
  updateVenueBooking = (id: string, b: any) => this.put(`/venue/venue-bookings/${id}`, b)
  listAssistanceRequests = (p?: Record<string,string>) => this.get(`/venue/assistance-requests${p?'?'+new URLSearchParams(p):''}`)
  updateAssistanceRequest = (id: string, b: any) => this.put(`/venue/assistance-requests/${id}`, b)
  listRecurringBookings = () => this.get('/venue/recurring-bookings')
  createRecurringBooking = (b: any) => this.post('/venue/recurring-bookings', b)
}

// Approvals
export class ApprovalsClient extends (await import('./base-client')).BaseClient {
  list = (p?: Record<string,string>) => this.get(`/approvals/approvals${p?'?'+new URLSearchParams(p):''}`)
  get = (id: string) => this.request('GET', `/approvals/approvals/${id}`)
  create = (b: any) => this.post('/approvals/approvals', b)
  update = (id: string, b: any) => this.put(`/approvals/approvals/${id}`, b)
}

// Meals
export class MealsClient extends (await import('./base-client')).BaseClient {
  list = (p?: Record<string,string>) => this.get(`/meals/meal-stubs${p?'?'+new URLSearchParams(p):''}`)
  get = (id: string) => this.request('GET', `/meals/meal-stubs/${id}`)
  create = (b: any) => this.post('/meals/meal-stubs', b)
  bulkCreate = (stubs: any[]) => this.post('/meals/meal-stubs/bulk', { stubs })
  update = (id: string, b: any) => this.put(`/meals/meal-stubs/${id}`, b)
  delete = (id: string) => this.del(`/meals/meal-stubs/${id}`)
  claim = (id: string) => this.post(`/meals/meal-stubs/${id}/claim`)
}

// Attendance
export class AttendanceClient extends (await import('./base-client')).BaseClient {
  list = (p?: Record<string,string>) => this.get(`/attendance/attendance${p?'?'+new URLSearchParams(p):''}`)
  create = (b: any) => this.post('/attendance/attendance', b)
  stats = (p?: Record<string,string>) => this.get(`/attendance/attendance/stats${p?'?'+new URLSearchParams(p):''}`)
  listScanLogs = (limit?: number) => this.get(`/attendance/scan-logs${limit?'?limit='+limit:''}`)
  createScanLog = (b: any) => this.post('/attendance/scan-logs', b)
}

// Inventory
export class InventoryClient extends (await import('./base-client')).BaseClient {
  listItems = (p?: Record<string,string>) => this.get(`/inventory/items${p?'?'+new URLSearchParams(p):''}`)
  getItem = (id: string) => this.request('GET', `/inventory/items/${id}`)
  createItem = (b: any) => this.post('/inventory/items', b)
  updateItem = (id: string, b: any) => this.put(`/inventory/items/${id}`, b)
  deleteItem = (id: string) => this.del(`/inventory/items/${id}`)
  listCategories = () => this.get('/inventory/categories')
  createCategory = (b: any) => this.post('/inventory/categories', b)
  updateCategory = (id: string, b: any) => this.put(`/inventory/categories/${id}`, b)
  listLogs = (p?: Record<string,string>) => this.get(`/inventory/logs${p?'?'+new URLSearchParams(p):''}`)
  recordAdjustment = (b: { itemId: string; delta: number; type: string; notes?: string }) => this.post('/inventory/adjustments', b)
  listBorrowings = (p?: Record<string,string>) => this.get(`/inventory/borrowings${p?'?'+new URLSearchParams(p):''}`)
  createBorrowing = (b: any) => this.post('/inventory/borrowings', b)
  processReturn = (id: string, b: any) => this.put(`/inventory/borrowings/${id}/return`, b)
}

// C2S
export class C2SClient extends (await import('./base-client')).BaseClient {
  listGroups = () => this.get('/c2s/groups')
  getGroup = (id: string) => this.request('GET', `/c2s/groups/${id}`)
  createGroup = (b: any) => this.post('/c2s/groups', b)
  updateGroup = (id: string, b: any) => this.put(`/c2s/groups/${id}`, b)
  deleteGroup = (id: string) => this.del(`/c2s/groups/${id}`)
  listMentees = (groupId?: string) => this.get(`/c2s/mentees${groupId?'?groupId='+groupId:''}`)
  createMentee = (b: any) => this.post('/c2s/mentees', b)
  updateMentee = (id: string, b: any) => this.put(`/c2s/mentees/${id}`, b)
  deleteMentee = (id: string) => this.del(`/c2s/mentees/${id}`)
}
