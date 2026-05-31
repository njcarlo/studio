import { supabase } from '@studio/database/supabase-client'
import {
  SettingsClient, WorkersClient, MinistriesClient, ScheduleClient,
  VenueClient, ApprovalsClient, MealsClient, AttendanceClient,
  InventoryClient, C2SClient,
} from '@studio/client'

const FUNCTIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export const settingsClient   = new SettingsClient(FUNCTIONS_URL, getToken)
export const workersClient    = new WorkersClient(FUNCTIONS_URL, getToken)
export const ministriesClient = new MinistriesClient(FUNCTIONS_URL, getToken)
export const scheduleClient   = new ScheduleClient(FUNCTIONS_URL, getToken)
export const venueClient      = new VenueClient(FUNCTIONS_URL, getToken)
export const approvalsClient  = new ApprovalsClient(FUNCTIONS_URL, getToken)
export const mealsClient      = new MealsClient(FUNCTIONS_URL, getToken)
export const attendanceClient = new AttendanceClient(FUNCTIONS_URL, getToken)
export const inventoryClient  = new InventoryClient(FUNCTIONS_URL, getToken)
export const c2sClient        = new C2SClient(FUNCTIONS_URL, getToken)
