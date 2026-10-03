import { styles } from "@/style";
import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export default function login() {
    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }}>
                 <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View >
                        <Image
                            source={require('../assets/images/icon.png')}
                            style={{ width: '100%', height: 200, marginTop: 30, alignSelf: 'center' }}
                            resizeMode="contain"
                        />

                        <Text style={styles.text}>Welcome to Hirelume</Text>
                        <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'light', marginTop: 10 }}>Get matched with the right </Text>
                        <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'light', marginTop: 10 }}>opportunities and prepare</Text>
                        <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'light', marginTop: 10 }}>for your next interview</Text>
                    </View>
                    <View style={{ marginTop: 20  }} >
                        <Button
                            style={[styles.button , { backgroundColor: '#2563eb' }]}
                            color="white"
                            onPress={() => router.push('/login-inputs')}
                        >
                            Login
                        </Button>
                        <View style={{ marginTop: 5}}>
                            <Button 
                            style={[styles.button , { backgroundColor: 'white' , borderColor: '#2563eb' }]} 
                            color="blue" 
                            onPress={() => router.push('/sign-input')}
                            >
                            Signup
                            </Button>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
} 
