import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { Platform } from "react-native";

export async function pickJsonFromDevice(): Promise<{ value: unknown; name: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/json", "text/plain"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > 4 * 1024 * 1024) throw new Error("The selected file is larger than 4 MB. Molarum only imports compact JSON question banks.");
  const raw = Platform.OS === "web" && asset.file ? await asset.file.text() : await new File(asset.uri).text();
  try {
    return { value: JSON.parse(raw), name: asset.name };
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
}
