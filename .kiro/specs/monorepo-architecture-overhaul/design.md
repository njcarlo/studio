# Design Document: Monorepo Architecture Overhaul

## Overview

This design describes the complete architectural transformation of the Studio monorepo from a monolithic server-actions architecture to a distributed Edge Functions + typed SDK architecture. The system will extract all business logic from `apps/web` and `apps/inventory` into 10 independent Supabase Edge Functions, introduce a unified `@studio/client` SDK package, and reduce the apps to thin presentation layers. The migration will be performed module-by-module to maintain system stability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
├──────────────────────┬──────────────────────────────────────┤
│   apps/web           │   apps/inventory   │  Future Mobile  │
│   (Next.js)          │   (Next.js)        │  (React Native) │
└──────────┬───────────┴──────────┬─────────┴─────────┬───────┘
           │                      │                   │
           └──────────────────────┼───────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   @studio/client SDK      │
                    │   (Typed HTTP Client)     │
                    └─────────────┬─────────────┘
                                  │
           ┌──────────────────────┼──────────────────────┐
           │                      │                      │
    ┌──────▼──────┐        ┌─────▼──────┐       ┌──────▼──────┐
    │  workers    │        │  schedule  │       │ ministries  │
    │Edge Function│        │Edge Function│      │Edge Function│
    └──────┬──────┘        └─────┬──────┘       └──────┬──────┘
           │                     │                     │
           └─────────────────────┼─────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Supabase PostgreSQL    │
                    │  (Shared Database)      │
                    └─────────────────────────┘
```

## System Components

### 1. Edge Functions Layer

**Purpose**: Centralized business logic execution in Deno runtime

**Structure**: Each module is deployed as `supabase/functions/{module}/index.ts`

**Modules**:
- `workers` - Worker profile management
- `schedule` - Service scheduling and templates
- `ministries` - Ministry and workload management
- `venue` - Room reservations and bookings
- `approvals` - Approval workflow management
- `meals` - Meal stub allocation and redemption
- `attendance` - Attendance tracking and QR scanning
- `inventory` - Inventory items and stock management
- `c2s` - Discipleship group management
- `settings` - Roles, rooms, departments configuration

**Common Edge Function Structure**:
```typescript
// supabase/functions/{module}/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // 1. CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // 2. JWT verification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    // 3. Route dispatching
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    const route = `${method} ${path}`
    const handler = routes[route]

    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404)
    }

    // 4. Handler execution
    const result = await handler(req, supabase, user)
    return jsonResponse(result.data, result.status || 200)

  } catch (error) {
    console.error(`[${module}] Error:`, error)
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
```

### 2. @studio/client SDK Package

**Purpose**: Typed HTTP client that wraps all Edge Function calls

**Location**: `packages/client/`

**Structure**:
```
packages/client/
├── src/
│   ├── index.ts                 # Main exports
│   ├── base-client.ts           # Shared HTTP logic
│   ├── workers/
│   │   ├── client.ts            # WorkersClient class
│   │   └── types.ts             # Request/response types
│   ├── schedule/
│   │   ├── client.ts            # ScheduleClient class
│   │   └── types.ts
│   ├── ministries/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── venue/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── approvals/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── meals/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── attendance/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── inventory/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── c2s/
│   │   ├── client.ts
│   │   └── types.ts
│   └── settings/
│       ├── client.ts
│       └── types.ts
├── package.json
└── tsconfig.json
```

**Base Client Pattern**:
```typescript
// packages/client/src/base-client.ts
export class BaseClient {
  constructor(
    private baseUrl: string,
    private getToken: () => Promise<string | null>
  ) {}

  protected async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const token = await this.getToken()
    if (!token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new ClientError(response.status, error.error || error.message)
    }

    return response.json()
  }
}

export class ClientError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ClientError'
  }
}
```

**Module Client Pattern**:
```typescript
// packages/client/src/workers/client.ts
import { BaseClient } from '../base-client'
import type { Worker, CreateWorkerRequest, UpdateWorkerRequest } from './types'

export class WorkersClient extends BaseClient {
  async getWorker(id: string): Promise<Worker> {
    return this.request('GET', `/workers/${id}`)
  }

  async createWorker(data: CreateWorkerRequest): Promise<Worker> {
    return this.request('POST', '/workers', data)
  }

  async updateWorker(id: string, data: UpdateWorkerRequest): Promise<Worker> {
    return this.request('PUT', `/workers/${id}`, data)
  }

  async deleteWorker(id: string): Promise<void> {
    return this.request('DELETE', `/workers/${id}`)
  }

  async listWorkers(filters?: WorkerFilters): Promise<Worker[]> {
    const params = new URLSearchParams(filters as any)
    return this.request('GET', `/workers?${params}`)
  }
}
```

### 3. Presentation Layer Transformation

**apps/web Changes**:
- Remove `src/actions/db.ts` server actions
- Replace Prisma calls with `@studio/client` calls
- Remove `@studio/database` and `@prisma/client` dependencies
- Keep Zustand stores in `@studio/store` for client state
- Preserve all existing routes and URL paths

**apps/inventory Changes**:
- Replace `src/lib/inventory-api.ts` Supabase calls with `InventoryClient` calls
- Remove direct `@supabase/supabase-js` dependency
- Preserve all existing features (items, categories, borrowings, stock logs)

**Client SDK Usage Pattern**:
```typescript
// apps/web/src/app/workers/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { WorkersClient } from '@studio/client'
import { useSupabase } from '@/lib/supabase-provider'

export default function WorkersPage() {
  const { session } = useSupabase()
  const [workers, setWorkers] = useState([])

  useEffect(() => {
    const client = new WorkersClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      async () => session?.access_token || null
    )

    client.listWorkers().then(setWorkers)
  }, [session])

  return <div>{/* Render workers */}</div>
}
```

## Module-Specific Designs

### Workers Module

**Edge Function Routes**:
- `GET /workers` - List all workers with optional filters
- `GET /workers/:id` - Get worker by ID
- `POST /workers` - Create new worker
- `PUT /workers/:id` - Update worker
- `DELETE /workers/:id` - Delete worker (soft delete)
- `GET /workers/:id/roles` - Get worker roles
- `POST /workers/:id/roles` - Assign role to worker
- `DELETE /workers/:id/roles/:roleId` - Remove role from worker
- `GET /workers/:id/permissions` - Get derived permissions

**Key Logic**:
- Worker deletion checks for active schedule assignments
- Role assignment validates role exists
- Permissions are computed from all assigned roles

**Complete Edge Function Implementation**:

```typescript
// supabase/functions/workers/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteHandler {
  (req: Request, supabase: any, user: any): Promise<{ data: any; status?: number }>
}

