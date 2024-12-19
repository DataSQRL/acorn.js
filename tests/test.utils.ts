import { expect } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

export class TestUtil {
  static assetsFolderPath = path.join(__dirname, "assets");

  static getAssetFile(filePath: string) {
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
      expect(JSON.parse(result)).toEqual(JSON.parse(expected));
    } else {
      fs.writeFileSync(assetPath, result, "utf-8");
      throw new Error(`Created snapshot: ${path.resolve(assetPath)}`);
    }
  }
}
