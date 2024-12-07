import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { LinkService } from './link.service'
import { GetUser } from '../user/user.decorator'
import { BodyTagDto, CreateLinkDto, DeleteLinkDto, LinkDto, UpdateTitleDto } from './dto/link.dto'
import { firstValueFrom } from 'rxjs'
import { HttpService } from '@nestjs/axios'
import { PaginatedLinkDto, PaginationQueryDto } from '../utils/pagination.dto'
import { Link } from '@prisma/client'
import { ApiBody, ApiCookieAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { NotLoginResponse } from '../user/user.exception'
import { ClassificationFailResponse } from '../extension/extension.exeption'

@ApiTags('Link API')
@ApiCookieAuth('connect.sid')
@ApiHeader({ name: 'Cookie', description: '세션 id가 저장된 쿠키', required: true })
@ApiResponse({ status: 401, description: '쿠키에 세션 정보 없음', type: NotLoginResponse })
@Controller('api/link')
export class LinkController {
    constructor(
        private readonly linkService: LinkService,
        private httpService: HttpService,
    ) {}

    @ApiOperation({
        summary: '링크 조회수 업데이트 API',
        description: '링크 열람 시마다 조회수와 열람일을 업데이트',
    })
    @ApiParam({ name: 'id', type: String, description: '링크 id', example: 'dEw5E10v' })
    @ApiResponse({ status: 200, description: '조회수와 열람일 업데이트 완료', type: LinkDto })
    @Put('/:id/view')
    async updateViews(@Param('id') linkId: string, @GetUser() userId: number) {
        return await this.linkService.updateViewsAndOpenedAt(linkId)
    }

    @ApiOperation({
        summary: '링크 제목 수정 API',
        description: '특정 링크의 제목을 수정',
    })
    @ApiParam({ name: 'id', type: String, description: '링크 id', example: 'dEw5E10v' })
    @ApiBody({ type: UpdateTitleDto })
    @ApiResponse({ status: 200, description: '제목 수정 성공', type: LinkDto })
    @Put('/:id/title')
    async updateTitle(@Param('id') linkId: string, @Body() updateTitleDto: UpdateTitleDto, @GetUser() userId: number) {
        return await this.linkService.updateTitle(linkId, updateTitleDto)
    }

    @ApiOperation({
        summary: '링크 태그 수정 API',
        description: '특정 링크의 태그 수정',
    })
    @ApiParam({ name: 'id', type: String, description: '링크 id', example: 'dEw5E10v' })
    @ApiBody({ type: BodyTagDto })
    @ApiResponse({ status: 200, description: '태그 수정 성공', type: LinkDto })
    @Put('/:id/tag')
    async updateTags(@Param('id') linkId: string, @Body() updateTagDto: BodyTagDto, @GetUser() userId: number) {
        return await this.linkService.updateTags(linkId, updateTagDto)
    }

    @ApiOperation({
        summary: '링크 추가 API',
        description: '새로운 링크 저장',
    })
    @ApiBody({ type: CreateLinkDto })
    @ApiResponse({ status: 200, description: '태그 수정 성공', type: LinkDto })
    @ApiResponse({ status: 400, description: 'AI 호출 중 오류 발생', type: ClassificationFailResponse })
    @Post()
    async createLink(@Body() createLinkDto: CreateLinkDto, @GetUser() userId: number) {
        const link = await this.linkService.createOne(createLinkDto, userId)

        const aiResponse = await firstValueFrom(this.httpService.post(`${process.env.URL}/ai/extract`, { links: [link] }, { timeout: 60000 }))

        const updateLinkDto = aiResponse.data

        return await this.linkService.updateLink(updateLinkDto)
    }

    @ApiOperation({
        summary: '링크 삭제 API',
        description: '하나 또는 여러 개의 링크를 삭제',
    })
    @ApiBody({ type: DeleteLinkDto })
    @ApiResponse({
        status: 200,
        description: '태그 수정 성공',
        schema: {
            properties: {
                count: {
                    type: 'number',
                    example: 2,
                    description: '삭제된 링크의 수',
                },
            },
        },
    })
    @Delete()
    async deleteLinks(@Body() deleteLinkDto: DeleteLinkDto, @GetUser() userId: number) {
        return this.linkService.deleteLinks(deleteLinkDto)
    }

    @ApiOperation({
        summary: '링크 조회 API',
        description: '사용자의 전체 링크 조회 또는 태그에 따른 필터된 링크 조회',
    })
    @ApiQuery({ description: '페이지네이션을 위한 정보', type: PaginationQueryDto })
    @ApiBody({ type: BodyTagDto })
    @ApiResponse({ status: 200, description: '링크 조회 성공', type: PaginatedLinkDto<Link> })
    @Get()
    async getLinks(@Query() query: PaginationQueryDto, @Body() tags: BodyTagDto, @GetUser() userId: number): Promise<PaginatedLinkDto<Link>> {
        return this.linkService.getLinks(query, tags, userId)
    }
}