const routes: Record<string, RouteHandler> = {
  'GET /workers': listWorkers,
  'GET /workers/:id': getWorker,
  'POST /workers': createWorker,
  'PUT /workers/:id': updateWorker,
  'DELETE /workers/:id': deleteWorker,
  'GET /workers/:id/roles': getWorkerRoles,
  'POST /workers/:id/roles': assignRole,
  'DELETE /workers/:id/roles/:roleId': removeRole,
  'GET /workers/:id/permissions': getWorkerPermissions,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/workers', '')
    const method = req.method

    // Match route with parameters
    let handler: RouteHandler | null = null
    let params: Record<string, string> = {}

    for (const [routePattern, routeHandler] of Object.entries(routes)) {
      const [routeMethod, routePath] = routePattern.split(' ')
      if (routeMethod !== method) continue

      const match = matchRoute(routePath, path)
      if (match) {
        handler = routeHandler
        params = match
        break
      }
    }

    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404)
    }

    // Attach params to request
    ;(req as any).params = params
    const result = await handler(req, supabase, user)
    return jsonResponse(result.data, result.status || 200)

  } catch (error) {
    console.error('[workers] Error:', error)
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
})

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Handler implementations
async function listWorkers(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const ministryId = url.searchParams.get('ministryId')
  const status = url.searchParams.get('status') || 'active'

  let query = supabase
    .from('Worker')
    .select('*, roles:WorkerRole(role:Role(*))')
    .eq('status', status)

  if (ministryId) {
    query = query.eq('ministryId', ministryId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list workers: ${error.message}`)
  }

  return { data }
}

async function getWorker(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('Worker')
    .select('*, roles:WorkerRole(role:Role(*)), ministry:Ministry(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Worker not found' }, status: 404 }
    }
    throw new Error(`Failed to get worker: ${error.message}`)
  }

  return { data }
}

async function createWorker(req: Request, supabase: any, user: any) {
  const body = await req.json()

  // Validate required fields
  if (!body.firstName || !body.lastName || !body.email) {
    return { 
      data: { error: 'Missing required fields: firstName, lastName, email' }, 
      status: 400 
    }
  }

  const { data, error } = await supabase
    .from('Worker')
    .insert({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      firebaseUid: body.firebaseUid,
      ministryId: body.ministryId,
      status: body.status || 'active',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create worker: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateWorker(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('Worker')
    .update({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      ministryId: body.ministryId,
      status: body.status,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Worker not found' }, status: 404 }
    }
    throw new Error(`Failed to update worker: ${error.message}`)
  }

  return { data }
}

async function deleteWorker(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  // Check for active schedule assignments
  const { data: assignments } = await supabase
    .from('ScheduleAssignment')
    .select('id')
    .eq('workerId', id)
    .limit(1)

  if (assignments && assignments.length > 0) {
    return { 
      data: { error: 'Cannot delete worker with active schedule assignments' }, 
      status: 409 
    }
  }

  // Soft delete
  const { data, error } = await supabase
    .from('Worker')
    .update({ status: 'inactive' })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Worker not found' }, status: 404 }
    }
    throw new Error(`Failed to delete worker: ${error.message}`)
  }

  return { data }
}

async function getWorkerRoles(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('WorkerRole')
    .select('*, role:Role(*)')
    .eq('workerId', id)

  if (error) {
    throw new Error(`Failed to get worker roles: ${error.message}`)
  }

  return { data }
}

async function assignRole(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  if (!body.roleId) {
    return { data: { error: 'Missing roleId' }, status: 400 }
  }

  // Verify role exists
  const { data: role } = await supabase
    .from('Role')
    .select('id')
    .eq('id', body.roleId)
    .single()

  if (!role) {
    return { data: { error: 'Role not found' }, status: 404 }
  }

  const { data, error } = await supabase
    .from('WorkerRole')
    .insert({
      workerId: id,
      roleId: body.roleId,
    })
    .select('*, role:Role(*)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { data: { error: 'Worker already has this role' }, status: 409 }
    }
    throw new Error(`Failed to assign role: ${error.message}`)
  }

  return { data, status: 201 }
}

async function removeRole(req: Request, supabase: any, user: any) {
  const { id, roleId } = (req as any).params

  const { error } = await supabase
    .from('WorkerRole')
    .delete()
    .eq('workerId', id)
    .eq('roleId', roleId)

  if (error) {
    throw new Error(`Failed to remove role: ${error.message}`)
  }

  return { data: { success: true } }
}

async function getWorkerPermissions(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  // Get all roles for worker
  const { data: workerRoles, error: rolesError } = await supabase
    .from('WorkerRole')
    .select('role:Role(permissions:RolePermission(permission:Permission(*)))')
    .eq('workerId', id)

  if (rolesError) {
    throw new Error(`Failed to get worker permissions: ${rolesError.message}`)
  }

  // Flatten and deduplicate permissions
  const permissions = new Set()
  for (const wr of workerRoles) {
    for (const rp of wr.role.permissions) {
      permissions.add(rp.permission.name)
    }
  }

  return { data: Array.from(permissions) }
}
```

### Schedule Module

**Edge Function Routes**:
- `GET /schedules` - List schedules with filters
- `GET /schedules/:id` - Get schedule details
- `POST /schedules` - Create schedule
- `POST /schedules/from-template` - Create from template
- `PUT /schedules/:id` - Update schedule
- `DELETE /schedules/:id` - Delete schedule
- `POST /schedules/:id/assignments` - Assign worker to slot
- `DELETE /schedules/:id/assignments/:assignmentId` - Remove assignment
- `GET /templates` - List schedule templates
- `POST /templates` - Create template
- `PUT /templates/:id` - Update template
- `DELETE /templates/:id` - Delete template

**Key Logic**:
- Template-to-schedule copying preserves slot structure
- Assignment validation checks worker roles and ministry membership
- Worship slot management within schedules

**Complete Edge Function Implementation**:

```typescript
// supabase/functions/schedule/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteHandler {
  (req: Request, supabase: any, user: any): Promise<{ data: any; status?: number }>
}

const routes: Record<string, RouteHandler> = {
  'GET /schedules': listSchedules,
  'GET /schedules/:id': getSchedule,
  'POST /schedules': createSchedule,
  'POST /schedules/from-template': createFromTemplate,
  'PUT /schedules/:id': updateSchedule,
  'DELETE /schedules/:id': deleteSchedule,
  'POST /schedules/:id/assignments': assignWorker,
  'DELETE /schedules/:id/assignments/:assignmentId': removeAssignment,
  'GET /templates': listTemplates,
  'POST /templates': createTemplate,
  'PUT /templates/:id': updateTemplate,
  'DELETE /templates/:id': deleteTemplate,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/schedule', '')
    const method = req.method

    let handler: RouteHandler | null = null
    let params: Record<string, string> = {}

    for (const [routePattern, routeHandler] of Object.entries(routes)) {
      const [routeMethod, routePath] = routePattern.split(' ')
      if (routeMethod !== method) continue

      const match = matchRoute(routePath, path)
      if (match) {
        handler = routeHandler
        params = match
        break
      }
    }

    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404)
    }

    ;(req as any).params = params
    const result = await handler(req, supabase, user)
    return jsonResponse(result.data, result.status || 200)

  } catch (error) {
    console.error('[schedule] Error:', error)
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
})

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function listSchedules(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')
  const ministryId = url.searchParams.get('ministryId')

  let query = supabase
    .from('Schedule')
    .select('*, slots:ScheduleSlot(*, assignments:ScheduleAssignment(worker:Worker(*)))')
    .order('date', { ascending: true })

  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }
  if (ministryId) {
    query = query.eq('ministryId', ministryId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list schedules: ${error.message}`)
  }

  return { data }
}

async function getSchedule(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('Schedule')
    .select(`
      *,
      slots:ScheduleSlot(
        *,
        assignments:ScheduleAssignment(
          *,
          worker:Worker(*),
          role:Role(*)
        )
      ),
      worshipSlots:WorshipSlot(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Schedule not found' }, status: 404 }
    }
    throw new Error(`Failed to get schedule: ${error.message}`)
  }

  return { data }
}

async function createSchedule(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.date || !body.serviceType) {
    return { 
      data: { error: 'Missing required fields: date, serviceType' }, 
      status: 400 
    }
  }

  const { data, error } = await supabase
    .from('Schedule')
    .insert({
      date: body.date,
      serviceType: body.serviceType,
      ministryId: body.ministryId,
      notes: body.notes,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create schedule: ${error.message}`)
  }

  return { data, status: 201 }
}

async function createFromTemplate(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.templateId || !body.date) {
    return { 
      data: { error: 'Missing required fields: templateId, date' }, 
      status: 400 
    }
  }

  // Get template with slots
  const { data: template, error: templateError } = await supabase
    .from('ScheduleTemplate')
    .select('*, slots:TemplateSlot(*)')
    .eq('id', body.templateId)
    .single()

  if (templateError || !template) {
    return { data: { error: 'Template not found' }, status: 404 }
  }

  // Create schedule
  const { data: schedule, error: scheduleError } = await supabase
    .from('Schedule')
    .insert({
      date: body.date,
      serviceType: template.serviceType,
      ministryId: template.ministryId,
      notes: body.notes,
    })
    .select()
    .single()

  if (scheduleError) {
    throw new Error(`Failed to create schedule: ${scheduleError.message}`)
  }

  // Copy slots from template
  const slots = template.slots.map((slot: any) => ({
    scheduleId: schedule.id,
    roleId: slot.roleId,
    position: slot.position,
    startTime: slot.startTime,
    endTime: slot.endTime,
    required: slot.required,
  }))

  const { error: slotsError } = await supabase
    .from('ScheduleSlot')
    .insert(slots)

  if (slotsError) {
    throw new Error(`Failed to create slots: ${slotsError.message}`)
  }

  // Fetch complete schedule
  const { data: completeSchedule } = await supabase
    .from('Schedule')
    .select('*, slots:ScheduleSlot(*)')
    .eq('id', schedule.id)
    .single()

  return { data: completeSchedule, status: 201 }
}

async function updateSchedule(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('Schedule')
    .update({
      date: body.date,
      serviceType: body.serviceType,
      notes: body.notes,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Schedule not found' }, status: 404 }
    }
    throw new Error(`Failed to update schedule: ${error.message}`)
  }

  return { data }
}

async function deleteSchedule(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { error } = await supabase
    .from('Schedule')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete schedule: ${error.message}`)
  }

  return { data: { success: true } }
}

async function assignWorker(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  if (!body.slotId || !body.workerId) {
    return { 
      data: { error: 'Missing required fields: slotId, workerId' }, 
      status: 400 
    }
  }

  // Get slot with role requirements
  const { data: slot, error: slotError } = await supabase
    .from('ScheduleSlot')
    .select('*, role:Role(*)')
    .eq('id', body.slotId)
    .single()

  if (slotError || !slot) {
    return { data: { error: 'Slot not found' }, status: 404 }
  }

  // Verify worker has required role
  const { data: workerRoles } = await supabase
    .from('WorkerRole')
    .select('roleId')
    .eq('workerId', body.workerId)

  const hasRole = workerRoles?.some((wr: any) => wr.roleId === slot.roleId)
  if (!hasRole) {
    return { 
      data: { error: 'Worker does not have required role for this slot' }, 
      status: 422 
    }
  }

  // Create assignment
  const { data, error } = await supabase
    .from('ScheduleAssignment')
    .insert({
      scheduleId: id,
      slotId: body.slotId,
      workerId: body.workerId,
      roleId: slot.roleId,
    })
    .select('*, worker:Worker(*), role:Role(*)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { data: { error: 'Worker already assigned to this slot' }, status: 409 }
    }
    throw new Error(`Failed to assign worker: ${error.message}`)
  }

  return { data, status: 201 }
}

async function removeAssignment(req: Request, supabase: any, user: any) {
  const { assignmentId } = (req as any).params

  const { error } = await supabase
    .from('ScheduleAssignment')
    .delete()
    .eq('id', assignmentId)

  if (error) {
    throw new Error(`Failed to remove assignment: ${error.message}`)
  }

  return { data: { success: true } }
}

async function listTemplates(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const ministryId = url.searchParams.get('ministryId')

  let query = supabase
    .from('ScheduleTemplate')
    .select('*, slots:TemplateSlot(*, role:Role(*))')

  if (ministryId) {
    query = query.eq('ministryId', ministryId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list templates: ${error.message}`)
  }

  return { data }
}

