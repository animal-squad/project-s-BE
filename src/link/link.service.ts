import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { BodyTagDto, CreateLinkDto, DeleteLinkDto, UpdateLinkDto, UpdateTitleDto } from './dto/link.dto'
import { PaginatedLinkDto, PaginationQueryDto } from '../utils/pagination.dto'
import { SaveLinkFailException } from './link.exception'

@Injectable()
export class LinkService {
    constructor(private prisma: PrismaService) {}

    /**
     * 링크 생성
     * @param createLinkDto 생성할 링크 정보 목록
     * @param userId 사용자 식별자
     */
    async createMany(createLinkDto: CreateLinkDto[], userId: number) {
        try {
            return await this.prisma.$transaction(async tx => {
                const time = new Date()
                await tx.link.createMany({
                    data: createLinkDto.map(link => ({
                        URL: link.URL,
                        userId: userId,
                        createdAt: time,
                        openedAt: time,
                    })),
                })
                const createdLinks = await tx.link.findMany({
                    where: {
                        userId,
                        URL: {
                            in: createLinkDto.map(link => link.URL),
                        },
                        createdAt: time,
                    },
                    select: {
                        linkId: true,
                        URL: true,
                    },
                })

                const linkContentMap = new Map(createLinkDto.map(link => [link.URL, link.content || null]))
                return createdLinks.map(link => ({
                    linkId: link.linkId,
                    URL: link.URL,
                    content: linkContentMap.get(link.URL),
                }))
            })
        } catch (error) {
            throw new SaveLinkFailException()
        }
    }

    /**
     * 링크 제목, 태그, 키워드 업데이트
     * @param updateLinkDto 링크 id, 제목, 태그, 키워드
     */
    async updateLink(updateLinkDto: UpdateLinkDto) {
        return await this.prisma.$transaction(
            updateLinkDto.links.map(link =>
                this.prisma.link.update({
                    where: {
                        linkId: link.linkId,
                    },
                    data: {
                        title: link.title,
                        tags: link.tags,
                        keywords: link.keywords,
                    },
                }),
            ),
        )
    }

    /**
     * 조회수 및 열람일 업데이트
     * @param linkId 조회한 링크 식별자
     */
    async updateViewsAndOpenedAt(linkId: string) {
        return this.prisma.link.update({
            where: {
                linkId: linkId,
            },
            data: {
                views: {
                    increment: 1,
                },
                openedAt: new Date(),
            },
        })
    }

    /**
     * 링크 제목 변경
     * @param linkId 변경할 링크 식별자
     * @param updateTitleDto 변경할 제목
     */
    async updateTitle(linkId: string, updateTitleDto: UpdateTitleDto) {
        const title = updateTitleDto.title
        return this.prisma.link.update({
            where: {
                linkId: linkId,
            },
            data: {
                title: title,
            },
        })
    }

    /**
     * 태그 변경
     * @param linkId 변경할 링크
     * @param updateTagDto 변경할 태그
     */
    async updateTags(linkId: string, updateTagDto: BodyTagDto) {
        // TODO :  변동내역 로깅
        const tags = updateTagDto.tags
        return this.prisma.link.update({
            where: {
                linkId: linkId,
            },
            data: {
                tags: tags,
            },
        })
    }

    /**
     * 홈페이지에서 링크 저장
     * @param createLinkDto 저장할 링크 정보
     * @param userId 사용자 식별자
     */
    async createOne(createLinkDto: CreateLinkDto, userId: number) {
        const link = await this.prisma.link.create({
            data: {
                URL: createLinkDto.URL,
                userId: userId,
            },
        })
        return {
            linkId: link.linkId,
            URL: link.URL,
            content: null,
        }
    }

    /**
     * 링크 삭제(복수 삭제 가능)
     * @param deleteLinkDto 삭제할 링크 식별자 모음
     */
    async deleteLinks(deleteLinkDto: DeleteLinkDto) {
        const linkId = deleteLinkDto.linkId

        return this.prisma.$transaction([
            this.prisma.$queryRaw`
            UPDATE "Bucket"
            SET link = array_remove(link, ${linkId})
            WHERE link && ${linkId}
        `,
            this.prisma.link.deleteMany({
                where: {
                    linkId: {
                        in: linkId,
                    },
                },
            }),
        ])
    }

    /**
     * 링크 전체 조회 또는 태그 필터 조회
     * @param query 페이지 정보
     * @param tags 필터링 할 태그(없으면 전체 조회)
     * @param userId 사용자 식별자
     */
    async getLinks(query: PaginationQueryDto, tags: BodyTagDto, userId: number) {
        const page = Number(query.page) || 1
        const take = Number(query.take) || 10
        const tag = tags.tags || []

        const whereCondition: any = {
            userId: userId,
        }

        if (tag.length > 0) {
            whereCondition.tags = {
                hasSome: tag,
            }
        }

        const [links, totalLinks] = await Promise.all([
            this.prisma.link.findMany({
                skip: (page - 1) * take,
                take: take,
                where: whereCondition,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.link.count({
                where: whereCondition,
            }),
        ])

        return new PaginatedLinkDto(links, page, take, tag, totalLinks)
    }

    /**
     * 바구니에 포함된 링크들의 정보 조회
     * @param linkIds 링크 식별자 모음
     */
    async findMany(linkIds: string[]) {
        const links = await this.prisma.link.findMany({
            where: {
                linkId: {
                    in: linkIds,
                },
            },
        })
        return links
    }
}
