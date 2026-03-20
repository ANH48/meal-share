import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../../prisma/supabase.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { QueryMenuItemDto } from './dto/query-menu-item.dto';

@Injectable()
export class MenuItemsService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  async create(
    dto: CreateMenuItemDto,
    file: Express.Multer.File | undefined,
    userId: string,
  ) {
    let imageUrl: string | undefined;
    if (file) {
      imageUrl = await this.uploadImage(file);
    }

    return this.prisma.menuItem.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        imageUrl,
        createdBy: userId,
      },
    });
  }

  async findAll(query: QueryMenuItemDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { groupId: null };
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query.category) {
      where.category = query.category;
    }

    const [items, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.menuItem.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findById(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async update(
    id: string,
    dto: UpdateMenuItemDto,
    file: Express.Multer.File | undefined,
  ) {
    await this.findById(id);

    let imageUrl: string | undefined;
    if (file) {
      imageUrl = await this.uploadImage(file);
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: {
        ...dto,
        ...(imageUrl ? { imageUrl } : {}),
      },
    });
  }

  async remove(id: string) {
    const item = await this.findById(id);

    if (item.imageUrl) {
      const path = this.extractStoragePath(item.imageUrl);
      if (path) {
        await this.supabase.admin.storage.from('menu-images').remove([path]);
      }
    }

    await this.prisma.menuItem.delete({ where: { id } });
  }

  private async uploadImage(file: Express.Multer.File): Promise<string> {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${Date.now()}-${sanitized}`;

    const { error } = await this.supabase.admin.storage
      .from('menu-images')
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (error) {
      throw new InternalServerErrorException('Failed to upload image');
    }

    const { data } = this.supabase.admin.storage
      .from('menu-images')
      .getPublicUrl(path);

    return data.publicUrl;
  }

  private extractStoragePath(publicUrl: string): string | null {
    try {
      const parts = publicUrl.split('/menu-images/');
      return parts[1] ?? null;
    } catch {
      return null;
    }
  }
}