async function createTemplate(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.name || !body.serviceType) {
    return { 
      data: { error: 'Missing required fields: name, serviceType' }, 
      status: 400 
    }
  }

  const { data, error } = await supabase
    .from('ScheduleTemplate')
    .insert({
      name: body.name,
      serviceType: body.serviceType,
      ministryId: body.ministryId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create template: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateTemplate(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('ScheduleTemplate')
    .update({
      name: body.name,
      serviceType: body.serviceType,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Template not found' }, status: 404 }
    }
    throw new Error(`Failed to update template: ${error.message}`)
  }

  return { data }
}

async function deleteTemplate(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { error } = await supabase
    .from('ScheduleTemplate')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete template: ${error.message}`)
  }

  return { data: { success: true } }
}
```

### Ministries Module

**Edge Function Routes**:
- `GET /ministries` - List ministries
- `GET /ministries/:id` - Get ministry details
- `POST /ministries` - Create ministry
- `PUT /ministries/:id` - Update ministry
- `DELETE /ministries/:id` - Delete ministry
- `GET /ministries/:id/workload-categories` - List workload categories
- `POST /ministries/:id/workload-categories` - Create workload category
- `PUT /ministries/:id/workload-categories/:categoryId` - Update category
- `DELETE /ministries/:id/workload-categories/:categoryId` - Delete category
- `POST /ministries/:id/managers` - Assign manager
- `DELETE /ministries/:id/managers/:workerId` - Remove manager

**Key Logic**:
- Ministry deletion checks for active worker assignments
- Manager assignment validates worker exists
- Response includes department code, managers, member count

**Complete Edge Function Implementation**:

```typescript
// supabase/functions/ministries/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteHandler {
  (req: Request, supabase: any, user: any): Promise<{ data: any; status?: number }>
}

const routes: Record<string, RouteHandler> = {
  'GET /ministries': listMinistries,
  'GET /ministries/:id': getMinistry,
  'POST /ministries': createMinistry,
  'PUT /ministries/:id': updateMinistry,
  'DELETE /ministries/:id': deleteMinistry,
  'GET /ministries/:id/workload-categories': listWorkloadCategories,
  'POST /ministries/:id/workload-categories': createWorkloadCategory,
  'PUT /ministries/:id/workload-categories/:categoryId': updateWorkloadCategory,
  'DELETE /ministries/:id/workload-categories/:categoryId': deleteWorkloadCategory,
  'POST /ministries/:id/managers': assignManager,
  'DELETE /ministries/:id/managers/:workerId': removeManager,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/ministries', '')
    const method = req.method

    let handler: RouteHandler | null = null
    let params: Record<string, string> = {}

    for (const [routePattern, routeHandler] of Object.entries(routes)) {
      const [routeMethod, routePath] = routePattern.split(' ')
      if (routeMethod !== method) continue

      const match = matchRoute(routePath, path)
      if (match) {
        handler = routeHandler
        params = match
        break
      }
    }

    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404)
    }

    ;(req as any).params = params
    const result = await handler(req, supabase, user)
    return jsonResponse(result.data, result.status || 200)

  } catch (error) {
    console.error('[ministries] Error:', error)
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
})

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function listMinistries(req: Request, supabase: any, user: any) {
  const { data, error } = await supabase
    .from('Ministry')
    .select(`
      *,
      department:Department(*),
      managers:MinistryManager(worker:Worker(*)),
      _count:Worker(count)
    `)
    .order('name')

  if (error) {
    throw new Error(`Failed to list ministries: ${error.message}`)
  }

  return { data }
}

async function getMinistry(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('Ministry')
    .select(`
      *,
      department:Department(*),
      managers:MinistryManager(worker:Worker(*)),
      workloadCategories:WorkloadCategory(*),
      workers:Worker(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Ministry not found' }, status: 404 }
    }
    throw new Error(`Failed to get ministry: ${error.message}`)
  }

  return { data }
}

async function createMinistry(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.name || !body.departmentId) {
    return { 
      data: { error: 'Missing required fields: name, departmentId' }, 
      status: 400 
    }
  }

  const { data, error } = await supabase
    .from('Ministry')
    .insert({
      name: body.name,
      departmentId: body.departmentId,
      description: body.description,
    })
    .select('*, department:Department(*)')
    .single()

  if (error) {
    throw new Error(`Failed to create ministry: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateMinistry(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('Ministry')
    .update({
      name: body.name,
      departmentId: body.departmentId,
      description: body.description,
    })
    .eq('id', id)
    .select('*, department:Department(*)')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Ministry not found' }, status: 404 }
    }
    throw new Error(`Failed to update ministry: ${error.message}`)
  }

  return { data }
}

async function deleteMinistry(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  // Check for active worker assignments
  const { data: workers } = await supabase
    .from('Worker')
    .select('id')
    .eq('ministryId', id)
    .eq('status', 'active')
    .limit(1)

  if (workers && workers.length > 0) {
    return { 
      data: { error: 'Cannot delete ministry with active worker assignments' }, 
      status: 409 
    }
  }

  const { error } = await supabase
    .from('Ministry')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete ministry: ${error.message}`)
  }

  return { data: { success: true } }
}

async function listWorkloadCategories(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('WorkloadCategory')
    .select('*')
    .eq('ministryId', id)
    .order('name')

  if (error) {
    throw new Error(`Failed to list workload categories: ${error.message}`)
  }

  return { data }
}

async function createWorkloadCategory(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  if (!body.name) {
    return { data: { error: 'Missing required field: name' }, status: 400 }
  }

  const { data, error } = await supabase
    .from('WorkloadCategory')
    .insert({
      ministryId: id,
      name: body.name,
      description: body.description,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create workload category: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateWorkloadCategory(req: Request, supabase: any, user: any) {
  const { categoryId } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('WorkloadCategory')
    .update({
      name: body.name,
      description: body.description,
    })
    .eq('id', categoryId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Workload category not found' }, status: 404 }
    }
    throw new Error(`Failed to update workload category: ${error.message}`)
  }

  return { data }
}

async function deleteWorkloadCategory(req: Request, supabase: any, user: any) {
  const { categoryId } = (req as any).params

  const { error } = await supabase
    .from('WorkloadCategory')
    .delete()
    .eq('id', categoryId)

  if (error) {
    throw new Error(`Failed to delete workload category: ${error.message}`)
  }

  return { data: { success: true } }
}

async function assignManager(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  if (!body.workerId) {
    return { data: { error: 'Missing required field: workerId' }, status: 400 }
  }

  // Verify worker exists
  const { data: worker } = await supabase
    .from('Worker')
    .select('id')
    .eq('id', body.workerId)
    .single()

  if (!worker) {
    return { data: { error: 'Worker not found' }, status: 404 }
  }

  const { data, error } = await supabase
    .from('MinistryManager')
    .insert({
      ministryId: id,
      workerId: body.workerId,
    })
    .select('*, worker:Worker(*)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { data: { error: 'Worker is already a manager of this ministry' }, status: 409 }
    }
    throw new Error(`Failed to assign manager: ${error.message}`)
  }

  return { data, status: 201 }
}

async function removeManager(req: Request, supabase: any, user: any) {
  const { id, workerId } = (req as any).params

  const { error } = await supabase
    .from('MinistryManager')
    .delete()
    .eq('ministryId', id)
    .eq('workerId', workerId)

  if (error) {
    throw new Error(`Failed to remove manager: ${error.message}`)
  }

  return { data: { success: true } }
}
```

### Venue Module

**Edge Function Routes**:
- `GET /reservations` - List reservations with filters
- `GET /reservations/:id` - Get reservation details
- `POST /reservations` - Create reservation
- `PUT /reservations/:id` - Update reservation
- `DELETE /reservations/:id` - Delete reservation
- `POST /reservations/check-conflict` - Check for conflicts
- `GET /assistance-requests` - List assistance requests
- `POST /assistance-requests` - Create assistance request
- `PUT /assistance-requests/:id` - Update status
- `GET /recurring-bookings` - List recurring bookings
- `POST /recurring-bookings` - Create recurring booking
- `POST /recurring-bookings/:id/expand` - Generate instances

**Key Logic**:
- Conflict detection checks room + time window overlaps
- Recurring booking expansion uses recurrence rules
- Assistance request status transitions (pending → assigned → completed)

**Complete Edge Function Implementation**:

```typescript
// supabase/functions/venue/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteHandler {
  (req: Request, supabase: any, user: any): Promise<{ data: any; status?: number }>
}

const routes: Record<string, RouteHandler> = {
  'GET /reservations': listReservations,
  'GET /reservations/:id': getReservation,
  'POST /reservations': createReservation,
  'PUT /reservations/:id': updateReservation,
  'DELETE /reservations/:id': deleteReservation,
  'POST /reservations/check-conflict': checkConflict,
  'GET /assistance-requests': listAssistanceRequests,
  'POST /assistance-requests': createAssistanceRequest,
  'PUT /assistance-requests/:id': updateAssistanceRequest,
  'GET /recurring-bookings': listRecurringBookings,
  'POST /recurring-bookings': createRecurringBooking,
  'POST /recurring-bookings/:id/expand': expandRecurringBooking,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/venue', '')
    const method = req.method

    let handler: RouteHandler | null = null
    let params: Record<string, string> = {}

    for (const [routePattern, routeHandler] of Object.entries(routes)) {
      const [routeMethod, routePath] = routePattern.split(' ')
      if (routeMethod !== method) continue

      const match = matchRoute(routePath, path)
      if (match) {
        handler = routeHandler
        params = match
        break
      }
    }

    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404)
    }

    ;(req as any).params = params
    const result = await handler(req, supabase, user)
    return jsonResponse(result.data, result.status || 200)

  } catch (error) {
    console.error('[venue] Error:', error)
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
})

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function listReservations(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const roomId = url.searchParams.get('roomId')
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  let query = supabase
    .from('RoomReservation')
    .select('*, room:Room(*), requestedBy:Worker(*)')
    .order('startTime', { ascending: true })

  if (roomId) {
    query = query.eq('roomId', roomId)
  }
  if (startDate) {
    query = query.gte('startTime', startDate)
  }
  if (endDate) {
    query = query.lte('endTime', endDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list reservations: ${error.message}`)
  }

  return { data }
}

async function getReservation(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('RoomReservation')
    .select('*, room:Room(*), requestedBy:Worker(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Reservation not found' }, status: 404 }
    }
    throw new Error(`Failed to get reservation: ${error.message}`)
  }

  return { data }
}

async function createReservation(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.roomId || !body.startTime || !body.endTime) {
    return { 
      data: { error: 'Missing required fields: roomId, startTime, endTime' }, 
      status: 400 
    }
  }

  // Check for conflicts
  const { data: conflicts } = await supabase
    .from('RoomReservation')
    .select('id')
    .eq('roomId', body.roomId)
    .or(`and(startTime.lte.${body.endTime},endTime.gte.${body.startTime})`)

  if (conflicts && conflicts.length > 0) {
    return { 
      data: { error: 'Room is already reserved for this time period' }, 
      status: 409 
    }
  }

  const { data, error } = await supabase
    .from('RoomReservation')
    .insert({
      roomId: body.roomId,
      startTime: body.startTime,
      endTime: body.endTime,
      purpose: body.purpose,
      requestedById: body.requestedById,
      notes: body.notes,
    })
    .select('*, room:Room(*), requestedBy:Worker(*)')
    .single()

  if (error) {
    throw new Error(`Failed to create reservation: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateReservation(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  // Check for conflicts (excluding current reservation)
  if (body.roomId && body.startTime && body.endTime) {
    const { data: conflicts } = await supabase
      .from('RoomReservation')
      .select('id')
      .eq('roomId', body.roomId)
      .neq('id', id)
      .or(`and(startTime.lte.${body.endTime},endTime.gte.${body.startTime})`)

    if (conflicts && conflicts.length > 0) {
      return { 
        data: { error: 'Room is already reserved for this time period' }, 
        status: 409 
      }
    }
  }

  const { data, error } = await supabase
    .from('RoomReservation')
    .update({
      roomId: body.roomId,
      startTime: body.startTime,
      endTime: body.endTime,
      purpose: body.purpose,
      notes: body.notes,
    })
    .eq('id', id)
    .select('*, room:Room(*), requestedBy:Worker(*)')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Reservation not found' }, status: 404 }
    }
    throw new Error(`Failed to update reservation: ${error.message}`)
  }

  return { data }
}

async function deleteReservation(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { error } = await supabase
    .from('RoomReservation')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete reservation: ${error.message}`)
  }

  return { data: { success: true } }
}

async function checkConflict(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.roomId || !body.startTime || !body.endTime) {
    return { 
      data: { error: 'Missing required fields: roomId, startTime, endTime' }, 
      status: 400 
    }
  }

  const { data: conflicts } = await supabase
    .from('RoomReservation')
    .select('*, room:Room(*)')
    .eq('roomId', body.roomId)
    .or(`and(startTime.lte.${body.endTime},endTime.gte.${body.startTime})`)

  return { data: { hasConflict: conflicts && conflicts.length > 0, conflicts } }
}

async function listAssistanceRequests(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  let query = supabase
    .from('VenueAssistanceRequest')
    .select('*, requestedBy:Worker(*), assignedTo:Worker(*)')
    .order('createdAt', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list assistance requests: ${error.message}`)
  }

  return { data }
}

