import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { apiClient } from '@/services/apiClient';
import type { ApiError, User } from '@/types';

type AccountScreenProps = {
  navigation: any;
};

export const AccountScreen = ({ navigation }: AccountScreenProps) => {
  const { user, logout, refreshUser } = useAuth();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const pickProfileImage = async () => {
    try {
      const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      const permission = currentPermission.granted
        ? currentPermission
        : currentPermission.canAskAgain
          ? await ImagePicker.requestMediaLibraryPermissionsAsync()
          : currentPermission;
      if (!permission.granted) {
        if (!permission.canAskAgain) {
          Alert.alert('Photo access is off', 'Allow photo access in Settings to choose a profile photo.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => void Linking.openSettings() },
          ]);
        } else {
          Alert.alert('Photo access needed', 'Allow photo-library access to choose a profile photo.');
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (result.canceled) return;

      const photo = result.assets[0];
      const manipulator = ImageManipulator.manipulate(photo.uri);
      if (photo.width > 800) manipulator.resize({ width: 800 });
      const rendered = await manipulator.renderAsync();
      const compressed = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
      const formData = new FormData();
      formData.append('file', {
        uri: compressed.uri,
        name: `profile-${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as unknown as Blob);

      setUpdatingAvatar(true);
      await apiClient.upload<{ user: User }>('/auth/me/avatar', formData, { timeout: 30000 });
      await refreshUser();
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert('Could not update profile photo', apiError.error?.message || 'Please try again.');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const removeProfileImage = async () => {
    setUpdatingAvatar(true);
    try {
      await apiClient.delete('/auth/me/avatar');
      await refreshUser();
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert('Could not remove profile photo', apiError.error?.message || 'Please try again.');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const chooseProfileImageAction = () => {
    if (updatingAvatar) return;
    Alert.alert('Profile photo', 'Choose an option.', [
      { text: 'Cancel', style: 'cancel' },
      { text: user?.avatar_url ? 'Change photo' : 'Choose photo', onPress: () => void pickProfileImage() },
      ...(user?.avatar_url ? [{
        text: 'Remove photo',
        style: 'destructive' as const,
        onPress: () => void removeProfileImage(),
      }] : []),
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of Hirelume?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void logout().catch((error: ApiError) => {
            Alert.alert('Could not log out', error.error?.message || 'Please try again.');
          });
        },
      },
    ]);
  };

  const handleConfirmDelete = async () => {
    const subject = 'Request to delete my Hirelume account data';
    const body = `Please help me request deletion of the Hirelume account and associated data for ${user?.email || 'my account'}.`;
    const emailUrl = `mailto:privacy@hirelume.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      if (!(await Linking.canOpenURL(emailUrl))) {
        throw new Error('No email app is available on this device.');
      }
      await Linking.openURL(emailUrl);
      setDeleteModalVisible(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not open your email app.';
      Alert.alert('Could not start deletion request', message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Account</Text>
          </View>

          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              onPress={chooseProfileImageAction}
              disabled={updatingAvatar}
              style={styles.avatarButton}
            >
              {updatingAvatar ? (
                <ActivityIndicator color="#0066FF" />
              ) : (
                <ProfileAvatar user={user} size={60} />
              )}
            </TouchableOpacity>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{user?.name || 'Hirelume user'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              <TouchableOpacity onPress={chooseProfileImageAction} disabled={updatingAvatar}>
                <Text style={styles.changePhotoText}>
                  {user?.avatar_url ? 'Change profile photo' : 'Add profile photo'}
                </Text>
              </TouchableOpacity>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {user?.role === 'recruiter' ? 'Recruiter' : 'Job seeker'}
                </Text>
              </View>
            </View>
          </View>

          {/* Settings / Action Menu List */}
          <View style={styles.menuContainer}>
            {/* 1. Privacy notice */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('PrivacyNotice')}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#0066FF" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Privacy notice</Text>
                <Text style={styles.menuSubtitle}>How we use your CV and job text</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 2. How scoring works */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('InsideHirelume')}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="options-outline" size={20} color="#0066FF" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>How scoring works</Text>
                <Text style={styles.menuSubtitle}>Met, partly met and not found</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 3. Ask for my data to be deleted */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => setDeleteModalVisible(true)}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="trash-outline" size={20} color="#0066FF" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Ask for my data to be deleted</Text>
                <Text style={styles.menuSubtitle}>Open an email to request deletion</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* 4. Help and contact */}
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('HelpContact')}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="help-circle-outline" size={20} color="#0066FF" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Help and contact</Text>
                <Text style={styles.menuSubtitle}>Guides and email support</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* Log Out Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Ionicons name="exit-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.logoutButtonText}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity
            style={styles.navTab}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="sparkles-outline" size={20} color="#94A3B8" />
            <Text style={styles.navTabLabel}>New</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MyAnalyses')}
          >
            <Ionicons name="document-text-outline" size={20} color="#94A3B8" />
            <Text style={styles.navTabLabel}>Analyses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Applications')}
          >
            <Ionicons name="briefcase-outline" size={20} color="#94A3B8" />
            <Text style={styles.navTabLabel}>Applications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navTab} activeOpacity={0.8}>
            <Ionicons name="person" size={20} color="#0066FF" />
            <Text style={[styles.navTabLabel, styles.navTabLabelActive]}>Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Data Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="trash" size={28} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>Delete all your data?</Text>
            <Text style={styles.modalDescription}>
              Hirelume does not currently offer in-app account deletion. This opens an email to the privacy team so you can request deletion. No data is deleted automatically from this screen.
            </Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalDeleteBtnText}>Request deletion</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  avatarButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
    marginBottom: 6,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    marginBottom: 10,
  },
  logoutButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    justifyContent: 'space-around',
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    flex: 1,
  },
  navTabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 4,
  },
  navTabLabelActive: {
    color: '#0066FF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    width: '100%',
    maxWidth: 380,
  },
  modalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#475569',
  },
  modalDeleteBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDeleteBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
