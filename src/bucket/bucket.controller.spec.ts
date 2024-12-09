import { Test, TestingModule } from '@nestjs/testing'
import { BucketController } from './bucket.controller'
import { BucketService } from './bucket.service'
import { UserService } from '../user/user.service'
import { LinkService } from '../link/link.service'
import { describe } from 'node:test'
import { HttpStatus } from '@nestjs/common'

const mockBucketService = {
    searchBucket: jest.fn(),
}

const mockUserId = 1

describe('BucketController', () => {
    let bucketController: BucketController
    let bucketService: BucketService

    beforeEach(async () => {
        jest.clearAllMocks()
        jest.resetAllMocks()
        jest.restoreAllMocks()

        const module: TestingModule = await Test.createTestingModule({
            controllers: [BucketController],
            providers: [{ provide: BucketService, useValue: mockBucketService }],
        }).compile()

        bucketController = module.get<BucketController>(BucketController)
        bucketService = module.get<BucketService>(BucketService)
    })

    afterAll(async () => {
        jest.clearAllMocks()
        jest.resetAllMocks()
        jest.restoreAllMocks()
    })

    it('should be defined', () => {
        expect(bucketController).toBeDefined()
    })

    describe('searchBucket', () => {
        it('should get searched buckets', async () => {
            const mockQuery = { query: '바구니' }
            const expectedResult = {
                buckets: {
                    bucketId: 'KnNNaU8U',
                    userId: 1,
                    title: '2024. 11. 9. 오후 4:05:48에 생성된 바구니',
                    linkCount: 3,
                    createdAt: '2024-11-09T16:05:48.283Z',
                    isShared: false,
                },
                meta: {
                    totalBuckets: 1,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPrevPage: false,
                    page: 1,
                    take: 10,
                },
            }
            mockBucketService.searchBucket.mockResolvedValue(expectedResult)
            const result = await bucketController.searchBucket(mockQuery, mockUserId)

            expect(mockBucketService.searchBucket).toHaveBeenCalledWith(mockQuery, mockUserId)
            expect(result).toEqual(expectedResult)
        })

        it('should throw NoSearchWordException when query word is empty', async () => {
            const mockQuery = { query: '' }
            await expect(bucketController.searchBucket(mockQuery, mockUserId)).rejects.toMatchObject({
                response: {
                    name: 'NoSearchWord',
                    statusCode: HttpStatus.BAD_REQUEST,
                    errorCode: 752,
                    message: 'Search keyword is not typed',
                },
            })

            expect(mockBucketService.searchBucket).not.toHaveBeenCalled()
        })
    })
})
