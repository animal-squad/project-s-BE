import { HttpException, HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class BucketNotFoundException extends HttpException {
    constructor() {
        super(
            {
                name: 'BucketNotFound',
                statusCode: HttpStatus.NOT_FOUND,
                errorCode: 751,
                message: 'Invalid BucketId',
            },
            HttpStatus.NOT_FOUND,
        )
    }
}

export class NoSearchWordException extends HttpException {
    constructor() {
        super(
            {
                name: 'NoSearchWord',
                statusCode: HttpStatus.BAD_REQUEST,
                errorCode: 752,
                message: 'Search keyword is not typed',
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
