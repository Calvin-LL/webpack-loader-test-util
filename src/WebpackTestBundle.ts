import fs from "fs";
import Module from "module";
import path from "path";
import sharp from "sharp";
import webpack from "webpack";

interface Options {
  webpackVersion: 4 | 5;
  stats: webpack.Stats;
  compiler: webpack.Compiler;
}

const parentModule = module;

export class WebpackTestBundle {
  readonly webpackVersion: Options["webpackVersion"];
  readonly stats: Options["stats"];
  readonly compiler: Options["compiler"];

  constructor({ webpackVersion, stats, compiler }: Options) {
    this.webpackVersion = webpackVersion;
    this.stats = stats;
    this.compiler = compiler;
  }

  async readAssetAsPNG(assetName: string): Promise<Buffer> {
    const assetBuffer = this.readAsset(assetName, true);
    return await sharp(assetBuffer).png().toBuffer();
  }

  readAsset<T extends boolean, K = T extends true ? Buffer : string>(
    assetName: string,
    readAsBuffer?: T
  ): K {
    const usedFs = (this.compiler.outputFileSystem as unknown) as typeof fs;
    const outputPath = this.stats.compilation.outputOptions.path;
    const fileBuffer = usedFs.readFileSync(path.join(outputPath, assetName));

    if (readAsBuffer) return (fileBuffer as unknown) as K;

    return (fileBuffer.toString() as unknown) as K;
  }

  execute(assetName: string): any {
    const outputPath = this.stats.compilation.outputOptions.path;
    const code = this.readAsset(assetName);
    const resource = "test.js";
    const module = new Module(resource, parentModule);
    // @ts-expect-error using internal function
    module.paths = Module._nodeModulePaths(outputPath);
    module.filename = resource;

    // @ts-expect-error using internal function
    module._compile(
      `let __export__;${code};module.exports = __export__;`,
      resource
    );

    return module.exports;
  }
}
