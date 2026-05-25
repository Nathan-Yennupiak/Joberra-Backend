import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../utils/email';

// The register function handles new user sign-ups
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extract the user's details from the incoming request body
    const { email, password, name } = req.body;

    // 2. Check if a user with this email already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // If they exist, we stop here and return a 409 Conflict error
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // 3. Hash the password for security (never store plain text passwords!)
    const hashedPassword = await hashPassword(password);

    // 4. Create the new user in the database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      // We only want to select safe fields to return (omitting the password)
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    // 5. Generate a JWT token so the user is logged in immediately after registering
    const token = generateToken(user.id);

    // 6. Send back the 201 Created status, along with the user data and token
    res.status(201).json({ user, token });
  } catch (error) {
    // If anything goes wrong, pass the error to our global error handler
    next(error);
  }
};

// The login function handles authenticating existing users
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get the email and password from the request
    const { email, password } = req.body;

    // 2. Try to find the user in the database by their email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If no user is found, return a 401 Unauthorized error
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Check if the provided password matches the hashed password in the database
    const isMatch = await comparePassword(password, user.password);

    // If the password doesn't match, return a 401 Unauthorized error
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. If credentials are correct, generate a new JWT token for them
    const token = generateToken(user.id);

    // 5. Send back a 200 OK status, along with their info (excluding password) and the token
    res.status(200).json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      }, 
      token 
    });
  } catch (error) {
    next(error);
  }
};

// Handles forgot password requests by generating a token and sending an email
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    // 1. Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return 200 OK even if user doesn't exist to prevent email enumeration attacks
      return res.status(200).json({ message: 'If an account with that email exists, we have sent a password reset link.' });
    }

    // 2. Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 3. Hash the token before storing it in the database for security
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 4. Set expiration time to 1 hour from now
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    // 5. Save the hashed token and expiration to the user's record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires,
      },
    });

    // 6. Send the UNHASHED token to the user's email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      res.status(200).json({ message: 'If an account with that email exists, we have sent a password reset link.' });
    } catch (error) {
      // If email sending fails, clear the token from the database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });
      return res.status(500).json({ message: 'There was an error sending the email. Try again later.' });
    }
  } catch (error) {
    next(error);
  }
};

// Handles resetting the password using the token sent to the user's email
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;

    // 1. Hash the incoming token to match what's stored in the database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find the user with this token AND ensure the token hasn't expired
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: {
          gt: new Date(), // Check if the expiration date is greater than the current time
        },
      },
    });

    // 3. If no user is found or token is expired, return an error
    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired.' });
    }

    // 4. Hash the new password
    const hashedPassword = await hashPassword(password);

    // 5. Update the user's password and clear the reset token fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // 6. Return success
    res.status(200).json({ message: 'Password has been successfully reset.' });
  } catch (error) {
    next(error);
  }
};

// Fetches the current user's profile data
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

// Updates the current user's profile (name, email, and/or password)
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const { name, email, currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Fetch the user to verify existence and get the current hashed password
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If they are trying to update their password
    let updatedHashedPassword = undefined;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }

      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }

      updatedHashedPassword = await hashPassword(newPassword);
    }

    // Check if they are trying to change their email to one that already exists
    if (email && email !== user.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }, // Make sure it's not their own current email
        },
      });

      if (existingEmail) {
        return res.status(409).json({ message: 'This email is already in use by another account' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(updatedHashedPassword && { password: updatedHashedPassword }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

