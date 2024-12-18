import * as fs from "fs";
import * as path from "path";

export class TestUtil {
  static assetsFolderPath = path.join(__dirname, "assets");

  static getAssetFile(filePath: string) {
    console.log({ __dirname });
    const assetPath = path.join(TestUtil.assetsFolderPath, filePath);
    if (!assetPath) {
      throw new Error(`Invalid url: ${assetPath}`);
    }
    return assetPath;
  }

  static getAssetFileAsString(filePath: string): string {
    const filePathString = this.getAssetFile(filePath);
    return fs.readFileSync(filePathString, "utf-8");
  }

  static snapshotTestOrCreate(result: string, relativePath: string): void {
    const assetPath = path.join(TestUtil.assetsFolderPath, relativePath);
    if (fs.existsSync(assetPath)) {
      const expected = fs.readFileSync(assetPath, "utf-8");
      if (expected !== result) {
        throw new Error(
          `Expected and result do not match. Expected: ${expected}, Result: ${result}`
        );
      }
    } else {
      fs.writeFileSync(assetPath, result, "utf-8");
      throw new Error(`Created snapshot: ${path.resolve(assetPath)}`);
    }
  }
}
