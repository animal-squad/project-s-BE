import { Test, TestingModule } from '@nestjs/testing'
import { LinkService } from './link.service'
import { describe } from 'node:test'
import { PrismaService } from '../../prisma/prisma.service'

const mockLink = {
    linkId: 'test-linkId',
    URL: 'test-url',
    userId: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    openedAt: new Date('2024-01-02T00:00:00Z'),
    views: 0,
    tags: ['none'],
    keywords: ['a', 'b', 'c'],
    title: 'test-title',
}

const mockPrismaService = {
    link: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
    },
}

const mockPaginationQueryDto = {
    page: 1,
    take: 10,
}

const userId = 1

describe('LinkService', () => {
    let linkService: LinkService
    let prismaService: PrismaService

    beforeEach(async () => {
        jest.clearAllMocks()
        jest.resetAllMocks()
        jest.restoreAllMocks()

        const module: TestingModule = await Test.createTestingModule({
            providers: [LinkService, { provide: PrismaService, useValue: mockPrismaService }],
        }).compile()

        linkService = module.get<LinkService>(LinkService)
        prismaService = module.get<PrismaService>(PrismaService)
    })

    afterAll(async () => {
        jest.clearAllMocks()
        jest.resetAllMocks()
        jest.restoreAllMocks()
    })

    it('should be defined', () => {
        expect(linkService).toBeDefined()
    })

    describe('updateTags', () => {
        it('should update tags of link', async () => {
            const mockBodyTagDto = { tags: ['test1', 'test2', 'test3'] }
            const updateLink = { ...mockLink, tags: mockBodyTagDto }

            mockPrismaService.link.update.mockResolvedValue(updateLink)

            const result = await linkService.updateTags(mockLink.linkId, mockBodyTagDto)

            expect(prismaService.link.update).toHaveBeenCalledWith({
                where: { linkId: mockLink.linkId },
                data: { tags: mockBodyTagDto.tags },
            })
            expect(result).toEqual(updateLink)
        })
    })

    describe('deleteLinks', () => {
        it('should delete links and relations', async () => {
            const mockDeleteTagDto = { linkId: ['test1', 'test2', 'test3'] }

            mockPrismaService.link.deleteMany.mockResolvedValue({ count: 3 })
            await linkService.deleteLinks(mockDeleteTagDto)

            expect(mockPrismaService.link.deleteMany).toHaveBeenCalledWith({
                where: {
                    linkId: {
                        in: mockDeleteTagDto.linkId,
                    },
                },
            })
            expect(mockPrismaService.link.deleteMany).toHaveBeenCalled()
        })
        it('should delete only links', async () => {
            const mockDeleteTagDto = { linkId: ['test1', 'test2', 'test3'] }

            mockPrismaService.link.deleteMany.mockResolvedValue({ count: 3 })
            await linkService.deleteLinks(mockDeleteTagDto)

            expect(mockPrismaService.link.deleteMany).toHaveBeenCalledWith({
                where: {
                    linkId: {
                        in: mockDeleteTagDto.linkId,
                    },
                },
            })
            expect(mockPrismaService.link.deleteMany).toHaveBeenCalled()
        })
    })
    describe('getLinks', () => {
        it('should get all links', async () => {
            const mockBodyTagDto = { tags: null }
            const mockLinks = [
                {
                    linkId: 'link1',
                    userId: 1,
                    URL: 'test-url',
                    title: 'Test Link 1',
                    tags: ['web', 'mobile'],
                    keywords: ['a', 'b'],
                    createdAt: new Date(),
                    views: 0,
                    openedAt: new Date(),
                },
                {
                    linkId: 'link2',
                    userId: 1,
                    URL: 'test-url',
                    title: 'Test Link 2',
                    tags: ['ai'],
                    keywords: ['b'],
                    createdAt: new Date(),
                    views: 0,
                    openedAt: new Date(),
                },
                {
                    linkId: 'link3',
                    userId: 1,
                    URL: 'test=url',
                    title: 'Test Link 3',
                    tags: ['IT', 'web'],
                    keywords: ['c'],
                    createdAt: new Date(),
                    views: 0,
                    openedAt: new Date(),
                },
            ]
            mockPrismaService.link.findMany.mockResolvedValue(mockLinks)
            mockPrismaService.link.count.mockResolvedValue(3)
            const result = await linkService.getLinks(mockPaginationQueryDto, mockBodyTagDto, userId)

            expect(result.links).toEqual(mockLinks)
            expect(result.meta).toEqual({
                totalLinks: 3,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
                page: 1,
                take: 10,
                tag: [],
            })
            expect(prismaService.link.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 10,
                where: { userId: 1 },
                orderBy: { createdAt: 'desc' },
            })
        })
        it('should get links filtered by tags', async () => {
            const mockBody = { tags: ['web'] }
            const mockLinks = [
                {
                    linkId: 'link1',
                    userId: 1,
                    URL: 'test-url',
                    title: 'Test Link 1',
                    tags: ['web', 'mobile'],
                    createdAt: new Date(),
                    views: 0,
                    openedAt: new Date(),
                },
                {
                    linkId: 'link3',
                    userId: 1,
                    URL: 'test=url',
                    title: 'Test Link 3',
                    tags: ['IT', 'web'],
                    createdAt: new Date(),
                    views: 0,
                    openedAt: new Date(),
                },
            ]
            mockPrismaService.link.findMany.mockResolvedValue(mockLinks)
            mockPrismaService.link.count.mockResolvedValue(2)
            const result = await linkService.getLinks(mockPaginationQueryDto, mockBody, userId)

            expect(result.links).toEqual(mockLinks)
            expect(result.meta).toEqual({
                totalLinks: 2,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
                page: 1,
                take: 10,
                tag: ['web'],
            })
            expect(prismaService.link.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 10,
                where: { userId: 1, tags: { hasSome: ['web'] } },
                orderBy: { createdAt: 'desc' },
            })
        })
    })
})
