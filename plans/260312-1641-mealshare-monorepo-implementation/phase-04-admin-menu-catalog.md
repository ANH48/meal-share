---
title: "Phase 04 - Admin Menu Catalog"
status: pending
priority: P2
effort: 1.5h
---

# Phase 04: Admin Features - Menu Catalog

## Context Links
- Parent: [plan.md](./plan.md)
- Dependencies: Phase 02 (menu_items table), Phase 03 (auth + admin guard)

## Overview
Build admin-only CRUD for menu items (dish catalog) with image upload to Supabase Storage. Admin can create, edit, delete dishes that groups later select for weekly menus.

## Key Insights
- Menu items are global (not group-scoped) — admin creates the catalog
- Image upload via NestJS to Supabase Storage, return public URL
- Categories help organize dishes (e.g., rice, noodle, soup, drink)
- Soft-delete optional for menu items (hard delete acceptable if no orders reference it)

## Requirements

### Functional
- CRUD menu items: name, description, image, category
- Image upload to Supabase Storage (max 5MB, jpg/png/webp)
- List with search, filter by category, pagination
- Only admin role can access

### Non-functional
- Image optimization: resize to max 800px width before storage
- Pagination: cursor-based or offset (offset fine for admin)
- Response time < 500ms for list queries

## Architecture

### Data Flow
```
Admin UI → POST /menu-items (multipart) → NestJS → Upload to Supabase Storage → Save URL in DB
Admin UI → GET /menu-items?category=rice&page=1 → NestJS → Prisma query → response
```

## Related Code Files

### Files to Create (Backend)
- `apps/api/src/modules/menu-items/menu-items.module.ts`
- `apps/api/src/modules/menu-items/menu-items.controller.ts`
- `apps/api/src/modules/menu-items/menu-items.service.ts`
- `apps/api/src/modules/menu-items/dto/create-menu-item.dto.ts`
- `apps/api/src/modules/menu-items/dto/update-menu-item.dto.ts`
- `apps/api/src/modules/menu-items/dto/query-menu-item.dto.ts`

### Files to Create (Frontend)
- `apps/web/src/app/(dashboard)/admin/menu-items/page.tsx` — list view
- `apps/web/src/app/(dashboard)/admin/layout.tsx` — admin layout with guard
- `apps/web/src/components/admin/menu-item-form.tsx` — create/edit form (dialog)
- `apps/web/src/components/admin/menu-item-card.tsx` — card display
- `apps/web/src/lib/api/menu-items.ts` — API functions

### Files to Modify
- `apps/api/src/app.module.ts` — import MenuItemsModule

## Implementation Steps

1. **Create MenuItemsModule**
   - Import PrismaModule
   - Providers: MenuItemsService
   - Controllers: MenuItemsController

2. **Create DTOs**
   ```typescript
   export class CreateMenuItemDto {
     @IsString() @MinLength(2) name: string;
     @IsOptional() @IsString() description?: string;
     @IsOptional() @IsString() category?: string;
   }
   export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
   export class QueryMenuItemDto {
     @IsOptional() @IsString() search?: string;
     @IsOptional() @IsString() category?: string;
     @IsOptional() @Type(() => Number) @IsInt() page?: number = 1;
     @IsOptional() @Type(() => Number) @IsInt() limit?: number = 20;
   }
   ```

3. **Implement MenuItemsService**
   - `create(dto, file, userId)`: upload image → create record
   - `findAll(query)`: paginated list with search/filter
   - `findById(id)`: single item
   - `update(id, dto, file?)`: update record, replace image if new one
   - `remove(id)`: delete record + delete image from storage
   - `uploadImage(file)`: upload to Supabase Storage `menu-images` bucket, return public URL
   - `deleteImage(url)`: remove from Supabase Storage

4. **Implement MenuItemsController**
   - All endpoints protected with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles('admin')`
   - `POST /menu-items` — multipart form (file + JSON), use `@UseInterceptors(FileInterceptor('image'))`
   - `GET /menu-items` — query params for search/filter/pagination
   - `GET /menu-items/:id`
   - `PATCH /menu-items/:id` — partial update with optional new image
   - `DELETE /menu-items/:id`

5. **Install multer for file upload**
   ```bash
   cd apps/api && pnpm add @nestjs/platform-express multer
   pnpm add -D @types/multer
   ```

6. **Build Admin Layout** (`admin/layout.tsx`)
   - Check user role === 'admin', redirect if not
   - Sidebar with links: Menu Items, Groups, Users

7. **Build Menu Items List Page**
   - Data table with shadcn/ui (columns: image thumbnail, name, category, actions)
   - Search input, category filter dropdown
   - Pagination controls
   - "Add Item" button opens dialog

8. **Build Menu Item Form** (create/edit dialog)
   - shadcn/ui form: name, description, category dropdown, image upload dropzone
   - Image preview before upload
   - Submit sends multipart form data

9. **Build Menu Item Card** — thumbnail image, name, category badge, edit/delete buttons

## Todo List
- [ ] Create MenuItemsModule, Service, Controller
- [ ] Create DTOs with validation
- [ ] Implement image upload to Supabase Storage
- [ ] Implement CRUD endpoints with admin guard
- [ ] Install and configure multer for file uploads
- [ ] Build admin layout with role check
- [ ] Build menu items list page with data table
- [ ] Build create/edit dialog form
- [ ] Build delete confirmation
- [ ] Test: create item with image → list → edit → delete

## Success Criteria
- Admin can create menu item with image
- Image uploaded to Supabase Storage, URL stored in DB
- List page shows items with search and category filter
- Non-admin users get 403 on all endpoints
- Edit and delete work correctly

## Risk Assessment
- **Large image uploads**: Validate file size (max 5MB) and type before upload
- **Supabase Storage limits**: Free tier has 1GB; sufficient for MVP
- **Orphaned images**: Delete image from storage when deleting menu item

## Security Considerations
- Admin-only access enforced by RolesGuard
- File type validation (only jpg/png/webp)
- File size limit (5MB)
- Sanitize file names before storage

## Next Steps
- Phase 05: Group Management
