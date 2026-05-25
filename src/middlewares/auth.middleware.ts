import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// This section tells TypeScript that we are adding a custom 'userId' property 
// to the standard Express Request object. This allows us to safely attach
// the logged-in user's ID to requests so other parts of our app can use it.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Middleware function to protect routes that require a logged-in user
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Look for the 'Authorization' header in the incoming request
  const authHeader = req.headers.authorization;

  // 2. Check if the header exists and starts with 'Bearer ' 
  // (which is the standard format for sending JWT tokens)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If not, block the request with a 401 Unauthorized status
    res.status(401).json({ message: 'Unauthorized: No token provided' });
    return;
  }

  // 3. Extract the actual token string (ignoring the 'Bearer ' part)
  const token = authHeader.split(' ')[1];

  try {
    // 4. Try to decode and verify the token using our secret key
    const decoded = verifyToken(token);
    
    // 5. If successful, attach the user's ID to the request object
    req.userId = decoded.userId;
    
    // 6. Call next() to pass control to the actual route handler (e.g., createJob)
    next();
  } catch (error) {
    // If verification fails (e.g., token is expired or fake), block the request
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
