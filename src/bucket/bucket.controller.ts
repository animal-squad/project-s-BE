import { Controller, Get, Post, Body, Param, Delete, Query, Put } from '@nestjs/common'
import { BucketService } from './bucket.service'
import { BucketDto, BucketResponseDto, CreateBucketResponseDto, UpdateShareDto, UpdateShareResponseDto, UpdateTitleDto } from './dto/bucket.dto'
import { BucketUnauthorizedUserResponse, NotBucketOwnerResponse, NotLoginResponse } from '../user/user.exception'
import { GetUser } from '../user/user.decorator'
import { Bucket } from '@prisma/client'
import { PaginatedBucketDto, PaginationQueryDto } from '../utils/pagination.dto'
import { ApiBody, ApiCookieAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'

@ApiTags('Bucket API')
@ApiCookieAuth('connect.sid')
@ApiHeader({ name: 'Cookie', description: '세션 id가 저장된 쿠키', required: true })
@ApiResponse({ status: 401, description: '쿠키에 세션 정보 없음', type: NotLoginResponse })
@Controller('api/bucket')
export class BucketController {
    constructor(private readonly bucketService: BucketService) {}

    @ApiOperation({
        summary: '바구니 조회 API',
        description: '사용자의 모든 바구니 목록을 조회해 페이지네이션을 해서 제공',
    })
    @ApiQuery({ description: '페이지네이션을 위한 정보', type: PaginationQueryDto })
    @ApiResponse({ status: 200, description: '바구니 조회 성공', type: PaginatedBucketDto<Bucket> })
    @Get('/')
    async getAll(@Query() query: PaginationQueryDto, @GetUser() userId: number): Promise<PaginatedBucketDto<Bucket>> {
        return await this.bucketService.findAll(userId, query)
    }

    @ApiOperation({
        summary: '바구니 상세 조회 API',
        description: '특정 바구니의 페이지를 진입할 때 바구니의 상세 정보를 호출',
    })
    @ApiParam({ name: 'id', type: String, description: '바구니 id', example: 'H2dxSE24' })
    @ApiResponse({ status: 200, description: '바구니 조회 성공', type: BucketResponseDto })
    @ApiResponse({ status: 403, description: '공유된 바구니나 본인의 바구니가 아닌 경우 에러 발생', type: BucketUnauthorizedUserResponse })
    @Get('/:id')
    async getById(@Param('id') bucketId: string, @GetUser() userId: number) {
        return await this.bucketService.findOne(bucketId, userId)
    }

    @ApiOperation({
        summary: '바구니 공유하기 API',
        description: '특정 바구니의 공유 여부를 업데이트',
    })
    @ApiParam({ name: 'id', type: String, description: '바구니 id', example: 'H2dxSE24' })
    @ApiBody({ type: UpdateShareDto })
    @ApiResponse({ status: 200, description: '공유 여부 업데이트 성공', type: UpdateShareResponseDto })
    @Put('/:id/share')
    async updateIsShared(@Param('id') bucketId: string, @Body('permission') permission: boolean, @GetUser() userId: number) {
        return await this.bucketService.updateShare(bucketId, permission)
    }

    @ApiOperation({
        summary: '바구니 복사하기 API',
        description: '다른 사람의 공유된 바구니를 내 바구니로 복사',
    })
    @ApiParam({ name: 'id', type: String, description: '바구니 id', example: 'H2dxSE24' })
    @ApiBody({ type: BucketDto })
    @ApiResponse({ status: 201, description: '바구니 복사 완료', type: CreateBucketResponseDto })
    @Post('/:id/paste')
    async addPasteBucket(@Param('id') id: string, @Body('bucket') bucket: BucketDto, @GetUser() userId: number) {
        return await this.bucketService.createPastedBucket(bucket, userId)
    }

    @ApiOperation({
        summary: '바구니 제목 수정 API',
        description: '특정 바구니의 제목을 수정',
    })
    @ApiParam({ name: 'id', type: String, description: '바구니 id', example: 'H2dxSE24' })
    @ApiBody({ type: UpdateTitleDto })
    @ApiResponse({ status: 200, description: '바구니 제목 수정 성공', type: BucketDto })
    @ApiResponse({ status: 403, description: '본인의 바구니가 아닐 경우 에러 발생', type: NotBucketOwnerResponse })
    @Put('/:id')
    async updateTitle(@Param('id') bucketId: string, @Body('title') title: string, @GetUser() userId: number) {
        return await this.bucketService.updateBucketTitle(title, bucketId, userId)
    }

    @ApiOperation({
        summary: '바구니 삭제 API',
        description: '선택한 바구니(단일)를 삭제',
    })
    @ApiParam({ name: 'id', type: String, description: '바구니 id', example: 'H2dxSE24' })
    @ApiResponse({ status: 200, description: '바구니 삭제 완료' })
    @ApiResponse({ status: 403, description: '본인의 바구니가 아닐 경우 에러 발생', type: NotBucketOwnerResponse })
    @Delete('/:id')
    async deleteBucekt(@Param('id') bucketId: string, @GetUser() userId: number) {
        return await this.bucketService.deleteBucket(bucketId)
    }
}
