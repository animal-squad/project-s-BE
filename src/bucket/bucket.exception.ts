import { HttpException, HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class BucketNotFoundException extends HttpException {
    constructor() {
        super(
            {
                name: 'BucketNotFound',
                statusCode: HttpStatus.NOT_FOUND,
                errorCode: 701,
                message: 'Invalid BucketId',
            },
            HttpStatus.NOT_FOUND,
        )
    }
}
