import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// This is a global error handler for our Express app.
// Any time a route throws an error or calls next(error), it ends up here.
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error for our own debugging purposes
  console.error(err);

  // 1. Handle Validation Errors from Zod
  // If the user sent bad data (like an invalid email or missing password),
  // Zod throws a ZodError. We catch it and send a 400 Bad Request back.
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation Error: Please check your input data',
      errors: err.issues, // This contains the specific details of what failed validation
    });
  }

  // 2. Handle Database Errors from Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 is Prisma's code for a "Unique constraint failed" error.
    // E.g., someone trying to register with an email that is already taken.
    if (err.code === 'P2002') {
      return res.status(409).json({
        message: 'Conflict: This record already exists in the database',
        target: err.meta?.target,
      });
    }
  }

  // 3. Handle Everything Else
  // If we don't recognize the error type, we just send a generic 500 error
  // so the server doesn't crash and the user gets a response.
  res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
};
