import { SpecialInput } from "@/components/ui/special-input";
import { styles } from "@/style";
import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import { ScrollView, View , Text} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function LoginInputs() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ marginTop: 160,  alignSelf: 'center', alignItems: 'flex-start' }}>
            <Text style={[styles.text, { marginLeft: 50 }]}>Log in</Text>
            <Text style={{  marginLeft: 50, fontSize: 20, fontWeight: 'light', marginTop: 0 }}>
              Enter your email and password to continue
            </Text>
          </View>

         
         <View style={{ width: '85%', maxWidth: 360, alignSelf: 'center', marginTop: 20 }}>
          <SpecialInput
            label="Email"
            placeholder="Enter your email"
            placeholderTextColor="gray"
          />
            <SpecialInput
              label="Password"
              placeholder="Enter your password"
              placeholderTextColor="gray"
              secureTextEntry
              borderColor="blue"
            />

         </View>

         <View>
             <Button
               style={[styles.button , { backgroundColor: '#2563eb' , borderRadius: 10 }]}
               color="white"
               >
                Login
            </Button>

            <Text style={{ textAlign: 'center'}}>
              New to Hirelume?{" "}
              <Text
                style={{ color: '#2563eb' }}
                accessibilityRole="link"
                onPress={() => router.push('/sign-input')}
              >
                Sign up
              </Text>
            </Text>
         </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
