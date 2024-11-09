import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query, Put } from '@nestjs/common'
import { Response } from 'express'
import { BucketService } from './bucket.service'
import { BucketDto, CreateBucketDto } from './dto/bucket.dto'
import { LinkService } from '../link/link.service'
import { UserService } from '../user/user.service'
import { NotRegisterUserException } from '../user/user.exception'
import { GetUser } from '../user/user.decorater'
import { User, Bucket } from '@prisma/client'
import { PaginatedBucketDto, PaginationQueryDto } from '../utils/pagination.dto'

@Controller('api/bucket')
export class BucketController {
    constructor(
        private readonly bucketService: BucketService,
        private linkService: LinkService,
        private readonly userService: UserService,
    ) {}

    @Post('/')
    async create(@Body() createBucketDto: CreateBucketDto, @Res() res: Response) {
        const user = await this.userService.findByEmail(createBucketDto.email)
        if (!user) {
            throw new NotRegisterUserException()
        } else {
            const bucketId = await this.bucketService.create(createBucketDto, user.userId)
            const linksId = this.linkService.createManyAndMapping(createBucketDto.links, user.userId, bucketId)

            return res.status(201).json(bucketId)
        }
        // TODO: AI API 호출
    }

    @Get('/')
    async getAll(@Query() query: PaginationQueryDto , @GetUser() user: User): Promise<PaginatedBucketDto<Bucket>> {
        return await this.bucketService.findAll(user.userId, query)
    }

    @Get('/:id')
    async getById(@Param('id') id: string , @GetUser() user: User) {
        const bucketId = Number(id)
        return await this.bucketService.findOne(bucketId, user.userId)
    }

    @Put('/:id/share')
    async updateIsShared(@Param('id') id: string, @Body('permission') permission: boolean) {
        const bucketId = Number(id)
        return await this.bucketService.updateShare(bucketId, permission)
    }

    @Post('/:id/paste')
    async addPasteBucket(@Param('id') id: string, @Body('bucket') bucket: BucketDto, @GetUser() user: User) {
        const bucketId = Number(id)
        return await this.bucketService.createPastedBucket(bucket, user.userId)
    }
}
