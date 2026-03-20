import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../../prisma/supabase.service';
import { CreateGroupDishDto } from './dto/create-group-dish.dto';
import { UpdateGroupDishDto } from './dto/update-group-dish.dto';

@Injectable()
export class GroupDishesService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  async list(groupId: string, userId: string) {
    await this.assertMember(groupId, userId);
    return this.prisma.menuItem.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(groupId: string, dto: CreateGroupDishDto, file: Express.Multer.File | undefined, userId: string) {
    await this.assertLeader(groupId, userId);
    const imageUrl = file ? await this.uploadImage(file) : undefined;
    return this.prisma.menuItem.create({
      data: { ...dto, groupId, createdBy: userId, ...(imageUrl ? { imageUrl } : {}) },
    });
  }

  async update(groupId: string, dishId: string, dto: UpdateGroupDishDto, file: Express.Multer.File | undefined, userId: string) {
    await this.assertLeader(groupId, userId);
    const dish = await this.prisma.menuItem.findFirst({ where: { id: dishId, groupId } });
    if (!dish) throw new NotFoundException('Dish not found in this group');
    const imageUrl = file ? await this.uploadImage(file) : undefined;
    return this.prisma.menuItem.update({
      where: { id: dishId },
      data: { ...dto, ...(imageUrl ? { imageUrl } : {}) },
    });
  }

  async remove(groupId: string, dishId: string, userId: string) {
    await this.assertLeader(groupId, userId);
    const dish = await this.prisma.menuItem.findFirst({ where: { id: dishId, groupId } });
    if (!dish) throw new NotFoundException('Dish not found in this group');
    if (dish.imageUrl) {
      const parts = dish.imageUrl.split('/menu-images/');
      const path = parts[1];
      if (path) await this.supabase.admin.storage.from('menu-images').remove([decodeURIComponent(path)]);
    }
    return this.prisma.menuItem.delete({ where: { id: dishId } });
  }

  private async uploadImage(file: Express.Multer.File): Promise<string> {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${Date.now()}-${sanitized}`;
    const { error } = await this.supabase.admin.storage
      .from('menu-images')
      .upload(path, file.buffer, { contentType: file.mimetype });
    if (error) {
      console.error('[GroupDishes] Storage upload error:', error);
      throw new InternalServerErrorException(`Failed to upload image: ${error.message}`);
    }
    const { data } = this.supabase.admin.storage.from('menu-images').getPublicUrl(path);
    return data.publicUrl;
  }

  private async assertMember(groupId: string, userId: string) {
    const m = await this.prisma.groupMember.findFirst({ where: { groupId, userId, status: 'active' } });
    if (!m) throw new ForbiddenException('Not a member of this group');
  }

  private async assertLeader(groupId: string, userId: string) {
    const m = await this.prisma.groupMember.findFirst({ where: { groupId, userId, status: 'active', role: 'leader' } });
    if (!m) throw new ForbiddenException('Only the group leader can manage dishes');
  }
}
