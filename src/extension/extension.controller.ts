import { Body, Controller, Post, Res } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CreateBucketDto, CreateBucketResponseDto } from '../bucket/dto/bucket.dto'
import { ClassificationFailException, ClassificationFailResponse, SaveBucketFailExceptionResponse } from './extension.exeption'
import { Response } from 'express'
import { NotRegisterUserException } from '../user/user.exception'
import { firstValueFrom } from 'rxjs'
import { BucketService } from '../bucket/bucket.service'
import { LinkService } from '../link/link.service'
import { UserService } from '../user/user.service'
import { HttpService } from '@nestjs/axios'
import { SaveLinkFailExceptionResponse } from '../link/link.exception'

@ApiTags('Extension API')
@Controller('api/extension')
export class ExtensionController {
    constructor(
        private readonly bucketService: BucketService,
        private linkService: LinkService,
        private readonly userService: UserService,
        private httpService: HttpService,
    ) {}

    @ApiOperation({
        summary: '바구니 추가 API',
        description: '익스텐션을 통해 받아온 탭 정보를 바구니로 저장하고, AI 서버를 호출해 받아온 정보를 바탕으로 링크의 제목과 태그를 수정',
    })
    @ApiBody({ description: '받아오는 탭 정보', type: CreateBucketDto })
    @ApiResponse({ status: 201, description: '바구니 저장 성공', type: CreateBucketResponseDto })
    @ApiResponse({ status: 400, description: 'AI 호출 중 오류 발생', type: ClassificationFailResponse })
    @ApiResponse({ status: 400, description: '바구니 저장 실패', type: SaveBucketFailExceptionResponse })
    @ApiResponse({ status: 400, description: '링크 저장 실패', type: SaveLinkFailExceptionResponse })
    @Post('/')
    async create(@Body() createBucketDto: CreateBucketDto, @Res() res: Response) {
        const user = await this.userService.findByEmail(createBucketDto.email)
        if (!user) {
            throw new NotRegisterUserException()
        } else {
            const links = await this.linkService.createMany(createBucketDto.links, user.userId)
            const bucketId = await this.bucketService.create(createBucketDto.title, user.userId, links)
            res.status(201).send(bucketId)

            try {
                const aiResponse = await firstValueFrom(
                    this.httpService.post(`https://www.linket.site/ai/extract`, { links: links }, { timeout: 60000 }),
                )

                const updateLinkDto = aiResponse.data

                return this.linkService.updateLink(updateLinkDto)
            } catch (err) {
                throw new ClassificationFailException()
            }
        }
    }
}
