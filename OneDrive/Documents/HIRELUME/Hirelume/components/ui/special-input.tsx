import { styles } from "@/style";
import { Text, TextInput, View } from "react-native";

type SpecialInputProps = {
    placeholder?: string;
    placeholderTextColor?: string;
    label?: string;
    secureTextEntry?: boolean;
    value?: string;
    onChangeText?: (text: string) => void;
    borderColor?: string;
};

export const SpecialInput = ({
  placeholder = "type here...",
  placeholderTextColor = "white",
  label,
  secureTextEntry = false,
  value,
  onChangeText,
    borderColor,
}: SpecialInputProps) => {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};