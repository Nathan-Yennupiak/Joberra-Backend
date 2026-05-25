import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

// Toggle saving a job
export const toggleSavedJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const jobId = req.params.jobId as string;

    // Check if job exists
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already saved
    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    });

    if (existing) {
      // If already saved, unsave it
      await prisma.savedJob.delete({
        where: {
          id: existing.id
        }
      });
      return res.status(200).json({ message: 'Job removed from saved list', saved: false });
    } else {
      // If not saved, save it
      await prisma.savedJob.create({
        data: {
          userId,
          jobId
        }
      });
      return res.status(201).json({ message: 'Job saved successfully', saved: true });
    }
  } catch (error) {
    next(error);
  }
};

// Get all saved jobs for current user
export const getSavedJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map it to return just the job objects to match frontend expectations
    const jobs = savedJobs.map(sj => sj.job);

    res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};
