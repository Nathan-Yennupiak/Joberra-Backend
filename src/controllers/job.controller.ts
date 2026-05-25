import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

// Retrieves a list of all jobs from the database
export const getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, limit } = req.query;

    // Build the query constraints dynamically
    const whereClause: any = {};

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && typeof category === 'string' && category !== 'All') {
      whereClause.category = category;
    }

    // Determine limit
    const take = limit ? parseInt(limit as string, 10) : undefined;

    // 1. Fetch all jobs from Prisma matching the query
    const jobs = await prisma.job.findMany({
      where: whereClause,
      take,
      // Order the results so the newest jobs are at the top
      orderBy: { createdAt: 'desc' },
      // Include some basic information about the user who posted the job
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
    
    // 2. Return the list of jobs as JSON with a 200 OK status
    res.status(200).json(jobs);
  } catch (error) {
    // Pass any errors to the global error handler
    next(error);
  }
};

// Retrieves a single job by its ID
export const getJobById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Extract the job ID from the URL parameters (e.g., /api/jobs/:id)
    const id = req.params.id as string;
    
    // 2. Search for the job in the database by its ID
    const job = await prisma.job.findUnique({
      where: { id },
      // Include the user info just like we did in getAllJobs
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // 3. If the job doesn't exist, return a 404 Not Found error
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // 4. Return the job as JSON
    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
};

// Creates a new job posting
export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get the authenticated user's ID (added by our auth middleware)
    const userId = req.userId!;
    
    // 2. Extract the job details from the request body
    const { title, description, company, category, imageUrl, jobUrl } = req.body;

    // 3. Create the job in the database, linking it to the current user
    const job = await prisma.job.create({
      data: {
        title,
        description,
        company,
        category,
        imageUrl,
        jobUrl,
        userId,
      }
    });

    // 4. Return the newly created job with a 201 Created status
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
};

// Updates an existing job posting
export const updateJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get the user's ID and the target job's ID
    const userId = req.userId!;
    const id = req.params.id as string;
    
    // 2. Fetch the job to check if it exists and who owns it
    const job = await prisma.job.findUnique({ where: { id } });

    // If it doesn't exist, return a 404 error
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // 3. Authorization check: Make sure the logged-in user is the one who created this job
    if (job.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    // 4. Update the job with whatever new data was passed in the request body
    const updatedJob = await prisma.job.update({
      where: { id },
      data: req.body, // This works safely because we validated the body with Zod first
    });

    // 5. Return the updated job data
    res.status(200).json(updatedJob);
  } catch (error) {
    next(error);
  }
};

// Deletes a job posting
export const deleteJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get the user's ID and the target job's ID
    const userId = req.userId!;
    const id = req.params.id as string;
    
    // 2. Fetch the job to verify it exists and check ownership
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // 3. Authorization check: Only the job creator can delete it
    if (job.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    // 4. Delete the job from the database
    await prisma.job.delete({ where: { id } });

    // 5. Send a success message
    res.status(200).json({ message: `${job.title} Job by ${job.company} | deleted successfully` });
  } catch (error) {
    next(error);
  }
};