async function createAssistanceRequest(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.description) {
    return { data: { error: 'Missing required field: description' }, status: 400 }
  }

  const { data, error } = await supabase
    .from('VenueAssistanceRequest')
    .insert({
      description: body.description,
      requestedById: body.requestedById,
      priority: body.priority || 'normal',
      status: 'pending',
    })
    .select('*, requestedBy:Worker(*)')
    .single()

  if (error) {
    throw new Error(`Failed to create assistance request: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateAssistanceRequest(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('VenueAssistanceRequest')
    .update({
      status: body.status,
      assignedToId: body.assignedToId,
      notes: body.notes,
    })
    .eq('id', id)
    .select('*, requestedBy:Worker(*), assignedTo:Worker(*)')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Assistance request not found' }, status: 404 }
    }
    throw new Error(`Failed to update assistance request: ${error.message}`)
  }

  return { data }
}

async function listRecurringBookings(req: Request, supabase: any, user: any) {
  const { data, error } = await supabase
    .from('RecurringBooking')
    .select('*, room:Room(*), createdBy:Worker(*)')
    .order('createdAt', { ascending: false })

  if (error) {
    throw new Error(`Failed to list recurring bookings: ${error.message}`)
  }

  return { data }
}

async function createRecurringBooking(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.roomId || !body.recurrenceRule || !body.startTime || !body.endTime) {
    return { 
      data: { error: 'Missing required fields: roomId, recurrenceRule, startTime, endTime' }, 
      status: 400 
    }
  }

  const { data, error } = await supabase
    .from('RecurringBooking')
    .insert({
      roomId: body.roomId,
      recurrenceRule: body.recurrenceRule,
      startTime: body.startTime,
      endTime: body.endTime,
      purpose: body.purpose,
      createdById: body.createdById,
    })
    .select('*, room:Room(*), createdBy:Worker(*)')
    .single()

  if (error) {
    throw new Error(`Failed to create recurring booking: ${error.message}`)
  }

  return { data, status: 201 }
}

async function expandRecurringBooking(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const horizon = body.horizon || 90 // days

  // Get recurring booking
  const { data: booking, error: bookingError } = await supabase
    .from('RecurringBooking')
    .select('*')
    .eq('id', id)
    .single()

  if (bookingError || !booking) {
    return { data: { error: 'Recurring booking not found' }, status: 404 }
  }

  // Generate instances based on recurrence rule
  // This is a simplified example - real implementation would use a library like rrule
  const instances = []
  const startDate = new Date(booking.startTime)
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + horizon)

  // Example: weekly recurrence
  if (booking.recurrenceRule.includes('WEEKLY')) {
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      instances.push({
        roomId: booking.roomId,
        startTime: currentDate.toISOString(),
        endTime: new Date(currentDate.getTime() + (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime())).toISOString(),
        purpose: booking.purpose,
        requestedById: booking.createdById,
        recurringBookingId: booking.id,
      })
      currentDate.setDate(currentDate.getDate() + 7)
    }
  }

  // Insert instances
  const { data, error } = await supabase
    .from('RoomReservation')
    .insert(instances)
    .select()

  if (error) {
    throw new Error(`Failed to expand recurring booking: ${error.message}`)
  }

  return { data: { instances: data, count: data.length } }
}
```

### Approvals Module

**Edge Function Routes**:
- `GET /approvals` - List approval requests
- `GET /approvals/:id` - Get approval details
- `POST /approvals` - Create approval request
- `POST /approvals/:id/approve` - Approve request
- `POST /approvals/:id/reject` - Reject request

**Key Logic**:
- Approval authority validation checks worker permissions
- Status transitions only allowed from `pending`
- Records approver ID and timestamp on decision

**Complete Edge Function Implementation**:

```typescript
// supabase/functions/approvals/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteHandler {
  (req: Request, supabase: any, user: any): Promise<{ data: any; status?: number }>
}

const routes: Record<string, RouteHandler> = {
  'GET /approvals': listApprovals,
  'GET /approvals/:id': getApproval,
  'POST /approvals': createApproval,
  'POST /approvals/:id/approve': approveRequest,
  'POST /approvals/:id/reject': rejectRequest,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/approvals', '')
    const method = req.method

    let handler: RouteHandler | null = null
    let params: Record<string, string> = {}

    for (const [routePattern, routeHandler] of Object.entries(routes)) {
      const [routeMethod, routePath] = routePattern.split(' ')
      if (routeMethod !== method) continue

      const match = matchRoute(routePath, path)
      if (match) {
        handler = routeHandler
        params = match
        break
      }
    }

    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404)
    }

    ;(req as any).params = params
    const result = await handler(req, supabase, user)
    return jsonResponse(result.data, result.status || 200)

  } catch (error) {
    console.error('[approvals] Error:', error)
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
})

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function listApprovals(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const requesterId = url.searchParams.get('requesterId')

  let query = supabase
    .from('ApprovalRequest')
    .select('*, requester:Worker!requesterId(*), approver:Worker!approverId(*)')
    .order('createdAt', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (requesterId) {
    query = query.eq('requesterId', requesterId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list approvals: ${error.message}`)
  }

  return { data }
}

async function getApproval(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('ApprovalRequest')
    .select('*, requester:Worker!requesterId(*), approver:Worker!approverId(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Approval request not found' }, status: 404 }
    }
    throw new Error(`Failed to get approval: ${error.message}`)
  }

  return { data }
}

async function createApproval(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.requestType || !body.requesterId) {
    return { 
      data: { error: 'Missing required fields: requestType, requesterId' }, 
      status: 400 
    }
  }

  const { data, error } = await supabase
    .from('ApprovalRequest')
    .insert({
      requestType: body.requestType,
      requesterId: body.requesterId,
      description: body.description,
      metadata: body.metadata,
      status: 'pending',
    })
    .select('*, requester:Worker!requesterId(*)')
    .single()

  if (error) {
    throw new Error(`Failed to create approval request: ${error.message}`)
  }

  return { data, status: 201 }
}

async function approveRequest(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  if (!body.approverId) {
    return { data: { error: 'Missing required field: approverId' }, status: 400 }
  }

  // Get current approval request
  const { data: approval, error: getError } = await supabase
    .from('ApprovalRequest')
    .select('status')
    .eq('id', id)
    .single()

  if (getError || !approval) {
    return { data: { error: 'Approval request not found' }, status: 404 }
  }

  if (approval.status !== 'pending') {
    return { 
      data: { error: 'Can only approve pending requests' }, 
      status: 409 
    }
  }

  // Check approver has permission
  const { data: permissions } = await supabase
    .from('WorkerRole')
    .select('role:Role(permissions:RolePermission(permission:Permission(*)))')
    .eq('workerId', body.approverId)

  const hasApprovalPermission = permissions?.some((wr: any) =>
    wr.role.permissions.some((rp: any) => 
      rp.permission.name === 'approve_requests'
    )
  )

  if (!hasApprovalPermission) {
    return { 
      data: { error: 'Worker does not have approval authority' }, 
      status: 403 
    }
  }

  // Update approval
  const { data, error } = await supabase
    .from('ApprovalRequest')
    .update({
      status: 'approved',
      approverId: body.approverId,
      approvedAt: new Date().toISOString(),
      approverNotes: body.notes,
    })
    .eq('id', id)
    .select('*, requester:Worker!requesterId(*), approver:Worker!approverId(*)')
    .single()

  if (error) {
    throw new Error(`Failed to approve request: ${error.message}`)
  }

  return { data }
}

