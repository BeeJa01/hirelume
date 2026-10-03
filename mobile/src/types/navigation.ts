import { NavigatorScreenParams } from '@react-navigation/native';
import { Job, Application } from './index';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PublicPortal: undefined;
  ApplicationResult: { resultToken?: string } | undefined;
};

export type RecruiterTabParamList = {
  Dashboard: undefined;
  Jobs: undefined;
  PublicPortal: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  RecruiterMain: NavigatorScreenParams<RecruiterTabParamList>;
  JobDetail: { jobId: string; initialJob?: Job };
  CreateJob: { jobToEdit?: Job } | undefined;
  ApplicantsList: { jobId: string; jobTitle?: string };
  ApplicantDetail: { applicationId: string; initialApplication?: Application };
  PublicJobDetail: { publicToken: string };
  JobApply: { publicToken: string; jobTitle: string };
  ApplicationResult: { resultToken?: string } | undefined;
};
