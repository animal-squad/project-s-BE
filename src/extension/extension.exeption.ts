import { HttpException, HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class SaveBucketFailException extends HttpException {
    constructor() {
        super(
            {
                name: 'SaveBucketFail',
                statusCode: HttpStatus.BAD_REQUEST,
                errorCode: 751,
                message: 'Error during save bucket',
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}

export class SaveBucketFailExceptionResponse {
    @ApiProperty({ description: 'error name', example: 'SaveBucketFail' })
    name: string

    @ApiProperty({ description: 'http status code', example: '400' })
    statusCode: number

    @ApiProperty({ description: 'error code', example: '751' })
    errorCode: number

    @ApiProperty({ description: 'error message', example: 'Error during save bucket' })
    message: string
}

export class AIResponseNoDataException extends HttpException {
    constructor() {
        super(
            {
                name: 'AIResponseNoData',
                statusCode: HttpStatus.BAD_REQUEST,
                errorCode: 752,
                message: 'AI Response not found',
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}

export class ClassificationFailException extends HttpException {
    constructor() {
        super(
            {
                name: 'ClassificationFail',
                statusCode: HttpStatus.BAD_REQUEST,
                errorCode: 753,
                message: 'Error during AI classification operation',
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}

export class ClassificationFailResponse {
    @ApiProperty({ description: 'error name', example: 'ClassificationFail' })
    name: string

    @ApiProperty({ description: 'http status code', example: '400' })
    statusCode: number

    @ApiProperty({ description: 'error code', example: '753' })
    errorCode: number

    @ApiProperty({ description: 'error message', example: 'Error during AI classification operation' })
    message: string
}
