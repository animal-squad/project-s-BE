import { Injectable } from '@nestjs/common'
import { BucketDto } from './dto/bucket.dto'
import { PrismaService } from '../../prisma/prisma.service'
import { LinkService } from '../link/link.service'
import { PaginatedBucketDto, PaginationQueryDto } from '../utils/pagination.dto'
import { Bucket } from '@prisma/client'
import { BucketUnauthorizedUserException, NotBucketOwnerException } from '../user/user.exception'
import { BucketNotFoundException } from './bucket.exception'
import { SaveBucketFailException } from '../extension/extension.exeption'

@Injectable()
export class BucketService {
    constructor(
        private prisma: PrismaService,
        private readonly linkService: LinkService,
    ) {}

    /**
     * 바구니의 정보를 가져오기
     * @param bucketId 바구니 식별자
     */
    async getBucket(bucketId: string) {
        const bucket = await this.prisma.bucket.findUnique({
            where: {
                bucketId: bucketId,
            },
        })
        if (!bucket) {
            throw new BucketNotFoundException()
        }
        const links = await this.linkService.findMany(bucket.link)
        const response: BucketDto = {
            userId: bucket.userId,
            title: bucket.title,
            linkCount: bucket.link.length,
            createdAt: bucket.createdAt,
            isShared: bucket.isShared,
            links: links,
        }
        return response
    }

    /**
     * 바구니 생성하기
     * @param title 바구니 제목, null이 올 수 있음
     * @param userId 사용자 식별자
     * @param links 익스텐션에서 받아온 링크 정보
     */
    async create(title: string, userId: number, links) {
        const link = links.map(link => link.linkId)
        try {
            const bucket = await this.prisma.bucket.create({
                data: {
                    title: title || new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + '에 생성된 바구니',
                    userId: userId,
                    link: link,
                    createdAt: new Date(),
                },
            })
            return bucket.bucketId
        } catch (err) {
            throw new SaveBucketFailException()
        }
    }

    /**
     * 모든 바구니 조회하기
     * @param userId 사용자 식별자
     * @param query 페이지 정보
     */
    async findAll(userId: number, query: PaginationQueryDto): Promise<PaginatedBucketDto<Bucket>> {
        const page = Number(query.page) || 1
        const take = Number(query.take) || 10

        const [buckets, totalBuckets] = await Promise.all([
            this.prisma.bucket.findMany({
                skip: (page - 1) * take,
                take: take,
                where: {
                    userId: userId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.bucket.count({
                where: { userId: userId },
            }),
        ])

        const formattedBuckets = buckets.map(bucket => ({
            bucketId: bucket.bucketId,
            userId: userId,
            title: bucket.title,
            linkCount: bucket.link.length,
            createdAt: bucket.createdAt,
            link: bucket.link,
            isShared: false,
        }))
        return new PaginatedBucketDto(formattedBuckets, page, take, totalBuckets)
    }

    /**
     * 바구니 상세 조회
     * @param bucketId 바구니 식별자
     * @param userId 사용자 식별자
     */
    async findOne(bucketId: string, userId: number) {
        const bucket = await this.getBucket(bucketId)

        if (bucket.isShared === false && userId !== bucket.userId) {
            throw new BucketUnauthorizedUserException()
        }

        return { ...bucket, isMine: bucket.userId === userId }
    }

    /**
     * 공유 권한 변경
     * @param bucketId 바구니 식별자
     * @param permission 공유 권한
     */
    async updateShare(bucketId: string, permission: boolean) {
        const bucket = await this.prisma.bucket.update({
            where: {
                bucketId: bucketId,
            },
            data: {
                isShared: permission,
            },
        })

        return {
            isShared: bucket.isShared,
            shareURL: bucket.isShared ? `${process.env.URL}/bucket/${bucketId}` : '',
        }
    }

    /**
     * 바구니 복사
     * @param bucket 복사할 바구니 정보
     * @param userId 사용자 식별자
     */
    async createPastedBucket(bucket: BucketDto, userId: number) {
        const newLinks = await this.linkService.createMany(bucket.links, userId)

        const newBucket = await this.prisma.bucket.create({
            data: {
                title: bucket.title + '의 복사본',
                userId: userId,
                link: newLinks.map(link => link.linkId),
            },
        })

        return newBucket.bucketId
    }

    /**
     * 바구니 제목 변경
     * @param title 변경할 제목
     * @param bucketId 바구니 식별자
     * @param userId 사용자 식별자
     */
    async updateBucketTitle(title: string, bucketId: string, userId: number) {
        const bucket = await this.prisma.bucket.findUnique({
            where: {
                bucketId: bucketId,
            },
        })
        if (bucket.userId !== userId) {
            throw new NotBucketOwnerException()
        }
        return this.prisma.bucket.update({
            where: {
                bucketId: bucketId,
            },
            data: {
                title: title,
            },
        })
    }

    /**
     * 바구니 단일 삭제
     * @param bucketId 삭제할 바구니 식별자
     */
    async deleteBucket(bucketId: string) {
        const bucket = await this.getBucket(bucketId)

        const deleteLinks = this.prisma.link.deleteMany({
            where: {
                linkId: {
                    in: bucket.links.map(link => link.linkId),
                },
            },
        })
        const deleteBucket = this.prisma.bucket.delete({
            where: {
                bucketId: bucketId,
            },
        })
        return await this.prisma.$transaction([deleteLinks, deleteBucket])
    }
}