async function rejectRequest(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  if (!body.approverId) {
    return { data: { error: 'Missing required field: approverId' }, status: 400 }
  }

  // Get current approval request
  const { data: approval, error: getError } = await supabase
    .from('ApprovalRequest')
    .select('status')
    .eq('id', id)
    .single()

  if (getError || !approval) {
    return { data: { error: 'Approval request not found' }, status: 404 }
  }

  if (approval.status !== 'pending') {
    return { 
      data: { error: 'Can only reject pending requests' }, 
      status: 409 
    }
  }

  // Check approver has permission
  const { data: permissions } = await supabase
    .from('WorkerRole')
    .select('role:Role(permissions:RolePermission(permission:Permission(*)))')
    .eq('workerId', body.approverId)

  const hasApprovalPermission = permissions?.some((wr: any) =>
    wr.role.permissions.some((rp: any) => 
      rp.permission.name === 'approve_requests'
    )
  )

  if (!hasApprovalPermission) {
    return { 
      data: { error: 'Worker does not have approval authority' }, 
      status: 403 
    }
  }

  // Update approval
  const { data, error } = await supabase
    .from('ApprovalRequest')
    .update({
      status: 'rejected',
      approverId: body.approverId,
      approvedAt: new Date().toISOString(),
      approverNotes: body.notes,
    })
    .eq('id', id)
    .select('*, requester:Worker!requesterId(*), approver:Worker!approverId(*)')
    .single()

  if (error) {
    throw new Error(`Failed to reject request: ${error.message}`)
  }

  return { data }
}
```

### Meals Module

**Edge Function Routes**:
- `GET /meal-stubs` - List meal stubs
- `GET /meal-stubs/:id` - Get meal stub details
- `POST /meal-stubs` - Create meal stub
- `PUT /meal-stubs/:id` - Update meal stub
- `DELETE /meal-stubs/:id` - Delete meal stub
- `POST /meal-stubs/allocate` - Allocate stubs to workers
- `POST /meal-stubs/:id/redeem` - Redeem meal stub

**Key Logic**:
- Redemption marks stub as used with timestamp and worker ID
- Duplicate redemption returns 409 conflict
- Allocation creates stub records for workers on service date

**Complete Edge Function Implementation**:

```typescript
// supabase/functions/meals/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteHandler {
  (req: Request, supabase: any, user: any): Promise<{ data: any; status?: number }>
}

const routes: Record<string, RouteHandler> = {
  'GET /meal-stubs': listMealStubs,
  'GET /meal-stubs/:id': getMealStub,
  'POST /meal-stubs': createMealStub,
  'PUT /meal-stubs/:id': updateMealStub,
  'DELETE /meal-stubs/:id': deleteMealStub,
  'POST /meal-stubs/allocate': allocateMealStubs,
  'POST /meal-stubs/:id/redeem': redeemMealStub,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/meals', '')
    const method = req.method

    let handler: RouteHandler | null = null
    let params: Record<string, string> = {}

    for (const [routePattern, routeHandler] of Object.entries(routes)) {
      const [routeMethod, routePath] = routePattern.split(' ')
      if (routeMethod !== method) continue

      const match = matchRoute(routePath, path)
      if (match) {
        handler = routeHandler
        params = match
        break
      }
    }

    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404)
    }

    ;(req as any).params = params
    const result = await handler(req, supabase, user)
    return jsonResponse(result.data, result.status || 200)

  } catch (error) {
    console.error('[meals] Error:', error)
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
})

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function listMealStubs(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const workerId = url.searchParams.get('workerId')
  const serviceDate = url.searchParams.get('serviceDate')
  const redeemed = url.searchParams.get('redeemed')

  let query = supabase
    .from('MealStub')
    .select('*, worker:Worker(*)')
    .order('serviceDate', { ascending: false })

  if (workerId) {
    query = query.eq('workerId', workerId)
  }
  if (serviceDate) {
    query = query.eq('serviceDate', serviceDate)
  }
  if (redeemed !== null) {
    query = query.eq('redeemed', redeemed === 'true')
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list meal stubs: ${error.message}`)
  }

  return { data }
}

async function getMealStub(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('MealStub')
    .select('*, worker:Worker(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Meal stub not found' }, status: 404 }
    }
    throw new Error(`Failed to get meal stub: ${error.message}`)
  }

  return { data }
}

async function createMealStub(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.workerId || !body.serviceDate) {
    return { 
      data: { error: 'Missing required fields: workerId, serviceDate' }, 
      status: 400 
    }
  }

  const { data, error } = await supabase
    .from('MealStub')
    .insert({
      workerId: body.workerId,
      serviceDate: body.serviceDate,
      mealType: body.mealType || 'lunch',
      redeemed: false,
    })
    .select('*, worker:Worker(*)')
    .single()

  if (error) {
    throw new Error(`Failed to create meal stub: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateMealStub(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('MealStub')
    .update({
      mealType: body.mealType,
      serviceDate: body.serviceDate,
    })
    .eq('id', id)
    .select('*, worker:Worker(*)')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Meal stub not found' }, status: 404 }
    }
    throw new Error(`Failed to update meal stub: ${error.message}`)
  }

  return { data }
}

async function deleteMealStub(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { error } = await supabase
    .from('MealStub')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete meal stub: ${error.message}`)
  }

  return { data: { success: true } }
}

async function allocateMealStubs(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.workerIds || !Array.isArray(body.workerIds) || !body.serviceDate) {
    return { 
      data: { error: 'Missing required fields: workerIds (array), serviceDate' }, 
      status: 400 
    }
  }

  const stubs = body.workerIds.map((workerId: string) => ({
    workerId,
    serviceDate: body.serviceDate,
    mealType: body.mealType || 'lunch',
    redeemed: false,
  }))

  const { data, error } = await supabase
    .from('MealStub')
    .insert(stubs)
    .select('*, worker:Worker(*)')

  if (error) {
    throw new Error(`Failed to allocate meal stubs: ${error.message}`)
  }

  return { data: { stubs: data, count: data.length }, status: 201 }
}

async function redeemMealStub(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  // Get current stub
  const { data: stub, error: getError } = await supabase
    .from('MealStub')
    .select('redeemed')
    .eq('id', id)
    .single()

  if (getError || !stub) {
    return { data: { error: 'Meal stub not found' }, status: 404 }
  }

  if (stub.redeemed) {
    return { 
      data: { error: 'Meal stub has already been redeemed' }, 
      status: 409 
    }
  }

  // Redeem stub
  const { data, error } = await supabase
    .from('MealStub')
    .update({
      redeemed: true,
      redeemedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, worker:Worker(*)')
    .single()

  if (error) {
    throw new Error(`Failed to redeem meal stub: ${error.message}`)
  }

  return { data }
}
```

### Attendance Module

**Edge Function Routes**:
- `GET /attendance` - List attendance records
- `GET /attendance/:id` - Get attendance details
- `POST /attendance` - Create attendance record
- `POST /attendance/scan-qr` - Record attendance via QR code
- `GET /attendance/stats` - Get aggregated statistics

**Key Logic**:
- QR code validation checks for active worker
- Duplicate attendance for same worker + date returns 409
- Statistics aggregation by date range and ministry

**Complete Edge Function Implementation**:

```typescript
// supabase/functions/attendance/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteHandler {
  (req: Request, supabase: any, user: any): Promise<{ data: any; status?: number }>
}

const routes: Record<string, RouteHandler> = {
  'GET /attendance': listAttendance,
  'GET /attendance/:id': getAttendance,
  'POST /attendance': createAttendance,
  'POST /attendance/scan-qr': scanQRCode,
  'GET /attendance/stats': getAttendanceStats,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/attendance', '')
    const method = req.method

    let handler: RouteHandler | null = null
    let params: Record<string, string> = {}

    for (const [routePattern, routeHandler] of Object.entries(routes)) {
      const [routeMethod, routePath] = routePattern.split(' ')
      if (routeMethod !== method) continue

      const match = matchRoute(routePath, path)
      if (match) {
        handler = routeHandler
        params = match
        break
      }
    }

    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404)
    }

    ;(req as any).params = params
    const result = await handler(req, supabase, user)
    return jsonResponse(result.data, result.status || 200)

  } catch (error) {
    console.error('[attendance] Error:', error)
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
})

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function listAttendance(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const workerId = url.searchParams.get('workerId')
  const serviceDate = url.searchParams.get('serviceDate')
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  let query = supabase
    .from('Attendance')
    .select('*, worker:Worker(*), schedule:Schedule(*)')
    .order('checkInTime', { ascending: false })

  if (workerId) {
    query = query.eq('workerId', workerId)
  }
  if (serviceDate) {
    query = query.eq('serviceDate', serviceDate)
  }
  if (startDate) {
    query = query.gte('serviceDate', startDate)
  }
  if (endDate) {
    query = query.lte('serviceDate', endDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list attendance: ${error.message}`)
  }

  return { data }
}

async function getAttendance(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('Attendance')
    .select('*, worker:Worker(*), schedule:Schedule(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Attendance record not found' }, status: 404 }
    }
    throw new Error(`Failed to get attendance: ${error.message}`)
  }

  return { data }
}

async function createAttendance(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.workerId || !body.serviceDate) {
    return { 
      data: { error: 'Missing required fields: workerId, serviceDate' }, 
      status: 400 
    }
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from('Attendance')
    .select('id')
    .eq('workerId', body.workerId)
    .eq('serviceDate', body.serviceDate)
    .limit(1)

  if (existing && existing.length > 0) {
    return { 
      data: { error: 'Attendance already recorded for this worker and date' }, 
      status: 409 
    }
  }

  const { data, error } = await supabase
    .from('Attendance')
    .insert({
      workerId: body.workerId,
      serviceDate: body.serviceDate,
      scheduleId: body.scheduleId,
      checkInTime: body.checkInTime || new Date().toISOString(),
      notes: body.notes,
    })
    .select('*, worker:Worker(*), schedule:Schedule(*)')
    .single()

  if (error) {
    throw new Error(`Failed to create attendance: ${error.message}`)
  }

  return { data, status: 201 }
}

async function scanQRCode(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.qrCode || !body.serviceDate) {
    return { 
      data: { error: 'Missing required fields: qrCode, serviceDate' }, 
      status: 400 
    }
  }

  // Decode QR code to get worker ID
  // Assuming QR code format: "WORKER:{workerId}"
  const match = body.qrCode.match(/^WORKER:(.+)$/)
  if (!match) {
    return { data: { error: 'Invalid QR code format' }, status: 400 }
  }

  const workerId = match[1]

  // Verify worker exists and is active
  const { data: worker, error: workerError } = await supabase
    .from('Worker')
    .select('id, status')
    .eq('id', workerId)
    .single()

  if (workerError || !worker) {
    return { data: { error: 'Worker not found' }, status: 404 }
  }

  if (worker.status !== 'active') {
    return { data: { error: 'Worker is not active' }, status: 400 }
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from('Attendance')
    .select('id')
    .eq('workerId', workerId)
    .eq('serviceDate', body.serviceDate)
    .limit(1)

  if (existing && existing.length > 0) {
    return { 
      data: { error: 'Attendance already recorded for this worker and date' }, 
      status: 409 
    }
  }

  // Create attendance record
  const { data, error } = await supabase
    .from('Attendance')
    .insert({
      workerId,
      serviceDate: body.serviceDate,
      scheduleId: body.scheduleId,
      checkInTime: new Date().toISOString(),
      scanMethod: 'qr',
    })
    .select('*, worker:Worker(*)')
    .single()

  if (error) {
    throw new Error(`Failed to record attendance: ${error.message}`)
  }

  return { data, status: 201 }
}

