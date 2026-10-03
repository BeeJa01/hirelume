import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Splash Screen styles (Screen 1)
  splashContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splash: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  splashLogoImage: {
    width: 240,
    height: 120,
    resizeMode: 'contain',
  },

  // Base Screen Layout
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },

  // Navigation Header
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  // Titles and Subtitles
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginTop: 6,
  },

  // Welcome Screen Hero Typography & Card (Screen 2)
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginVertical: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  welcomeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreBadgeContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  scoreCaption: {
    fontSize: 8,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  matchDetails: {
    flex: 1,
  },
  matchCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  companyName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  cardInputPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cardPromptText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  heroHeading: {
    fontSize: 27,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  heroDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 21,
    marginTop: 10,
  },

  // Badge / Pill for Role (Screen 3)
  rolePillBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginVertical: 14,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },

  // Forms and Inputs (Screen 3 & 4)
  formContainer: {
    marginTop: 12,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#111827',
  },
  inputFocused: {
    borderColor: '#0066FF',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066FF',
  },

  // Checkbox (Screen 3)
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#4B5563',
  },
  linkHighlight: {
    color: '#0066FF',
    fontWeight: '700',
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: '#0066FF',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  buttonSecondaryText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },

  // Bottom Footer Switch Text & Caption
  footerSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerSwitchText: {
    fontSize: 13,
    color: '#4B5563',
  },
  footerSwitchLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0066FF',
    marginLeft: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
});
