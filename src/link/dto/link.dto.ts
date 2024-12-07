import { ApiProperty } from '@nestjs/swagger'

class InputLinkDto {
    @ApiProperty({ description: 'Link Id', example: 'VxLHY9N9' })
    linkId: string

    @ApiProperty({ description: '링크의 제목', example: 'Github' })
    title?: string

    @ApiProperty({ description: '링크의 태그', example: ['개발'] })
    tags: string[]

    @ApiProperty({ description: '링크의 키워드', example: ['깃허브'] })
    keywords?: string[]
}

export class UpdateLinkDto {
    @ApiProperty({ description: 'Links id with tags and title' })
    links: InputLinkDto[]
}

export class CreateLinkDto {
    @ApiProperty({ description: '링크 URL', example: 'https://youtube.com' })
    URL: string

    @ApiProperty({ description: '링크 내용' })
    content?: string
}

export class LinkDto {
    @ApiProperty({ description: 'Link id', example: 'VxLHY9N9' })
    linkId: string

    @ApiProperty({ description: '링크 제목', example: 'test title' })
    title?: string

    @ApiProperty({ description: '링크의 태그', example: ['tag1', 'tag2'] })
    tags?: string[]

    @ApiProperty({ description: '링크의 키워드', example: ['keyword1'] })
    keywords: string[]

    @ApiProperty({ description: '링크 생성일', example: new Date() })
    createdAt: Date

    @ApiProperty({ description: '링크 열람일', example: new Date() })
    openedAt: Date

    @ApiProperty({ description: 'User id', example: 1 })
    userId: number

    @ApiProperty({ description: '링크 URL', example: 'https://link-bucket.animal-squad.uk' })
    URL: string

    @ApiProperty({ description: '링크 조회수', example: 0 })
    views: number
}

export class UpdateTitleDto {
    @ApiProperty({ description: '변경할 링크 제목', example: '멋져진 링크 제목' })
    title: string
}

export class BodyTagDto {
    @ApiProperty({ description: '변경할 태그', example: ['newTag1', 'newTag2', 'newTag3'] })
    tags: string[]
}

export class DeleteLinkDto {
    @ApiProperty({ description: '삭제할 링크의 id 모음', example: ['UhqcwGQg', 'Y0XW1Ep'] })
    linkId: string[]
}