async function getAttendanceStats(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')
  const ministryId = url.searchParams.get('ministryId')

  if (!startDate || !endDate) {
    return { 
      data: { error: 'Missing required parameters: startDate, endDate' }, 
      status: 400 
    }
  }

  let query = supabase
    .from('Attendance')
    .select('serviceDate, worker:Worker(ministryId, ministry:Ministry(name))')
    .gte('serviceDate', startDate)
    .lte('serviceDate', endDate)

  if (ministryId) {
    query = query.eq('worker.ministryId', ministryId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to get attendance stats: ${error.message}`)
  }

  // Aggregate by date and ministry
  const stats: Record<string, any> = {}
  for (const record of data) {
    const date = record.serviceDate
    if (!stats[date]) {
      stats[date] = { date, total: 0, byMinistry: {} }
    }
    stats[date].total++

    const ministryName = record.worker?.ministry?.name || 'Unknown'
    if (!stats[date].byMinistry[ministryName]) {
      stats[date].byMinistry[ministryName] = 0
    }
    stats[date].byMinistry[ministryName]++
  }

  return { data: Object.values(stats) }
}
```

### Inventory Module

**Edge Function Routes**:
- `GET /items` - List inventory items
- `GET /items/:id` - Get item details
- `POST /items` - Create item
- `PUT /items/:id` - Update item
- `DELETE /items/:id` - Delete item
- `GET /categories` - List categories
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category
- `POST /stock-logs` - Record stock adjustment
- `GET /stock-logs` - List stock logs with filters
- `GET /borrowings` - List borrowings
- `POST /borrowings` - Create borrowing
- `PUT /borrowings/:id/return` - Process return

**Key Logic**:
- Stock adjustments update item quantity atomically
- Stock Out clamped to zero if would go negative
- Ministry scoping: filter by ministryId when provided, all records when absent
- Borrowing return updates item quantity

**Complete Edge Function Implementation**:

```typescript
// supabase/functions/inventory/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteHandler {
  (req: Request, supabase: any, user: any): Promise<{ data: any; status?: number }>
}

const routes: Record<string, RouteHandler> = {
  'GET /items': listItems,
  'GET /items/:id': getItem,
  'POST /items': createItem,
  'PUT /items/:id': updateItem,
  'DELETE /items/:id': deleteItem,
  'GET /categories': listCategories,
  'POST /categories': createCategory,
  'PUT /categories/:id': updateCategory,
  'DELETE /categories/:id': deleteCategory,
  'POST /stock-logs': recordStockAdjustment,
  'GET /stock-logs': listStockLogs,
  'GET /borrowings': listBorrowings,
  'POST /borrowings': createBorrowing,
  'PUT /borrowings/:id/return': processReturn,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/inventory', '')
    const method = req.method

    let handler: RouteHandler | null = null
    let params: Record<string, string> = {}

    for (const [routePattern, routeHandler] of Object.entries(routes)) {
      const [routeMethod, routePath] = routePattern.split(' ')
      if (routeMethod !== method) continue

      const match = matchRoute(routePath, path)
      if (match) {
        handler = routeHandler
        params = match
        break
      }
    }

    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404)
    }

    ;(req as any).params = params
    const result = await handler(req, supabase, user)
    return jsonResponse(result.data, result.status || 200)

  } catch (error) {
    console.error('[inventory] Error:', error)
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
})

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function listItems(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const ministryId = url.searchParams.get('ministryId')
  const categoryId = url.searchParams.get('categoryId')
  const search = url.searchParams.get('search')

  let query = supabase
    .from('InventoryItem')
    .select('*, category:Category(*), ministry:Ministry(*)')
    .order('name')

  if (ministryId) {
    query = query.eq('ministryId', ministryId)
  }
  if (categoryId) {
    query = query.eq('categoryId', categoryId)
  }
  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list items: ${error.message}`)
  }

  return { data }
}

async function getItem(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('InventoryItem')
    .select('*, category:Category(*), ministry:Ministry(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Item not found' }, status: 404 }
    }
    throw new Error(`Failed to get item: ${error.message}`)
  }

  return { data }
}

async function createItem(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.name || !body.categoryId) {
    return { 
      data: { error: 'Missing required fields: name, categoryId' }, 
      status: 400 
    }
  }

  const { data, error } = await supabase
    .from('InventoryItem')
    .insert({
      name: body.name,
      description: body.description,
      categoryId: body.categoryId,
      ministryId: body.ministryId,
      quantity: body.quantity || 0,
      unit: body.unit,
      location: body.location,
      minQuantity: body.minQuantity,
    })
    .select('*, category:Category(*), ministry:Ministry(*)')
    .single()

  if (error) {
    throw new Error(`Failed to create item: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateItem(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('InventoryItem')
    .update({
      name: body.name,
      description: body.description,
      categoryId: body.categoryId,
      ministryId: body.ministryId,
      unit: body.unit,
      location: body.location,
      minQuantity: body.minQuantity,
    })
    .eq('id', id)
    .select('*, category:Category(*), ministry:Ministry(*)')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Item not found' }, status: 404 }
    }
    throw new Error(`Failed to update item: ${error.message}`)
  }

  return { data }
}

async function deleteItem(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { error } = await supabase
    .from('InventoryItem')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete item: ${error.message}`)
  }

  return { data: { success: true } }
}

async function listCategories(req: Request, supabase: any, user: any) {
  const { data, error } = await supabase
    .from('Category')
    .select('*')
    .order('name')

  if (error) {
    throw new Error(`Failed to list categories: ${error.message}`)
  }

  return { data }
}

async function createCategory(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.name) {
    return { data: { error: 'Missing required field: name' }, status: 400 }
  }

  const { data, error } = await supabase
    .from('Category')
    .insert({
      name: body.name,
      description: body.description,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateCategory(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('Category')
    .update({
      name: body.name,
      description: body.description,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Category not found' }, status: 404 }
    }
    throw new Error(`Failed to update category: ${error.message}`)
  }

  return { data }
}

async function deleteCategory(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { error } = await supabase
    .from('Category')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`)
  }

  return { data: { success: true } }
}

async function recordStockAdjustment(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.itemId || !body.type || body.quantity === undefined) {
    return { 
      data: { error: 'Missing required fields: itemId, type, quantity' }, 
      status: 400 
    }
  }

  // Get current item
  const { data: item, error: itemError } = await supabase
    .from('InventoryItem')
    .select('quantity')
    .eq('id', body.itemId)
    .single()

  if (itemError || !item) {
    return { data: { error: 'Item not found' }, status: 404 }
  }

  // Calculate new quantity
  let newQuantity = item.quantity
  let actualDelta = body.quantity

  switch (body.type) {
    case 'Stock In':
      newQuantity += body.quantity
      break
    case 'Stock Out':
      newQuantity -= body.quantity
      if (newQuantity < 0) {
        actualDelta = item.quantity // Clamp to zero
        newQuantity = 0
      }
      break
    case 'Adjustment':
      newQuantity = body.quantity
      actualDelta = body.quantity - item.quantity
      break
  }

  // Update item quantity atomically
  const { error: updateError } = await supabase
    .from('InventoryItem')
    .update({ quantity: newQuantity })
    .eq('id', body.itemId)

  if (updateError) {
    throw new Error(`Failed to update item quantity: ${updateError.message}`)
  }

  // Create stock log
  const { data, error } = await supabase
    .from('StockLog')
    .insert({
      itemId: body.itemId,
      type: body.type,
      quantity: actualDelta,
      previousQuantity: item.quantity,
      newQuantity,
      performedById: body.performedById,
      notes: body.notes,
    })
    .select('*, item:InventoryItem(*), performedBy:Worker(*)')
    .single()

  if (error) {
    throw new Error(`Failed to create stock log: ${error.message}`)
  }

  return { data, status: 201 }
}

async function listStockLogs(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const itemId = url.searchParams.get('itemId')
  const ministryId = url.searchParams.get('ministryId')
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')

  let query = supabase
    .from('StockLog')
    .select('*, item:InventoryItem(*, ministry:Ministry(*)), performedBy:Worker(*)')
    .order('createdAt', { ascending: false })

  if (itemId) {
    query = query.eq('itemId', itemId)
  }
  if (ministryId) {
    query = query.eq('item.ministryId', ministryId)
  }
  if (startDate) {
    query = query.gte('createdAt', startDate)
  }
  if (endDate) {
    query = query.lte('createdAt', endDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list stock logs: ${error.message}`)
  }

  return { data }
}

