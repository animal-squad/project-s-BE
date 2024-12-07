import { HttpException, HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class SaveLinkFailException extends HttpException {
    constructor() {
        super(
            {
                name: 'SaveLinkFail',
                statusCode: HttpStatus.BAD_REQUEST,
                errorCode: 851,
                message: 'Error during save link',
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}

export class SaveLinkFailExceptionResponse {
    @ApiProperty({ description: 'error name', example: 'SaveLinkFail' })
    name: string

    @ApiProperty({ description: 'http status code', example: '400' })
    statusCode: number

    @ApiProperty({ description: 'error code', example: '851' })
    errorCode: number

    @ApiProperty({ description: 'error message', example: 'Error during save link' })
    message: string
}
