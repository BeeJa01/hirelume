export type UserRole = 'recruiter' | 'job_seeker';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_filename?: string | null;
  avatar_mime_type?: string | null;
  avatar_uploaded_at?: string | null;
  avatar_updated_at?: string | null;
  avatar_url?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type?: 'bearer';
  user: User;
}

export interface JobDescription {
  id: string;
  source: 'text' | 'image' | 'link';
  rawText: string;
  title: string | null;
  company: string | null;
  createdAt: string;
}

export interface CvSummary {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

export type InterviewQuestionCategory = 'technical' | 'behavioral' | 'cv_gaps';

export interface InterviewQuestion {
  category: InterviewQuestionCategory;
  question: string;
  tip: string;
}

export interface ResumeAnalysis {
  id: string;
  score: number;
  matchLevel: 'strong' | 'good' | 'partial';
  summary: string;
  breakdown: {
    skills: number;
    experience: number;
    education: number;
    keywords: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  questions: InterviewQuestion[];
  jobDescription: {
    title: string | null;
    company: string | null;
  } | null;
  createdAt: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export type RequirementType = 'required' | 'preferred' | 'nice-to-have';

export interface JobRequirement {
  text: string;
  requirement_type: RequirementType;
}

export type JobStatus = 'open' | 'closed';

export interface Job {
  id: string;
  _id?: string;
  title: string;
  description: string;
  requirements: JobRequirement[];
  feedback_enabled: boolean;
  blind_mode: boolean;
  status: JobStatus;
  public_token?: string;
  recruiter_id?: string;
  created_at: string;
  updated_at?: string;
  applicant_count?: number;
}

export interface CreateJobDto {
  title: string;
  description: string;
  requirements: JobRequirement[];
  feedback_enabled?: boolean;
  blind_mode?: boolean;
}

export interface UpdateJobDto {
  title?: string;
  description?: string;
  requirements?: JobRequirement[];
  feedback_enabled?: boolean;
  blind_mode?: boolean;
  status?: JobStatus;
}

export type ApplicationStatus =
  | 'pending'
  | 'applied'
  | 'reviewing'
  | 'shortlisted'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'hired';

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  changed_at: string;
  changed_by?: string;
  notes?: string;
}

export interface Application {
  id: string;
  _id?: string;
  job_id: string;
  job_title?: string;
  name: string;
  email: string;
  phone: string;
  cv_path?: string;
  cv_filename?: string;
  consent: boolean;
  consent_version: string;
  status: ApplicationStatus;
  analysis_status?: 'pending' | 'processing' | 'completed' | 'failed';
  result_token?: string;
  created_at: string;
  updated_at?: string;
  status_history?: StatusHistoryEntry[];
}

export interface ApplicationSubmissionDto {
  name: string;
  email: string;
  phone: string;
  consent: boolean;
  consent_version: string;
  cv: {
    uri: string;
    name: string;
    type: string;
    size?: number;
  };
}

export interface ApplicationSubmissionResponse {
  application_id: string;
  analysis_status: string;
  result_token: string;
  message?: string;
}

export interface PublicJob {
  title: string;
  description: string;
  requirements: JobRequirement[];
  feedback_enabled: boolean;
  blind_mode: boolean;
  status: JobStatus;
  created_at: string;
}

export interface ApplicationResultStatus {
  application_id: string;
  status: ApplicationStatus;
  analysis_status: string;
  feedback?: string;
  score?: number;
  job_title?: string;
  updated_at: string;
}