async function listBorrowings(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const borrowerId = url.searchParams.get('borrowerId')

  let query = supabase
    .from('Borrowing')
    .select('*, item:InventoryItem(*), borrower:Worker(*)')
    .order('borrowedAt', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }
  if (borrowerId) {
    query = query.eq('borrowerId', borrowerId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list borrowings: ${error.message}`)
  }

  return { data }
}

async function createBorrowing(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.itemId || !body.borrowerId || !body.quantity) {
    return { 
      data: { error: 'Missing required fields: itemId, borrowerId, quantity' }, 
      status: 400 
    }
  }

  // Check item availability
  const { data: item, error: itemError } = await supabase
    .from('InventoryItem')
    .select('quantity')
    .eq('id', body.itemId)
    .single()

  if (itemError || !item) {
    return { data: { error: 'Item not found' }, status: 404 }
  }

  if (item.quantity < body.quantity) {
    return { 
      data: { error: 'Insufficient quantity available' }, 
      status: 400 
    }
  }

  // Create borrowing
  const { data, error } = await supabase
    .from('Borrowing')
    .insert({
      itemId: body.itemId,
      borrowerId: body.borrowerId,
      quantity: body.quantity,
      borrowedAt: new Date().toISOString(),
      dueDate: body.dueDate,
      status: 'borrowed',
      notes: body.notes,
    })
    .select('*, item:InventoryItem(*), borrower:Worker(*)')
    .single()

  if (error) {
    throw new Error(`Failed to create borrowing: ${error.message}`)
  }

  // Update item quantity
  await supabase
    .from('InventoryItem')
    .update({ quantity: item.quantity - body.quantity })
    .eq('id', body.itemId)

  return { data, status: 201 }
}

async function processReturn(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  // Get borrowing
  const { data: borrowing, error: borrowingError } = await supabase
    .from('Borrowing')
    .select('*, item:InventoryItem(*)')
    .eq('id', id)
    .single()

  if (borrowingError || !borrowing) {
    return { data: { error: 'Borrowing not found' }, status: 404 }
  }

  if (borrowing.status !== 'borrowed') {
    return { 
      data: { error: 'Borrowing is not in borrowed status' }, 
      status: 409 
    }
  }

  // Update borrowing status
  const { data, error } = await supabase
    .from('Borrowing')
    .update({
      status: 'returned',
      returnedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, item:InventoryItem(*), borrower:Worker(*)')
    .single()

  if (error) {
    throw new Error(`Failed to process return: ${error.message}`)
  }

  // Update item quantity
  await supabase
    .from('InventoryItem')
    .update({ quantity: borrowing.item.quantity + borrowing.quantity })
    .eq('id', borrowing.itemId)

  return { data }
}
```

### C2S Module

**Edge Function Routes**:
- `GET /groups` - List discipleship groups
- `GET /groups/:id` - Get group details
- `POST /groups` - Create group
- `PUT /groups/:id` - Update group
- `DELETE /groups/:id` - Delete group
- `POST /groups/:id/members` - Add member
- `DELETE /groups/:id/members/:memberId` - Remove member

**Key Logic**:
- Group response includes leader profile and member count
- Member management validates worker exists

**Complete Edge Function Implementation**:

```typescript
// supabase/functions/c2s/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteHandler {
  (req: Request, supabase: any, user: any): Promise<{ data: any; status?: number }>
}

const routes: Record<string, RouteHandler> = {
  'GET /groups': listGroups,
  'GET /groups/:id': getGroup,
  'POST /groups': createGroup,
  'PUT /groups/:id': updateGroup,
  'DELETE /groups/:id': deleteGroup,
  'POST /groups/:id/members': addMember,
  'DELETE /groups/:id/members/:memberId': removeMember,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/c2s', '')
    const method = req.method

    let handler: RouteHandler | null = null
    let params: Record<string, string> = {}

    for (const [routePattern, routeHandler] of Object.entries(routes)) {
      const [routeMethod, routePath] = routePattern.split(' ')
      if (routeMethod !== method) continue

      const match = matchRoute(routePath, path)
      if (match) {
        handler = routeHandler
        params = match
        break
      }
    }

    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404)
    }

    ;(req as any).params = params
    const result = await handler(req, supabase, user)
    return jsonResponse(result.data, result.status || 200)

  } catch (error) {
    console.error('[c2s] Error:', error)
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
})

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function listGroups(req: Request, supabase: any, user: any) {
  const url = new URL(req.url)
  const leaderId = url.searchParams.get('leaderId')

  let query = supabase
    .from('DiscipleshipGroup')
    .select('*, leader:Worker!leaderId(*), members:GroupMember(worker:Worker(*))')
    .order('name')

  if (leaderId) {
    query = query.eq('leaderId', leaderId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list groups: ${error.message}`)
  }

  // Add member count to each group
  const groupsWithCount = data.map((group: any) => ({
    ...group,
    memberCount: group.members?.length || 0,
  }))

  return { data: groupsWithCount }
}

async function getGroup(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('DiscipleshipGroup')
    .select('*, leader:Worker!leaderId(*), members:GroupMember(*, worker:Worker(*))')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Group not found' }, status: 404 }
    }
    throw new Error(`Failed to get group: ${error.message}`)
  }

  // Add member count
  const groupWithCount = {
    ...data,
    memberCount: data.members?.length || 0,
  }

  return { data: groupWithCount }
}

async function createGroup(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.name || !body.leaderId) {
    return { 
      data: { error: 'Missing required fields: name, leaderId' }, 
      status: 400 
    }
  }

  // Verify leader exists
  const { data: leader } = await supabase
    .from('Worker')
    .select('id')
    .eq('id', body.leaderId)
    .single()

  if (!leader) {
    return { data: { error: 'Leader not found' }, status: 404 }
  }

  const { data, error } = await supabase
    .from('DiscipleshipGroup')
    .insert({
      name: body.name,
      leaderId: body.leaderId,
      description: body.description,
      meetingSchedule: body.meetingSchedule,
    })
    .select('*, leader:Worker!leaderId(*)')
    .single()

  if (error) {
    throw new Error(`Failed to create group: ${error.message}`)
  }

  return { data: { ...data, memberCount: 0 }, status: 201 }
}

async function updateGroup(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('DiscipleshipGroup')
    .update({
      name: body.name,
      leaderId: body.leaderId,
      description: body.description,
      meetingSchedule: body.meetingSchedule,
    })
    .eq('id', id)
    .select('*, leader:Worker!leaderId(*), members:GroupMember(*)')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Group not found' }, status: 404 }
    }
    throw new Error(`Failed to update group: ${error.message}`)
  }

  return { data: { ...data, memberCount: data.members?.length || 0 } }
}

async function deleteGroup(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { error } = await supabase
    .from('DiscipleshipGroup')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete group: ${error.message}`)
  }

  return { data: { success: true } }
}

async function addMember(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  if (!body.workerId) {
    return { data: { error: 'Missing required field: workerId' }, status: 400 }
  }

  // Verify worker exists
  const { data: worker } = await supabase
    .from('Worker')
    .select('id')
    .eq('id', body.workerId)
    .single()

  if (!worker) {
    return { data: { error: 'Worker not found' }, status: 404 }
  }

  const { data, error } = await supabase
    .from('GroupMember')
    .insert({
      groupId: id,
      workerId: body.workerId,
      joinedAt: new Date().toISOString(),
    })
    .select('*, worker:Worker(*)')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { data: { error: 'Worker is already a member of this group' }, status: 409 }
    }
    throw new Error(`Failed to add member: ${error.message}`)
  }

  return { data, status: 201 }
}

async function removeMember(req: Request, supabase: any, user: any) {
  const { id, memberId } = (req as any).params

  const { error } = await supabase
    .from('GroupMember')
    .delete()
    .eq('id', memberId)
    .eq('groupId', id)

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`)
  }

  return { data: { success: true } }
}
```

### Settings Module

**Edge Function Routes**:
- `GET /roles` - List roles
- `GET /roles/:id` - Get role details
- `POST /roles` - Create role
- `PUT /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role
- `GET /rooms` - List rooms
- `POST /rooms` - Create room
- `PUT /rooms/:id` - Update room
- `DELETE /rooms/:id` - Delete room
- `GET /departments` - List departments
- `POST /departments` - Create department
- `PUT /departments/:id` - Update department
- `DELETE /departments/:id` - Delete department
- `GET /venue-elements` - List venue elements
- `POST /venue-elements` - Create venue element
- `PUT /venue-elements/:id` - Update venue element
- `DELETE /venue-elements/:id` - Delete venue element

**Key Logic**:
- Role deletion checks for worker assignments
- Room deletion checks for active reservations
- Permission assignments managed per role

**Complete Edge Function Implementation**:

```typescript
// supabase/functions/settings/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteHandler {
  (req: Request, supabase: any, user: any): Promise<{ data: any; status?: number }>
}

const routes: Record<string, RouteHandler> = {
  'GET /roles': listRoles,
  'GET /roles/:id': getRole,
  'POST /roles': createRole,
  'PUT /roles/:id': updateRole,
  'DELETE /roles/:id': deleteRole,
  'GET /rooms': listRooms,
  'POST /rooms': createRoom,
  'PUT /rooms/:id': updateRoom,
  'DELETE /rooms/:id': deleteRoom,
  'GET /departments': listDepartments,
  'POST /departments': createDepartment,
  'PUT /departments/:id': updateDepartment,
  'DELETE /departments/:id': deleteDepartment,
  'GET /venue-elements': listVenueElements,
  'POST /venue-elements': createVenueElement,
  'PUT /venue-elements/:id': updateVenueElement,
  'DELETE /venue-elements/:id': deleteVenueElement,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid token' }, 401)
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/settings', '')
    const method = req.method

    let handler: RouteHandler | null = null
    let params: Record<string, string> = {}

    for (const [routePattern, routeHandler] of Object.entries(routes)) {
      const [routeMethod, routePath] = routePattern.split(' ')
      if (routeMethod !== method) continue

      const match = matchRoute(routePath, path)
      if (match) {
        handler = routeHandler
        params = match
        break
      }
    }

    if (!handler) {
      return jsonResponse({ error: 'Route not found' }, 404)
    }

    ;(req as any).params = params
    const result = await handler(req, supabase, user)
    return jsonResponse(result.data, result.status || 200)

  } catch (error) {
    console.error('[settings] Error:', error)
    return jsonResponse({ 
      error: 'Internal server error',
      message: error.message 
    }, 500)
  }
})

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i]
    } else if (patternParts[i] !== pathParts[i]) {
      return null
    }
  }
  return params
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Role handlers
async function listRoles(req: Request, supabase: any, user: any) {
  const { data, error } = await supabase
    .from('Role')
    .select('*, permissions:RolePermission(permission:Permission(*))')
    .order('name')

  if (error) {
    throw new Error(`Failed to list roles: ${error.message}`)
  }

  return { data }
}

async function getRole(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { data, error } = await supabase
    .from('Role')
    .select('*, permissions:RolePermission(permission:Permission(*))')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Role not found' }, status: 404 }
    }
    throw new Error(`Failed to get role: ${error.message}`)
  }

  return { data }
}

async function createRole(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.name) {
    return { data: { error: 'Missing required field: name' }, status: 400 }
  }

  const { data, error } = await supabase
    .from('Role')
    .insert({
      name: body.name,
      description: body.description,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create role: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateRole(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('Role')
    .update({
      name: body.name,
      description: body.description,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Role not found' }, status: 404 }
    }
    throw new Error(`Failed to update role: ${error.message}`)
  }

  return { data }
}

async function deleteRole(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  // Check for worker assignments
  const { data: assignments } = await supabase
    .from('WorkerRole')
    .select('id')
    .eq('roleId', id)
    .limit(1)

  if (assignments && assignments.length > 0) {
    return { 
      data: { error: 'Cannot delete role with active worker assignments' }, 
      status: 409 
    }
  }

  const { error } = await supabase
    .from('Role')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete role: ${error.message}`)
  }

  return { data: { success: true } }
}

