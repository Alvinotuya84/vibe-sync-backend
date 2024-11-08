import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle validation errors (BadRequestException with validation details)
    if (exception instanceof BadRequestException) {
      const validationResponse = this.handleValidationError(exception);
      response.status(HttpStatus.BAD_REQUEST).json(validationResponse);
      return;
    }

    // Handle other HTTP exceptions
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    response.status(status).json({
      success: false,
      message,
      data: null,
    });
  }

  private handleValidationError(exception: BadRequestException) {
    const validationErrors = exception.getResponse() as any;

    // If it's a validation error array
    if (Array.isArray(validationErrors.message)) {
      const formattedErrors = this.formatValidationErrors(
        validationErrors.message,
      );
      return {
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
        data: null,
      };
    }

    // If it's a single error message
    return {
      success: false,
      message: validationErrors.message,
      data: null,
    };
  }

  private formatValidationErrors(errors: string[]) {
    const formattedErrors: Record<string, string[]> = {};

    errors.forEach((error) => {
      const match = error.match(/^([^.]+?)\.(.+)$/);
      if (match) {
        const [, field, message] = match;
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(message);
      } else {
        if (!formattedErrors['general']) {
          formattedErrors['general'] = [];
        }
        formattedErrors['general'].push(error);
      }
    });

    return formattedErrors;
  }
}