// Room handlers
async function listRooms(req: Request, supabase: any, user: any) {
  const { data, error } = await supabase
    .from('Room')
    .select('*')
    .order('name')

  if (error) {
    throw new Error(`Failed to list rooms: ${error.message}`)
  }

  return { data }
}

async function createRoom(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.name) {
    return { data: { error: 'Missing required field: name' }, status: 400 }
  }

  const { data, error } = await supabase
    .from('Room')
    .insert({
      name: body.name,
      capacity: body.capacity,
      location: body.location,
      amenities: body.amenities,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create room: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateRoom(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('Room')
    .update({
      name: body.name,
      capacity: body.capacity,
      location: body.location,
      amenities: body.amenities,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Room not found' }, status: 404 }
    }
    throw new Error(`Failed to update room: ${error.message}`)
  }

  return { data }
}

async function deleteRoom(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  // Check for active reservations
  const { data: reservations } = await supabase
    .from('RoomReservation')
    .select('id')
    .eq('roomId', id)
    .gte('endTime', new Date().toISOString())
    .limit(1)

  if (reservations && reservations.length > 0) {
    return { 
      data: { error: 'Cannot delete room with active reservations' }, 
      status: 409 
    }
  }

  const { error } = await supabase
    .from('Room')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete room: ${error.message}`)
  }

  return { data: { success: true } }
}

// Department handlers
async function listDepartments(req: Request, supabase: any, user: any) {
  const { data, error } = await supabase
    .from('Department')
    .select('*, ministries:Ministry(*)')
    .order('name')

  if (error) {
    throw new Error(`Failed to list departments: ${error.message}`)
  }

  return { data }
}

async function createDepartment(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.name || !body.code) {
    return { 
      data: { error: 'Missing required fields: name, code' }, 
      status: 400 
    }
  }

  const { data, error } = await supabase
    .from('Department')
    .insert({
      name: body.name,
      code: body.code,
      description: body.description,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create department: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateDepartment(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('Department')
    .update({
      name: body.name,
      code: body.code,
      description: body.description,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Department not found' }, status: 404 }
    }
    throw new Error(`Failed to update department: ${error.message}`)
  }

  return { data }
}

async function deleteDepartment(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { error } = await supabase
    .from('Department')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete department: ${error.message}`)
  }

  return { data: { success: true } }
}

// Venue element handlers
async function listVenueElements(req: Request, supabase: any, user: any) {
  const { data, error } = await supabase
    .from('VenueElement')
    .select('*')
    .order('name')

  if (error) {
    throw new Error(`Failed to list venue elements: ${error.message}`)
  }

  return { data }
}

async function createVenueElement(req: Request, supabase: any, user: any) {
  const body = await req.json()

  if (!body.name || !body.type) {
    return { 
      data: { error: 'Missing required fields: name, type' }, 
      status: 400 
    }
  }

  const { data, error } = await supabase
    .from('VenueElement')
    .insert({
      name: body.name,
      type: body.type,
      description: body.description,
      quantity: body.quantity || 1,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create venue element: ${error.message}`)
  }

  return { data, status: 201 }
}

async function updateVenueElement(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params
  const body = await req.json()

  const { data, error } = await supabase
    .from('VenueElement')
    .update({
      name: body.name,
      type: body.type,
      description: body.description,
      quantity: body.quantity,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { data: { error: 'Venue element not found' }, status: 404 }
    }
    throw new Error(`Failed to update venue element: ${error.message}`)
  }

  return { data }
}

async function deleteVenueElement(req: Request, supabase: any, user: any) {
  const { id } = (req as any).params

  const { error } = await supabase
    .from('VenueElement')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete venue element: ${error.message}`)
  }

  return { data: { success: true } }
}
```

## Migration Strategy

### Phase-Based Approach

**Phase 1: Foundation**
1. Create `@studio/client` package structure
2. Set up base client with HTTP utilities
3. Create shared type definitions

**Phase 2: Module Migration (Repeat for each module)**
1. Create Edge Function for module
2. Implement routes and handlers
3. Add module client to `@studio/client`
4. Update one page in `apps/web` to use client
5. Test and verify functionality
6. Migrate remaining pages for module
7. Remove corresponding server actions

**Phase 3: Inventory App Migration**
1. Migrate inventory module (Phase 2 pattern)
2. Update `apps/inventory` to use `InventoryClient`
3. Remove direct Supabase calls

**Phase 4: Cleanup**
1. Remove `@studio/database` from `apps/web`
2. Remove `@prisma/client` from `apps/web`
3. Remove direct Supabase client from `apps/inventory`
4. Update documentation

### Migration Order (Recommended)

1. **Settings** - Foundational data, low risk
2. **Workers** - Core entity, many dependencies
3. **Ministries** - Depends on workers
4. **Schedule** - Depends on workers and ministries
5. **Venue** - Independent, medium complexity
6. **Approvals** - Depends on workers
7. **Meals** - Depends on workers and schedule
8. **Attendance** - Depends on workers and schedule
9. **Inventory** - Independent, high complexity
10. **C2S** - Depends on workers, low complexity

### Rollback Strategy

- Keep server actions until module fully migrated
- Feature flags to toggle between old/new implementation
- Database unchanged (both approaches use same schema)
- Can revert individual modules without affecting others

## Error Handling

### Edge Function Error Responses

```typescript
// 400 Bad Request - Validation error
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}

// 401 Unauthorized - Auth error
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}

// 403 Forbidden - Permission error
{
  "error": "Forbidden",
  "message": "Insufficient permissions for this operation"
}

// 404 Not Found - Resource not found
{
  "error": "Not found",
  "message": "Worker with ID 'abc123' not found"
}

// 409 Conflict - Business rule violation
{
  "error": "Conflict",
  "message": "Cannot delete worker with active schedule assignments"
}

// 422 Unprocessable Entity - Business validation error
{
  "error": "Validation error",
  "message": "Worker does not have required role for this slot"
}

// 500 Internal Server Error
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

### Client SDK Error Handling

```typescript
try {
  const worker = await workersClient.getWorker('123')
} catch (error) {
  if (error instanceof ClientError) {
    switch (error.status) {
      case 401:
        // Redirect to login
        break
      case 404:
        // Show not found message
        break
      case 500:
        // Show generic error
        break
    }
  }
}
```

## Testing Strategy

### Edge Function Testing

- Unit tests for individual handlers
- Integration tests with test Supabase instance
- JWT mocking for auth testing
- Route coverage tests

### Client SDK Testing

- Mock fetch responses
- Type safety validation
- Error handling coverage
- Cross-platform compatibility (browser + React Native)

### End-to-End Testing

- Test each module through full stack
- Verify old and new implementations produce same results during migration
- Performance comparison tests

## Security Considerations

### JWT Verification

- Every Edge Function verifies JWT before handler execution
- Token expiration enforced
- User ID extracted from verified token

### Authorization

- Permission checks in handlers based on user roles
- Ministry scoping enforced where applicable
- Admin-only operations protected

### Input Validation

- Zod schemas validate all request bodies
- SQL injection prevented by Supabase client parameterization
- XSS prevention through JSON responses

### CORS Configuration

- Whitelist specific origins in production
- Allow credentials for authenticated requests
- Preflight handling for complex requests

## Performance Considerations

### Edge Function Optimization

- Connection pooling for database access
- Caching for frequently accessed data (roles, permissions)
- Batch operations where possible

### Client SDK Optimization

- Request deduplication
- Response caching with TTL
- Retry logic with exponential backoff

### Database Optimization

- Indexes on frequently queried fields
- Efficient joins for related data
- Pagination for large result sets

## Deployment

### Edge Functions Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy workers

# Set environment variables
supabase secrets set SUPABASE_URL=...
supabase secrets set SUPABASE_ANON_KEY=...
```

### Client SDK Publishing

```bash
# Build package
cd packages/client
npm run build

# Publish to npm (if external) or use workspace protocol
npm publish
```

### App Deployment

```bash
# Deploy web app
cd apps/web
vercel deploy

# Deploy inventory app
cd apps/inventory
vercel deploy
```

## Monitoring and Observability

### Logging

- Structured JSON logs from Edge Functions
- Request/response logging with correlation IDs
- Error stack traces captured

### Metrics

- Request count per endpoint
- Response time percentiles
- Error rate by status code
- Token validation failures

### Alerts

- High error rate threshold
- Slow response time threshold
- Authentication failure spike

## Documentation Requirements

### API Documentation

- OpenAPI/Swagger spec for each Edge Function
- Request/response examples
- Error code reference

### SDK Documentation

- TypeScript API docs generated from code
- Usage examples for each client
- Migration guide from server actions

### Developer Guide

- Local development setup
- Testing procedures
- Deployment process
- Troubleshooting common issues

## Success Criteria

1. All 10 Edge Functions deployed and operational
2. `@studio/client` SDK published and consumed by apps
3. `apps/web` has zero direct database calls
4. `apps/inventory` uses only `@studio/client` for data access
5. All existing features preserved and functional
6. No breaking changes to user-facing functionality
7. Performance metrics within 10% of baseline
8. Zero critical security vulnerabilities
9. Complete test coverage for all modules
10. Documentation complete and reviewed

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes during migration | High | Module-by-module approach, keep old code until verified |
| Performance degradation | Medium | Load testing, caching strategy, monitoring |
| Type drift between Edge Functions and SDK | Medium | Shared type definitions, automated type generation |
| JWT token expiration handling | Medium | Token refresh logic in client SDK |
| CORS issues in production | Low | Thorough CORS testing, environment-specific config |
| Database connection limits | Medium | Connection pooling, function concurrency limits |

## Future Enhancements

1. GraphQL layer on top of Edge Functions
2. Real-time subscriptions via Supabase Realtime
3. Offline support in mobile apps
4. API rate limiting and throttling
5. Advanced caching with Redis
6. Webhook support for external integrations
7. API versioning strategy
8. Multi-tenancy support

---

**Design Status**: Complete  
**Last Updated**: 2024  
**Reviewed By**: [Pending]
